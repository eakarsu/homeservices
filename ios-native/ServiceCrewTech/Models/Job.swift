import Foundation

// MARK: - Job Model

struct Job: Identifiable, Codable, Hashable {
    let id: String
    let jobNumber: String
    let title: String
    let description: String?
    let status: JobStatus
    let priority: JobPriority
    let tradeType: TradeType
    let scheduledStart: Date?
    let scheduledEnd: Date?
    let timeWindowStart: String?
    let timeWindowEnd: String?
    let estimatedDuration: Int?
    let actualDuration: Int?
    let customer: Customer?
    let property: Property?
    let serviceType: ServiceType?
    let notes: [JobNote]
    let lineItems: [LineItem]
    let photos: [JobPhoto]
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, jobNumber, title, description, status, priority, tradeType
        case scheduledStart, scheduledEnd, timeWindowStart, timeWindowEnd
        case estimatedDuration, actualDuration, customer, property, serviceType
        case notes, lineItems, photos, createdAt, updatedAt
    }
}

// MARK: - Job Status

enum JobStatus: String, Codable, CaseIterable {
    case scheduled = "SCHEDULED"
    case dispatched = "DISPATCHED"
    case enRoute = "EN_ROUTE"
    case inProgress = "IN_PROGRESS"
    case onHold = "ON_HOLD"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"

    var displayName: String {
        switch self {
        case .scheduled: return "Scheduled"
        case .dispatched: return "Dispatched"
        case .enRoute: return "En Route"
        case .inProgress: return "In Progress"
        case .onHold: return "On Hold"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        }
    }

    var color: String {
        switch self {
        case .scheduled: return "gray"
        case .dispatched: return "blue"
        case .enRoute: return "purple"
        case .inProgress: return "orange"
        case .onHold: return "yellow"
        case .completed: return "green"
        case .cancelled: return "red"
        }
    }

    var isActive: Bool {
        switch self {
        case .inProgress, .enRoute: return true
        default: return false
        }
    }
}

// MARK: - Job Priority

enum JobPriority: String, Codable, CaseIterable {
    case low = "LOW"
    case normal = "NORMAL"
    case high = "HIGH"
    case urgent = "URGENT"
    case emergency = "EMERGENCY"

    var displayName: String {
        rawValue.capitalized
    }

    var color: String {
        switch self {
        case .low: return "gray"
        case .normal: return "blue"
        case .high: return "orange"
        case .urgent: return "red"
        case .emergency: return "purple"
        }
    }
}

// MARK: - Trade Type

enum TradeType: String, Codable, CaseIterable {
    case hvac = "HVAC"
    case plumbing = "PLUMBING"
    case electrical = "ELECTRICAL"
    case appliance = "APPLIANCE"
    case generalContractor = "GENERAL_CONTRACTOR"
    case other = "OTHER"

    var displayName: String {
        switch self {
        case .hvac: return "HVAC"
        case .plumbing: return "Plumbing"
        case .electrical: return "Electrical"
        case .appliance: return "Appliance"
        case .generalContractor: return "General Contractor"
        case .other: return "Other"
        }
    }

    var iconName: String {
        switch self {
        case .hvac: return "fan.fill"
        case .plumbing: return "drop.fill"
        case .electrical: return "bolt.fill"
        case .appliance: return "washer.fill"
        case .generalContractor: return "hammer.fill"
        case .other: return "wrench.fill"
        }
    }
}

// MARK: - Job Note

struct JobNote: Identifiable, Codable, Hashable {
    let id: String
    let content: String
    let noteType: NoteType
    let createdAt: Date
    let createdBy: String?

    enum NoteType: String, Codable {
        case technician = "TECHNICIAN"
        case dispatcher = "DISPATCHER"
        case customer = "CUSTOMER"
        case system = "SYSTEM"
    }
}

// MARK: - Line Item

struct LineItem: Identifiable, Codable, Hashable {
    let id: String
    let description: String
    let quantity: Double
    let unitPrice: Double
    let totalPrice: Double
    let itemType: ItemType

    enum ItemType: String, Codable {
        case labor = "LABOR"
        case part = "PART"
        case material = "MATERIAL"
        case service = "SERVICE"
        case other = "OTHER"
    }
}

// MARK: - Job Photo

struct JobPhoto: Identifiable, Codable, Hashable {
    let id: String
    let url: String
    let caption: String?
    let photoType: PhotoType
    let latitude: Double?
    let longitude: Double?
    let takenAt: Date

    enum PhotoType: String, Codable {
        case before = "BEFORE"
        case during = "DURING"
        case after = "AFTER"
        case equipment = "EQUIPMENT"
        case damage = "DAMAGE"
        case other = "OTHER"
    }
}

// MARK: - Service Type

struct ServiceType: Codable, Hashable {
    let id: String
    let name: String
    let description: String?
}

// MARK: - Job Extensions

extension Job {
    var customerName: String {
        guard let customer = customer else { return "Unknown" }
        let firstName = customer.firstName ?? ""
        let lastName = customer.lastName ?? ""
        let name = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces)
        return name.isEmpty ? "Unknown" : name
    }

    var fullAddress: String {
        guard let property = property else { return "No address" }
        return "\(property.address), \(property.city), \(property.state) \(property.zip)"
    }

    var shortAddress: String {
        guard let property = property else { return "No address" }
        return "\(property.address), \(property.city)"
    }

    var canStart: Bool {
        [.scheduled, .dispatched].contains(status)
    }

    var canPause: Bool {
        status == .inProgress
    }

    var canComplete: Bool {
        status == .inProgress
    }

    var partsUsed: [LineItem] {
        lineItems.filter { $0.itemType == .part }
    }

    var laborItems: [LineItem] {
        lineItems.filter { $0.itemType == .labor }
    }
}
