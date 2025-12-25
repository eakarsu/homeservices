#!/bin/bash

# ServiceCrew Tech - Xcode Project Generator
# This script helps create the Xcode project structure

echo "ServiceCrew Tech - iOS Native App Setup"
echo "========================================"
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "This script must be run on macOS with Xcode installed."
    echo ""
    echo "Manual Setup Instructions:"
    echo "1. Open Xcode"
    echo "2. File → New → Project"
    echo "3. Select 'App' under iOS"
    echo "4. Configure:"
    echo "   - Product Name: ServiceCrewTech"
    echo "   - Bundle Identifier: com.servicecrew.tech"
    echo "   - Interface: SwiftUI"
    echo "   - Language: Swift"
    echo "5. Save to: ios-native/"
    echo "6. Delete the auto-generated files"
    echo "7. Drag the ServiceCrewTech folder into the project"
    echo "8. Add capabilities: Push Notifications, Background Modes"
    exit 1
fi

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "Xcode is not installed. Please install Xcode from the App Store."
    exit 1
fi

echo "Creating Xcode project..."

# Create project using xcodegen if available
if command -v xcodegen &> /dev/null; then
    echo "Using XcodeGen to create project..."

    cat > project.yml << 'EOF'
name: ServiceCrewTech
options:
  bundleIdPrefix: com.servicecrew
  deploymentTarget:
    iOS: "16.0"
  xcodeVersion: "15.0"

settings:
  base:
    PRODUCT_BUNDLE_IDENTIFIER: com.servicecrew.tech
    MARKETING_VERSION: "1.0.0"
    CURRENT_PROJECT_VERSION: "1"
    DEVELOPMENT_TEAM: ""
    CODE_SIGN_STYLE: Automatic

targets:
  ServiceCrewTech:
    type: application
    platform: iOS
    sources:
      - ServiceCrewTech
    settings:
      base:
        INFOPLIST_FILE: ServiceCrewTech/Resources/Info.plist
        CODE_SIGN_ENTITLEMENTS: ServiceCrewTech/Resources/ServiceCrewTech.entitlements
        ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon
        ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: AccentColor
    entitlements:
      path: ServiceCrewTech/Resources/ServiceCrewTech.entitlements
EOF

    xcodegen generate
    rm project.yml
    echo "Project created successfully!"
else
    echo ""
    echo "XcodeGen not found. To install:"
    echo "  brew install xcodegen"
    echo ""
    echo "Or create the project manually in Xcode:"
    echo "1. Open Xcode"
    echo "2. File → New → Project → App"
    echo "3. Product Name: ServiceCrewTech"
    echo "4. Bundle Identifier: com.servicecrew.tech"
    echo "5. Interface: SwiftUI"
    echo "6. Language: Swift"
    echo "7. Save and add source files"
fi

echo ""
echo "Next steps:"
echo "1. Open ServiceCrewTech.xcodeproj in Xcode"
echo "2. Configure your Development Team in Signing & Capabilities"
echo "3. Add Push Notifications capability"
echo "4. Add Background Modes: Location updates, Remote notifications"
echo "5. Build and run!"
