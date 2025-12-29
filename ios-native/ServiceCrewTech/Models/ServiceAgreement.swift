import Foundation

// MARK: - Service Agreement Model

struct ServiceAgreement: Identifiable, Codable, Hashable {
    let id: String
    let agreementNumber: String
    let status: AgreementStatus
    let startDate: Date?
    let endDate: Date?
    let billingFrequency: String?
    let autoRenew: Bool?
    let notes: String?
    let createdAt: Date?
    let updatedAt: Date?
    let customerId: String
    let planId: String?
    let customer: AgreementCustomer?
    let plan: ServicePlan?

    enum AgreementStatus: String, Codable {
        case active = "ACTIVE"
        case pending = "PENDING"
        case expired = "EXPIRED"
        case cancelled = "CANCELLED"

        var displayName: String {
            switch self {
            case .active: return "Active"
            case .pending: return "Pending"
            case .expired: return "Expired"
            case .cancelled: return "Cancelled"
            }
        }
    }

    var customerDisplayName: String {
        guard let customer = customer else { return "Unknown Customer" }
        if let companyName = customer.companyName, !companyName.isEmpty {
            return companyName
        }
        let firstName = customer.firstName ?? ""
        let lastName = customer.lastName ?? ""
        let name = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces)
        return name.isEmpty ? "Unknown Customer" : name
    }

    var isExpiringSoon: Bool {
        guard let endDate = endDate else { return false }
        let daysUntilExpiry = Calendar.current.dateComponents([.day], from: Date(), to: endDate).day ?? 0
        return daysUntilExpiry > 0 && daysUntilExpiry <= 30
    }
}

struct AgreementCustomer: Codable, Hashable {
    let id: String
    let firstName: String?
    let lastName: String?
    let companyName: String?

    var name: String {
        if let company = companyName, !company.isEmpty {
            return company
        }
        let first = firstName ?? ""
        let last = lastName ?? ""
        let fullName = "\(first) \(last)".trimmingCharacters(in: .whitespaces)
        return fullName.isEmpty ? "Unknown Customer" : fullName
    }
}

struct ServicePlan: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let visitsIncluded: Int?
    let description: String?

    // Prisma returns Decimal as strings, so we need to handle both String and Double
    private let monthlyPriceRaw: AnyCodableNumber?
    private let annualPriceRaw: AnyCodableNumber?

    var monthlyPrice: Double? {
        monthlyPriceRaw?.doubleValue
    }

    var annualPrice: Double? {
        annualPriceRaw?.doubleValue
    }

    private enum CodingKeys: String, CodingKey {
        case id, name, visitsIncluded, description
        case monthlyPriceRaw = "monthlyPrice"
        case annualPriceRaw = "annualPrice"
    }

    var price: Double {
        monthlyPrice ?? annualPrice ?? 0
    }

    var billingFrequency: String {
        if monthlyPrice != nil {
            return "monthly"
        } else if annualPrice != nil {
            return "annually"
        }
        return "one-time"
    }
}

// Helper to decode numbers that might come as strings (Prisma Decimal)
struct AnyCodableNumber: Codable, Hashable {
    let doubleValue: Double?

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let doubleVal = try? container.decode(Double.self) {
            doubleValue = doubleVal
        } else if let stringVal = try? container.decode(String.self) {
            doubleValue = Double(stringVal)
        } else if container.decodeNil() {
            doubleValue = nil
        } else {
            doubleValue = nil
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let value = doubleValue {
            try container.encode(value)
        } else {
            try container.encodeNil()
        }
    }
}

// MARK: - Technician Model

struct TechnicianItem: Identifiable, Codable, Hashable {
    let id: String
    let employeeId: String?
    let status: String
    let color: String?
    let tradeTypes: [String]?
    let certifications: [String]?
    let payType: String?
    let commissionPct: String?
    let user: TechnicianUser
    let truck: TechnicianTruck?
    let jobsCompleted: Int?
    let averageRating: Double?

    // Prisma Decimal field
    private let hourlyRateRaw: AnyCodableNumber?

    var hourlyRate: Double? { hourlyRateRaw?.doubleValue }

