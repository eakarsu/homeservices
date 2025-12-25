// Capacitor Native Features for Mobile App
// These functions work on mobile (Capacitor) and gracefully fallback on web

import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { PushNotifications } from '@capacitor/push-notifications'

// Dynamic imports for platform-specific features
let StatusBar: any = null
let SplashScreen: any = null
let Keyboard: any = null

// Load platform-specific plugins
if (typeof window !== 'undefined') {
  import('@capacitor/status-bar').then(module => { StatusBar = module.StatusBar }).catch(() => {})
  import('@capacitor/splash-screen').then(module => { SplashScreen = module.SplashScreen }).catch(() => {})
  import('@capacitor/keyboard').then(module => { Keyboard = module.Keyboard }).catch(() => {})
}

// Check if running in native app
export const isNative = () => Capacitor.isNativePlatform()
export const isIOS = () => Capacitor.getPlatform() === 'ios'
export const isAndroid = () => Capacitor.getPlatform() === 'android'

// ============================================
// CAMERA - Take photos on job sites
// ============================================

export interface PhotoResult {
  dataUrl: string // Base64 image data URL
  format: string
  saved: boolean
}

export async function takePhoto(): Promise<PhotoResult | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      saveToGallery: true,
    })

    return {
      dataUrl: image.dataUrl || '',
      format: image.format,
      saved: true,
    }
  } catch (error) {
    console.error('Camera error:', error)
    return null
  }
}

export async function pickPhoto(): Promise<PhotoResult | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    })

    return {
      dataUrl: image.dataUrl || '',
      format: image.format,
      saved: false,
    }
  } catch (error) {
    console.error('Photo picker error:', error)
    return null
  }
}

// Check camera permissions
export async function checkCameraPermission(): Promise<boolean> {
  try {
    const status = await Camera.checkPermissions()
    return status.camera === 'granted' && status.photos === 'granted'
  } catch {
    return false
  }
}

export async function requestCameraPermission(): Promise<boolean> {
  try {
    const status = await Camera.requestPermissions()
    return status.camera === 'granted'
  } catch {
    return false
  }
}

// ============================================
// GEOLOCATION - GPS tracking for technicians
// ============================================

export interface LocationResult {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export async function getCurrentLocation(): Promise<LocationResult | null> {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    })

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    }
  } catch (error) {
    console.error('Geolocation error:', error)
    return null
  }
}

// Watch position for real-time tracking
export async function watchLocation(
  callback: (location: LocationResult) => void,
  errorCallback?: (error: Error) => void
): Promise<string> {
  const watchId = await Geolocation.watchPosition(
    {
      enableHighAccuracy: true,
      timeout: 10000,
    },
    (position, err) => {
      if (err) {
        errorCallback?.(new Error(err.message))
        return
      }
      if (position) {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        })
      }
    }
  )

  return watchId
}

export async function stopWatchingLocation(watchId: string): Promise<void> {
  await Geolocation.clearWatch({ id: watchId })
}

// Check location permissions
export async function checkLocationPermission(): Promise<boolean> {
  try {
    const status = await Geolocation.checkPermissions()
    return status.location === 'granted'
  } catch {
    return false
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const status = await Geolocation.requestPermissions()
    return status.location === 'granted'
  } catch {
    return false
  }
}

// ============================================
// PUSH NOTIFICATIONS - Alert technicians
// ============================================

export interface PushToken {
  value: string
}

// Initialize push notifications
export async function initPushNotifications(
  onTokenReceived: (token: string) => void,
  onNotificationReceived: (notification: any) => void,
  onNotificationTapped: (notification: any) => void
): Promise<boolean> {
  if (!isNative()) {
    console.log('Push notifications only available on native platforms')
    return false
  }

  try {
    // Request permission
    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') {
      console.log('Push notification permission denied')
      return false
    }

    // Register for push
    await PushNotifications.register()

    // Listen for registration success
    PushNotifications.addListener('registration', (token: PushToken) => {
      console.log('Push registration success, token:', token.value)
      onTokenReceived(token.value)
    })

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error)
    })

    // Listen for incoming notifications (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
      console.log('Push notification received:', notification)
      onNotificationReceived(notification)
    })

    // Listen for notification taps (app opened from notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
      console.log('Push notification tapped:', notification)
      onNotificationTapped(notification.notification)
    })

    return true
  } catch (error) {
    console.error('Push notification init error:', error)
    return false
  }
}

// Check push notification permissions
export async function checkPushPermission(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const status = await PushNotifications.checkPermissions()
    return status.receive === 'granted'
  } catch {
    return false
  }
}

// ============================================
// UTILITY - Combined permission check
// ============================================

export interface PermissionStatus {
  camera: boolean
  location: boolean
  push: boolean
}

export async function checkAllPermissions(): Promise<PermissionStatus> {
  const [camera, location, push] = await Promise.all([
    checkCameraPermission(),
    checkLocationPermission(),
    checkPushPermission(),
  ])

  return { camera, location, push }
}

// ============================================
// STATUS BAR - Native status bar control
// ============================================

export async function setStatusBarStyle(style: 'dark' | 'light'): Promise<void> {
  if (!isNative() || !StatusBar) return
  try {
    await StatusBar.setStyle({ style: style === 'dark' ? 'Dark' : 'Light' })
  } catch (error) {
    console.error('StatusBar error:', error)
  }
}

export async function hideStatusBar(): Promise<void> {
  if (!isNative() || !StatusBar) return
  try {
    await StatusBar.hide()
  } catch (error) {
    console.error('StatusBar hide error:', error)
  }
}

export async function showStatusBar(): Promise<void> {
  if (!isNative() || !StatusBar) return
  try {
    await StatusBar.show()
  } catch (error) {
    console.error('StatusBar show error:', error)
  }
}

// ============================================
// SPLASH SCREEN - Control splash screen
// ============================================

export async function hideSplashScreen(): Promise<void> {
  if (!isNative() || !SplashScreen) return
  try {
    await SplashScreen.hide()
  } catch (error) {
    console.error('SplashScreen hide error:', error)
  }
}

// ============================================
// KEYBOARD - Keyboard control for forms
// ============================================

export async function hideKeyboard(): Promise<void> {
  if (!isNative() || !Keyboard) return
  try {
    await Keyboard.hide()
  } catch (error) {
    console.error('Keyboard hide error:', error)
  }
}

// ============================================
// APP INITIALIZATION - Call on app start
// ============================================

export async function initializeApp(): Promise<void> {
  if (!isNative()) return

  try {
    // Hide splash screen after a delay
    setTimeout(() => {
      hideSplashScreen()
    }, 1000)

    // Set status bar style
    await setStatusBarStyle('dark')
  } catch (error) {
    console.error('App initialization error:', error)
  }
}
