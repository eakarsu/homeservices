// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "ServiceCrewTech",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "ServiceCrewTech",
            targets: ["ServiceCrewTech"]),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "ServiceCrewTech",
            dependencies: [],
            path: "ServiceCrewTech"
        ),
        .testTarget(
            name: "ServiceCrewTechTests",
            dependencies: ["ServiceCrewTech"],
            path: "ServiceCrewTechTests"
        ),
    ]
)
