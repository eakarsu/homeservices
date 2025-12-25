# ServiceCrew Tech - Flutter Mobile App

A cross-platform mobile application for field service technicians built with Flutter.

## Features

- **Job Management**: View, filter, and manage assigned jobs
- **Real-time Updates**: Push notifications for new jobs and updates
- **GPS Tracking**: Share location for dispatch optimization
- **Photo Documentation**: Capture and upload job photos
- **AI Diagnostics**: Get AI-powered diagnostic assistance
- **Schedule View**: Calendar-based job scheduling
- **Truck Inventory**: Track parts and materials
- **Offline Support**: Work without network connectivity

## Getting Started

### Prerequisites

- Flutter SDK 3.2.0+
- Dart SDK 3.2.0+
- Android Studio or Xcode
- Firebase project for push notifications

### Installation

1. Install dependencies:
```bash
cd flutter_app
flutter pub get
```

2. Generate code (models, etc.):
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API endpoints
```

4. Run the app:
```bash
# iOS
flutter run -d ios

# Android
flutter run -d android
```

## Project Structure

```
lib/
├── main.dart              # App entry point
├── models/                # Data models
│   ├── job.dart
│   ├── customer.dart
│   └── user.dart
├── services/              # API and platform services
│   ├── api_service.dart
│   ├── location_service.dart
│   └── notification_service.dart
├── providers/             # State management
│   ├── auth_provider.dart
│   ├── job_provider.dart
│   ├── location_provider.dart
│   └── notification_provider.dart
├── screens/               # UI screens
│   ├── auth/
│   ├── home/
│   ├── jobs/
│   ├── schedule/
│   ├── inventory/
│   └── profile/
├── widgets/               # Reusable widgets
│   ├── job_card.dart
│   └── status_badge.dart
└── utils/                 # Utilities and theme
    ├── app_theme.dart
    ├── app_colors.dart
    └── app_router.dart
```

## Building for Production

### Android
```bash
flutter build apk --release
# or for App Bundle
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## Key Dependencies

- **State Management**: Provider
- **Navigation**: go_router
- **Networking**: Dio
- **Local Storage**: Hive, Flutter Secure Storage
- **Camera**: image_picker, camera
- **Location**: geolocator, google_maps_flutter
- **Notifications**: firebase_messaging, flutter_local_notifications
- **Calendar**: table_calendar
