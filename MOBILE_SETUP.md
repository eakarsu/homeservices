# ServiceCrew Tech Mobile App Setup

This guide explains how to build and deploy the ServiceCrew Tech mobile app for iOS and Android using Capacitor.

## Prerequisites

- Node.js 20+
- For iOS: macOS with Xcode 15+ installed
- For Android: Android Studio with SDK installed
- A deployed server URL (the mobile app connects to your server)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Server URL

Set the `CAPACITOR_SERVER_URL` environment variable to your deployed server:

```bash
# For production
export CAPACITOR_SERVER_URL=https://app.servicecrewai.com

# For development (use your machine's local IP)
export CAPACITOR_SERVER_URL=http://192.168.1.100:3000
```

### 3. Sync Native Projects

```bash
npm run cap:sync
```

### 4. Open in IDE

```bash
# For iOS (opens Xcode)
npm run mobile:ios

# For Android (opens Android Studio)
npm run mobile:android
```

## Development Workflow

### Running the Dev Server

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Find your local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig
   ```

3. Set the server URL and run on device:
   ```bash
   export CAPACITOR_SERVER_URL=http://YOUR_LOCAL_IP:3000
   npm run cap:sync
   npm run mobile:dev:ios  # or mobile:dev:android
   ```

### Live Reload (iOS)

For live reload during development on iOS:

1. In `capacitor.config.ts`, the `server.url` is set from environment variable
2. Make sure your device is on the same network as your dev machine
3. Run the app from Xcode

## App Icons & Splash Screens

### Generating Icons

1. Use the base icon at `public/icons/icon.svg`
2. Generate PNG icons using a tool like:
   - [Capacitor Assets](https://github.com/ionic-team/capacitor-assets): `npx @capacitor/assets generate`
   - [App Icon Generator](https://appicon.co/)
   - Figma or other design tools

3. Required icon sizes:
   - iOS: 20, 29, 40, 60, 76, 83.5, 1024 (at 1x, 2x, 3x scales)
   - Android: 48, 72, 96, 144, 192 (mdpi to xxxhdpi)

### Splash Screen

Update the splash screen in `capacitor.config.ts`:
```typescript
SplashScreen: {
  launchShowDuration: 2000,
  backgroundColor: '#EA580C',
  showSpinner: true,
  spinnerColor: '#FFFFFF',
}
```

## iOS Setup

### 1. Open Xcode Project

```bash
npm run mobile:ios
```

### 2. Configure Signing

1. Select the project in the navigator
2. Go to "Signing & Capabilities"
3. Select your Team
4. Update the Bundle Identifier if needed

### 3. Configure Permissions

The following permissions are already configured in `ios/App/App/Info.plist`:
- Camera access for job photos
- Location access for technician tracking
- Push notifications for job alerts

### 4. Build & Run

1. Select your target device
2. Click the Run button or press `Cmd+R`

## Android Setup

### 1. Open Android Studio

```bash
npm run mobile:android
```

### 2. Configure Signing

For release builds, create a keystore:
```bash
keytool -genkey -v -keystore servicecrewtech.keystore -alias servicecrew -keyalg RSA -keysize 2048 -validity 10000
```

### 3. Configure Permissions

Permissions are configured in `android/app/src/main/AndroidManifest.xml`:
- `CAMERA` - Job photos
- `ACCESS_FINE_LOCATION` - GPS tracking
- `INTERNET` - Server communication

### 4. Build & Run

1. Select your target device or emulator
2. Click the Run button or press `Shift+F10`

## Push Notifications

### iOS (APNs)

1. Enable Push Notifications capability in Xcode
2. Create an APNs key in Apple Developer Console
3. Configure your server with the APNs key

### Android (FCM)

1. Create a Firebase project
2. Add `google-services.json` to `android/app/`
3. Configure your server with the FCM server key

## Building for Production

### iOS App Store

1. In Xcode, select "Any iOS Device" as the target
2. Go to Product → Archive
3. Upload to App Store Connect

### Android Play Store

1. In Android Studio, go to Build → Generate Signed Bundle/APK
2. Select Android App Bundle
3. Upload to Google Play Console

## Troubleshooting

### "WebView not loading"

- Ensure `CAPACITOR_SERVER_URL` is set correctly
- For HTTP (non-HTTPS), `cleartext` is enabled in config
- Check network connectivity between device and server

### "Camera not working"

- Ensure camera permissions are granted
- Check `Info.plist` (iOS) or `AndroidManifest.xml` (Android)

### "Push notifications not received"

- Verify push token is saved to server
- Check APNs/FCM configuration
- Ensure app has notification permissions

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run cap:sync` | Sync web assets and plugins to native projects |
| `npm run cap:copy` | Copy web assets only |
| `npm run mobile:ios` | Open iOS project in Xcode |
| `npm run mobile:android` | Open Android project in Android Studio |
| `npm run mobile:dev:ios` | Run iOS app on device |
| `npm run mobile:dev:android` | Run Android app on device |

## Project Structure

```
├── ios/                    # iOS native project
│   └── App/
│       ├── App/           # Main app files
│       └── Podfile        # CocoaPods dependencies
├── android/               # Android native project
│   └── app/
│       ├── src/           # Source files
│       └── build.gradle   # Build configuration
├── capacitor.config.ts    # Capacitor configuration
└── src/lib/capacitor.ts   # Native feature utilities
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js with Capacitor](https://capacitorjs.com/docs/guides/nextjs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