    // Handle _count from API (optional, we don't use it)
    private enum CodingKeys: String, CodingKey {
        case id, employeeId, status, color, tradeTypes, certifications
        case payType, commissionPct, user, truck
        case jobsCompleted, averageRating
        case hourlyRateRaw = "hourlyRate"
    }

    struct TechnicianUser: Codable, Hashable {
        let id: String
        let firstName: String?
        let lastName: String?
        let email: String?
        let phone: String?
        let avatar: String?

        var name: String {
            let first = firstName ?? ""
            let last = lastName ?? ""
            let fullName = "\(first) \(last)".trimmingCharacters(in: .whitespaces)
            return fullName.isEmpty ? (email ?? "Unknown") : fullName
        }
    }

    struct TechnicianTruck: Codable, Hashable {
        let id: String
        let name: String
    }

    var skills: [String] {
        var allSkills: [String] = []
        if let trades = tradeTypes {
            allSkills.append(contentsOf: trades)
        }
        if let certs = certifications {
            allSkills.append(contentsOf: certs)
        }
        return allSkills
    }

    var displayName: String {
        user.name
    }

    var initials: String {
        let first = user.firstName?.first.map(String.init) ?? ""
        let last = user.lastName?.first.map(String.init) ?? ""
        let result = "\(first)\(last)".uppercased()
        return result.isEmpty ? "?" : result
    }
}

// MARK: - Dispatch Models

struct DispatchTechnician: Identifiable, Codable, Hashable {
    let id: String
    let user: DispatchUser
    let status: String
    let tradeTypes: [String]
    let currentLat: Double?
    let currentLng: Double?
    let assignments: [DispatchAssignment]

    struct DispatchUser: Codable, Hashable {
        let firstName: String
        let lastName: String
        let phone: String?
    }

    struct DispatchAssignment: Codable, Hashable {
        let job: DispatchJob
    }

    struct DispatchJob: Identifiable, Codable, Hashable {
        let id: String
        let jobNumber: String
        let title: String?
        let status: String
        let priority: String
        let tradeType: String?
        let timeWindowStart: String?
        let timeWindowEnd: String?
        let property: JobProperty?
        let customer: JobCustomer?

        var displayTitle: String { title ?? "Untitled Job" }

        struct JobProperty: Codable, Hashable {
            let address: String?
            let city: String?
        }

        struct JobCustomer: Codable, Hashable {
            let firstName: String?
            let lastName: String?
            let phone: String?
        }
    }

    var displayName: String {
        "\(user.firstName) \(user.lastName)"
    }
}

struct UnassignedJob: Identifiable, Codable, Hashable {
    let id: String
    let jobNumber: String
    let title: String?
    let status: String
    let priority: String
    let tradeType: String?
    let scheduledStart: Date?
    let timeWindowStart: String?
    let timeWindowEnd: String?
    let property: JobProperty?
    let customer: JobCustomer?

    var displayTitle: String { title ?? "Untitled Job" }

    struct JobProperty: Codable, Hashable {
        let address: String?
        let city: String?
    }

    struct JobCustomer: Codable, Hashable {
        let firstName: String?
        let lastName: String?
        let phone: String?

        var displayName: String {
            let first = firstName ?? ""
            let last = lastName ?? ""
            let name = "\(first) \(last)".trimmingCharacters(in: .whitespaces)
            return name.isEmpty ? "Unknown Customer" : name
        }
    }
}

// MARK: - Reports Model

struct ReportsData: Codable {
    let revenue: RevenueStats
    let jobs: JobStats
    let technicians: TechnicianStats
    let customers: CustomerStats

    struct RevenueStats: Codable {
        let today: Double
        let week: Double
        let month: Double
        let year: Double
        let monthOverMonth: Double
    }

    struct JobStats: Codable {
        let completed: Int
        let scheduled: Int
        let avgDuration: Double
        let avgRevenue: Double
    }

    struct TechnicianStats: Codable {
        let avgJobsPerDay: Double
        let topPerformer: String
        let utilizationRate: Double
    }

    struct CustomerStats: Codable {
        let new: Int
        let total: Int
        let repeatRate: Double
    }
}
