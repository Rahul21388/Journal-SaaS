// FILE: mobile/App.tsx
//
// Note: expo-notifications push token registration only works in a real EAS build.
// It will silently no-op in Expo Go. Run `eas build --platform android` to test.

import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  BackHandler,
  TouchableOpacity,
  Platform,
  Linking,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native'
import { WebView } from 'react-native-webview'
import type { WebView as WebViewType } from 'react-native-webview'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.rahulprakash.dailyjournal'

// ── Notification channel (Android) ───────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// ── Push token registration ───────────────────────────────────────────────────
async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[push] Not a physical device — skipping push registration')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('[push] Permission not granted')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('digest', {
      name: 'Weekly Digest',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    })
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync()
    return tokenData.data
  } catch (err) {
    console.warn('[push] Failed to get push token:', err)
    return null
  }
}

// ── Error screen ──────────────────────────────────────────────────────────────
function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.centred}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={[styles.centred, StyleSheet.absoluteFillObject, { zIndex: 10 }]}>
      <ActivityIndicator size="large" color="#94a3b8" />
      <Text style={styles.loadingText}>Daily Journal</Text>
    </View>
  )
}

// ── Settings modal ────────────────────────────────────────────────────────────
function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const handleRateApp = async () => {
    try {
      const supported = await Linking.canOpenURL(PLAY_STORE_URL)
      if (supported) {
        await Linking.openURL(PLAY_STORE_URL)
      } else {
        Alert.alert('Unable to open Play Store', 'Please search for "Daily Journal" on the Google Play Store.')
      }
    } catch (err) {
      console.error('[settings] Failed to open Play Store:', err)
      Alert.alert('Unable to open Play Store', 'Please try again later.')
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <SafeAreaView style={styles.modalSheet}>
          <TouchableOpacity activeOpacity={1}>
            {/* Handle bar */}
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Settings</Text>

            {/* Rate Your App */}
            <TouchableOpacity style={styles.settingsRow} onPress={handleRateApp} activeOpacity={0.7}>
              <Text style={styles.settingsRowIcon}>⭐</Text>
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsRowLabel}>Rate Your App</Text>
                <Text style={styles.settingsRowSub}>Share your feedback on Google Play</Text>
              </View>
              <Text style={styles.settingsRowChevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.sheetDivider} />

            {/* App version info */}
            <Text style={styles.sheetFooter}>Daily Journal · v1.0.0</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const webViewRef = useRef<WebViewType>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState(0)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const firebaseTokenRef = useRef<string | null>(null)

  const handleRetry = useCallback(() => {
    setError(null)
    setLoaded(false)
    setKey((k) => k + 1)
  }, [])

  // ── Hardware back button ──────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (settingsVisible) {
        setSettingsVisible(false)
        return true
      }
      webViewRef.current?.goBack()
      return true
    })
    return () => sub.remove()
  }, [settingsVisible])

  // ── Push registration — runs once after first successful load ─────────────
  const handlePushRegistration = useCallback(async () => {
    try {
      const expoPushToken = await registerForPushNotifications()
      if (!expoPushToken) return

      console.log('[push] Token acquired:', expoPushToken.slice(-12))

      const idToken = await waitForFirebaseToken(8000)
      if (!idToken) {
        console.warn('[push] No Firebase token received from WebView — skipping registration')
        return
      }

      const webUrl = WEB_URL ?? 'https://mydiary.rahulprakash.co.in'
      const res = await fetch(`${webUrl}/api/register-push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          token: expoPushToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        }),
      })

      if (res.ok) {
        console.log('[push] Token registered successfully')
      } else {
        const data = await res.json().catch(() => ({}))
        console.warn('[push] Registration failed:', data.error ?? res.status)
      }
    } catch (err) {
      console.warn('[push] Registration error (non-fatal):', err)
    }
  }, [])

  function waitForFirebaseToken(timeoutMs: number): Promise<string | null> {
    return new Promise((resolve) => {
      const start = Date.now()
      const interval = setInterval(() => {
        if (firebaseTokenRef.current) {
          clearInterval(interval)
          resolve(firebaseTokenRef.current)
        } else if (Date.now() - start >= timeoutMs) {
          clearInterval(interval)
          resolve(null)
        }
      }, 200)
    })
  }

  const handleLoad = useCallback(() => {
    setLoaded(true)

    webViewRef.current?.injectJavaScript(`
      (function() {
        try {
          var keys = Object.keys(window.localStorage || {});
          for (var i = 0; i < keys.length; i++) {
            if (keys[i].startsWith('firebase:authUser')) {
              var user = JSON.parse(localStorage.getItem(keys[i]) || '{}');
              if (user && user.stsTokenManager && user.stsTokenManager.accessToken) {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ type: 'FIREBASE_TOKEN', token: user.stsTokenManager.accessToken })
                );
                break;
              }
            }
          }
        } catch(e) {}
      })();
      true;
    `)

    setTimeout(handlePushRegistration, 1500)
  }, [handlePushRegistration])

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      if (msg.type === 'FIREBASE_TOKEN' && msg.token) {
        firebaseTokenRef.current = msg.token
      }
    } catch {
      // ignore non-JSON messages
    }
  }, [])

  if (!WEB_URL) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <ErrorScreen
          message="EXPO_PUBLIC_WEB_URL is not configured. Add it to your .env file and rebuild."
          onRetry={() => {}}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {!loaded && !error && <LoadingScreen />}

      {error ? (
        <ErrorScreen message={error} onRetry={handleRetry} />
      ) : (
        <WebView
          key={key}
          ref={webViewRef}
          source={{ uri: WEB_URL }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          startInLoadingState={true}
          renderLoading={() => <LoadingScreen />}
          onLoad={handleLoad}
          onMessage={handleMessage}
          onError={(e) => setError(e.nativeEvent.description ?? 'Failed to load page.')}
          onHttpError={(e) => {
            console.warn('[WebView] HTTP error:', e.nativeEvent.statusCode)
            if (e.nativeEvent.statusCode >= 500) {
              setError(`Server error (${e.nativeEvent.statusCode}). Please try again.`)
            }
          }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      )}

      {/* Floating settings button — only visible after load */}
      {loaded && !error && (
        <TouchableOpacity
          style={styles.settingsFab}
          onPress={() => setSettingsVisible(true)}
          activeOpacity={0.8}
          accessibilityLabel="Open settings"
        >
          <Text style={styles.settingsFabIcon}>⚙️</Text>
        </TouchableOpacity>
      )}

      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#020617' },
  webview:     { flex: 1, backgroundColor: '#020617' },
  centred:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', paddingHorizontal: 32 },
  loadingText: { marginTop: 16, color: '#94a3b8', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  errorIcon:   { fontSize: 40, marginBottom: 12 },
  errorTitle:  { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  errorMessage:{ color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  retryBtn:    { backgroundColor: '#f1f5f9', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryText:   { color: '#0f172a', fontWeight: '700', fontSize: 14 },

  // Floating settings button
  settingsFab: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  settingsFabIcon: { fontSize: 18 },

  // Settings modal / bottom sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    marginTop: 12,
    marginBottom: 20,
  },
  sheetTitle: {
    color: '#f1f5f9',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 20,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 16,
  },
  sheetFooter: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
  },

  // Settings rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    gap: 12,
  },
  settingsRowIcon: { fontSize: 22 },
  settingsRowContent: { flex: 1 },
  settingsRowLabel: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  settingsRowSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  settingsRowChevron: { color: '#475569', fontSize: 22, fontWeight: '300' },
})
