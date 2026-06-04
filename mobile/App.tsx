// FILE: mobile/App.tsx
import React, { useState } from 'react'
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native'
import { WebView } from 'react-native-webview'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000'

export default function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {!loaded && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#94a3b8" />
        </View>
      )}

      <WebView
        source={{ uri: WEB_URL }}
        style={[styles.webview, !loaded && styles.hidden]}
        onLoad={() => setLoaded(true)}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        sharedCookiesEnabled
      />
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
  hidden: {
    opacity: 0,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    zIndex: 10,
  },
})
