# ServiceCrew Tech - Native iOS App

A fully native iOS application built with Swift and SwiftUI for field service technicians.

## Features

- **Authentication**: Secure login with token-based authentication
- **Job Management**: View, start, pause, and complete jobs
- **Photo Documentation**: Take and upload photos with GPS tagging
- **AI Diagnostics**: Get AI-powered troubleshooting suggestions
- **GPS Tracking**: Real-time location tracking for dispatch optimization
- **Push Notifications**: Receive job alerts and schedule updates
- **Offline Support**: Core features work without connectivity
- **Schedule View**: Calendar-based job scheduling
- **Inventory Access**: View and search parts inventory

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+
- macOS Sonoma 14.0+ (for development)

## Project Structure

```
ServiceCrewTech/
├── App/
│   └── ServiceCrewTechApp.swift      # App entry point
├── Models/
│   ├── Job.swift                      # Job, status, priority models
│   ├── Customer.swift                 # Customer, property, equipment models
│   └── User.swift                     # User, technician, auth models
├── Views/
│   ├── Auth/
│   │   └── LoginView.swift            # Login screen
│   ├── Dashboard/
│   │   ├── MainTabView.swift          # Main tab navigation
│   │   └── HomeView.swift             # Technician home/dashboard
│   ├── Jobs/
│   │   ├── JobsListView.swift         # Jobs list with search/filter
│   │   └── JobDetailView.swift        # Job detail with actions
│   ├── Schedule/
│   │   └── ScheduleView.swift         # Calendar schedule view
│   ├── Inventory/
│   │   └── InventoryView.swift        # Parts inventory
│   ├── Profile/
│   │   └── ProfileView.swift          # User profile & settings
│   └── Components/
│       ├── JobCardView.swift          # Reusable job card
│       └── AIAssistantView.swift      # AI diagnostic interface
├── ViewModels/
│   └── (ViewModels are embedded in views)
├── Services/
│   ├── APIService.swift               # Network API layer
│   ├── AuthManager.swift              # Authentication state
│   ├── LocationManager.swift          # GPS location tracking
│   ├── NotificationManager.swift      # Push notifications
│   └── CameraManager.swift            # Camera & photo handling
├── Utilities/
│   ├── Colors.swift                   # App color palette
│   └── Extensions.swift               # Swift extensions
└── Resources/
    ├── Info.plist                     # App configuration
    ├── ServiceCrewTech.entitlements   # App capabilities
    └── Assets.xcassets/               # App icons & colors
```

## Setup Instructions

### 1. Open in Xcode

```bash
open ios-native/ServiceCrewTech.xcodeproj
```

Or create a new project in Xcode:
1. File → New → Project → App
2. Product Name: ServiceCrewTech
3. Bundle Identifier: com.servicecrew.tech
4. Interface: SwiftUI
5. Language: Swift
6. Copy the source files into the project

### 2. Configure API Base URL

Edit `Services/APIService.swift` and update the `baseURL`:

```swift
private var baseURL: String {
    ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://your-server.com/api"
}
```

### 3. Configure Signing

1. Select the project in Navigator
2. Go to Signing & Capabilities
3. Select your Development Team
4. Update Bundle Identifier if needed

### 4. Add Capabilities

In Xcode, add the following capabilities:
- Push Notifications
- Background Modes (Location updates, Remote notifications)
- Associated Domains (for deep linking)

### 5. Build and Run

Select a simulator or device and press Cmd+R.

## API Integration

The app connects to the same backend API as the web application:

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User authentication |
| `GET /api/auth/me` | Get current user |
| `GET /api/technicians/my-jobs` | Get assigned jobs |
| `GET /api/jobs/:id` | Get job details |
| `PUT /api/jobs/:id` | Update job status |
| `POST /api/jobs/:id/notes` | Add job notes |
| `POST /api/jobs/:id/photos` | Upload job photos |
| `POST /api/technicians/location` | Update GPS location |
| `POST /api/users/push-token` | Register push token |
| `GET /api/inventory` | Get parts inventory |
| `POST /api/ai/diagnostics` | Get AI diagnostics |

## Key Technologies

- **SwiftUI**: Modern declarative UI framework
- **Combine**: Reactive programming for state management
- **async/await**: Modern Swift concurrency
- **CoreLocation**: GPS and location services
- **AVFoundation**: Camera and media capture
- **UserNotifications**: Push notification handling
- **PhotosUI**: Photo library access

## Architecture

The app follows the MVVM (Model-View-ViewModel) pattern:

- **Models**: Data structures matching the API
- **Views**: SwiftUI views for UI
- **ViewModels**: @StateObject/@ObservableObject for state management
- **Services**: Singleton managers for API, Auth, Location, etc.

## Customization

### Colors

Edit `Utilities/Colors.swift` to customize the color palette:

```swift
static let primaryOrange = Color(hex: "EA580C")
static let primaryOrangeDark = Color(hex: "C2410C")
```

### API Configuration

Set environment variables in your scheme:
- `API_BASE_URL`: Your backend API URL

## Testing

### Unit Tests

```bash
xcodebuild test -scheme ServiceCrewTech -destination 'platform=iOS Simulator,name=iPhone 15'
```

### UI Tests

UI tests can be added in the `ServiceCrewTechUITests` target.

## Building for Release

1. Update version and build numbers in Info.plist
2. Archive: Product → Archive
3. Distribute via App Store Connect or TestFlight

## Troubleshooting

### "Failed to load jobs"
- Check API_BASE_URL is correct
- Verify network connectivity
- Check authentication token is valid

### "Camera not working"
- Ensure camera permissions in Info.plist
- Check user has granted camera access

### "Location not updating"
- Check location permissions in Info.plist
- Verify user has granted location access
- Check location services are enabled on device

### "Push notifications not received"
- Verify push entitlements
- Check APNs configuration on server
- Ensure device is registered for push

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Copyright © 2024 ServiceCrew AI. All rights reserved.
