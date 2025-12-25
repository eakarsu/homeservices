import type { CapacitorConfig } from '@capacitor/cli'

// Get environment-specific server URL
const serverUrl = process.env.CAPACITOR_SERVER_URL

const config: CapacitorConfig = {
  appId: 'com.servicecrew.tech',
  appName: 'ServiceCrew Tech',
  webDir: '.next',  // Next.js output directory
  server: {
    // For production, set CAPACITOR_SERVER_URL to your deployed URL
    // e.g., https://app.servicecrewai.com
    // For development, use your local network IP:
    // CAPACITOR_SERVER_URL=http://192.168.1.100:3000
    url: serverUrl,
    cleartext: serverUrl?.startsWith('http://') || false,
    androidScheme: 'https',
  },
  plugins: {
    Camera: {
      // Camera plugin configuration
      presentationStyle: 'fullScreen',
    },
    PushNotifications: {
      // Push notification configuration
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      // Geolocation plugin configuration
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#EA580C', // Primary orange color
      showSpinner: true,
      spinnerColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#EA580C',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'ServiceCrew Tech',
    preferredContentMode: 'mobile',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#FFFFFF',
  },
}

export default config
