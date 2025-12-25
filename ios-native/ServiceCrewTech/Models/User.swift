import Foundation

// MARK: - User Model

struct User: Identifiable, Codable {
    let id: String
    let email: String
    let name: String?
    let phone: String?
    let role: UserRole
    let technician: Technician?
    let companyId: String?
    let createdAt: Date?

    enum UserRole: String, Codable {
        case admin = "ADMIN"
        case manager = "MANAGER"
        case dispatcher = "DISPATCHER"
        case technician = "TECHNICIAN"
        case office = "OFFICE"
    }

    var displayName: String {
        name ?? email
    }

    var initials: String {
        guard let name = name else {
            return String(email.prefix(2)).uppercased()
        }
        let parts = name.split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return String(name.prefix(2)).uppercased()
    }

    var isTechnician: Bool {
        role == .technician
    }
}

// MARK: - Technician Model

struct Technician: Identifiable, Codable {
    let id: String
    let employeeId: String?
    let skills: [String]?
    let certifications: [String]?
    let tradeTypes: [TradeType]?
    let currentLat: Double?
    let currentLng: Double?
    let lastLocationUpdate: Date?
    let status: TechnicianStatus?
    let hireDate: Date?
    let hourlyRate: Double?

    enum TechnicianStatus: String, Codable {
        case available = "AVAILABLE"
        case busy = "BUSY"
        case onBreak = "ON_BREAK"
        case offline = "OFFLINE"

        var displayName: String {
            switch self {
            case .available: return "Available"
            case .busy: return "Busy"
            case .onBreak: return "On Break"
            case .offline: return "Offline"
            }
        }

        var color: String {
            switch self {
            case .available: return "green"
            case .busy: return "orange"
            case .onBreak: return "yellow"
            case .offline: return "gray"
            }
        }
    }

    var hasLocation: Bool {
        currentLat != nil && currentLng != nil
    }

    var skillsList: String {
        skills?.joined(separator: ", ") ?? "No skills listed"
    }
}

// MARK: - Auth Response

struct AuthResponse: Codable {
    let user: User
    let token: String
    let expiresAt: Date?
}

// MARK: - Login Request

struct LoginRequest: Codable {
    let email: String
    let password: String
}

// MARK: - API Error

struct APIError: Codable, Error {
    let message: String
    let code: String?
    let statusCode: Int?

    var localizedDescription: String {
        message
    }
}
