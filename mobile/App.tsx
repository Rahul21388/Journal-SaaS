// FILE: mobile/App.tsx
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

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL

// ── Error screen ────────────────────────────────────────────────────────────
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

// ── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={[styles.centred, StyleSheet.absoluteFillObject, { zIndex: 10 }]}>
      <ActivityIndicator size="large" color="#94a3b8" />
      <Text style={styles.loadingText}>Daily Journal</Text>
    </View>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const webViewRef = useRef<WebViewType>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState(0)

  const handleRetry = useCallback(() => {
    setError(null)
    setLoaded(false)
    setKey((k) => k + 1)
  }, [])

  // Hardware back button — navigate WebView back if possible
  useEffect(() => {
    if (Platform.OS !== 'android') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack()
        return true
      }
      return false
    })
    return () => sub.remove()
  }, [])

  // Missing env var — show config error immediately
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

      {/* Loading overlay — shown until first load completes */}
      {!loaded && !error && <LoadingScreen />}

      {error ? (
        <ErrorScreen message={error} onRetry={handleRetry} />
      ) : (
        <WebView
          key={key}
          ref={webViewRef}
          source={{ uri: WEB_URL }}
          style={styles.webview}
          // Auth & storage
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          // Loading
          startInLoadingState={true}
          renderLoading={() => <LoadingScreen />}
          // Events
          onLoad={() => setLoaded(true)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent
            setError(nativeEvent.description ?? 'Failed to load page.')
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent
            console.warn('[WebView] HTTP error:', nativeEvent.statusCode)
            if (nativeEvent.statusCode >= 500) {
              setError(`Server error (${nativeEvent.statusCode}). Please try again.`)
            }
          }}
          // Allow mixed content / inline media
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  webview: {
    flex: 1,
    backgroundColor: '#020617',
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
})
