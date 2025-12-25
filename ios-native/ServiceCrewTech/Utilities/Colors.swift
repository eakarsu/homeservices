import SwiftUI

// MARK: - App Colors

extension Color {
    // Primary brand colors
    static let primaryOrange = Color(hex: "EA580C")
    static let primaryOrangeDark = Color(hex: "C2410C")
    static let primaryOrangeLight = Color(hex: "FB923C")

    // Secondary colors
    static let secondaryBlue = Color(hex: "3B82F6")
    static let secondaryGreen = Color(hex: "22C55E")
    static let secondaryYellow = Color(hex: "EAB308")
    static let secondaryRed = Color(hex: "EF4444")
    static let secondaryPurple = Color(hex: "8B5CF6")

    // Neutral colors
    static let backgroundPrimary = Color(hex: "F9FAFB")
    static let backgroundSecondary = Color(hex: "F3F4F6")
    static let textPrimary = Color(hex: "111827")
    static let textSecondary = Color(hex: "6B7280")
    static let textTertiary = Color(hex: "9CA3AF")
    static let borderColor = Color(hex: "E5E7EB")

    // Status colors
    static let statusActive = Color.secondaryBlue
    static let statusCompleted = Color.secondaryGreen
    static let statusPending = Color.secondaryYellow
    static let statusCancelled = Color.secondaryRed

    // Initialize from hex string
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Status Color Helper

extension JobStatus {
    var swiftUIColor: Color {
        switch self {
        case .scheduled: return .textSecondary
        case .dispatched: return .secondaryBlue
        case .enRoute: return .secondaryPurple
        case .inProgress: return .primaryOrange
        case .onHold: return .secondaryYellow
        case .completed: return .secondaryGreen
        case .cancelled: return .secondaryRed
        }
    }
}

extension JobPriority {
    var swiftUIColor: Color {
        switch self {
        case .low: return .textSecondary
        case .normal: return .secondaryBlue
        case .high: return .primaryOrange
        case .urgent: return .secondaryRed
        case .emergency: return .secondaryPurple
        }
    }
}
