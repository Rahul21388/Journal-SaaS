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
} from 'react-native'
import { WebView } from 'react-native-webview'
import type { WebView as WebViewType } from 'react-native-webview'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL

// How long to wait for the WebView to post a Firebase token via postMessage
const TOKEN_WAIT_MS = 8000

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
  // Only works on physical devices in a real EAS build
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const webViewRef = useRef<WebViewType>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState(0)
  // Holds the Firebase ID token injected from the WebView via postMessage
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
      webViewRef.current?.goBack()
      return true
    })
    return () => sub.remove()
  }, [])

  // ── Push registration — runs once after first successful load ─────────────
  const handlePushRegistration = useCallback(async () => {
    try {
      const expoPushToken = await registerForPushNotifications()
      if (!expoPushToken) return

      console.log('[push] Token acquired:', expoPushToken.slice(-12))

      // Wait up to TOKEN_WAIT_MS for the WebView to post a Firebase auth token
      const idToken = await waitForFirebaseToken(TOKEN_WAIT_MS)
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
      // Push registration is best-effort — never crash the app
      console.warn('[push] Registration error (non-fatal):', err)
    }
  }, [])

  // Poll firebaseTokenRef until token arrives or timeout
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

    // Inject JS to extract Firebase auth token and post it back to RN
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

    // Start push registration after a short delay (let JS settle)
    setTimeout(handlePushRegistration, 1500)
  }, [handlePushRegistration])

  // ── Handle messages from WebView ──────────────────────────────────────────
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

  // ── Missing env var ───────────────────────────────────────────────────────
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
})
