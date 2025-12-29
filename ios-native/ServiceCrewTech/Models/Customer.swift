import Foundation

// MARK: - Customer Model

struct Customer: Identifiable, Codable, Hashable {
    let id: String
    let customerNumber: String?
    let firstName: String?
    let lastName: String?
    let email: String?
    let phone: String?
    let alternatePhone: String?
    let customerType: CustomerType?
    let type: String?
    let status: String?
    let companyName: String?
    let source: String?
    let preferredContact: String?
    let properties: [Property]?
    let propertyCount: Int?
    let jobCount: Int?
    let totalSpent: Double?
    let createdAt: Date?
    let updatedAt: Date?

    enum CustomerType: String, Codable {
        case residential = "RESIDENTIAL"
        case commercial = "COMMERCIAL"
    }

    var displayName: String {
        if let companyName = companyName, !companyName.isEmpty {
            return companyName
        }
        let firstName = self.firstName ?? ""
        let lastName = self.lastName ?? ""
        let name = "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces)
        return name.isEmpty ? "Unknown Customer" : name
    }

    var initials: String {
        let firstName = self.firstName ?? ""
        let lastName = self.lastName ?? ""
        let firstInitial = firstName.first.map { String($0) } ?? ""
        let lastInitial = lastName.first.map { String($0) } ?? ""
        return "\(firstInitial)\(lastInitial)".uppercased()
    }
}

// MARK: - Property Model

struct Property: Identifiable, Codable, Hashable {
    let id: String
    let address: String
    let address2: String?
    let city: String
    let state: String
    let zip: String
    let country: String?
    let propertyType: PropertyType?
    let latitude: Double?
    let longitude: Double?
    let notes: String?
    let equipment: [Equipment]?

    enum PropertyType: String, Codable {
        case singleFamily = "SINGLE_FAMILY"
        case multiFamily = "MULTI_FAMILY"
        case condo = "CONDO"
        case townhouse = "TOWNHOUSE"
        case commercial = "COMMERCIAL"
        case industrial = "INDUSTRIAL"
        case other = "OTHER"
    }

    var fullAddress: String {
        var parts = [address]
        if let address2 = address2, !address2.isEmpty {
            parts.append(address2)
        }
        parts.append("\(city), \(state) \(zip)")
        return parts.joined(separator: ", ")
    }

    var shortAddress: String {
        "\(address), \(city)"
    }

    var hasCoordinates: Bool {
        latitude != nil && longitude != nil
    }
}

// MARK: - Equipment Model

struct Equipment: Identifiable, Codable, Hashable {
    let id: String
    let equipmentType: EquipmentType
    let manufacturer: String?
    let model: String?
    let serialNumber: String?
    let installDate: Date?
    let warrantyExpiration: Date?
    let notes: String?

    enum EquipmentType: String, Codable {
        case furnace = "FURNACE"
        case airConditioner = "AIR_CONDITIONER"
        case heatPump = "HEAT_PUMP"
        case waterHeater = "WATER_HEATER"
        case boiler = "BOILER"
        case ductwork = "DUCTWORK"
        case thermostat = "THERMOSTAT"
        case other = "OTHER"

        var displayName: String {
            switch self {
            case .furnace: return "Furnace"
            case .airConditioner: return "Air Conditioner"
            case .heatPump: return "Heat Pump"
            case .waterHeater: return "Water Heater"
            case .boiler: return "Boiler"
            case .ductwork: return "Ductwork"
            case .thermostat: return "Thermostat"
            case .other: return "Other"
            }
        }

        var iconName: String {
            switch self {
            case .furnace: return "flame.fill"
            case .airConditioner: return "snowflake"
            case .heatPump: return "arrow.left.arrow.right"
            case .waterHeater: return "drop.fill"
            case .boiler: return "flame.fill"
            case .ductwork: return "wind"
            case .thermostat: return "thermometer"
            case .other: return "gearshape.fill"
            }
        }
    }

    var isUnderWarranty: Bool {
        guard let expiration = warrantyExpiration else { return false }
        return expiration > Date()
    }

    var displayName: String {
        var parts: [String] = []
        if let manufacturer = manufacturer {
            parts.append(manufacturer)
        }
        if let model = model {
            parts.append(model)
        }
        if parts.isEmpty {
            return equipmentType.displayName
        }
        return parts.joined(separator: " ")
    }
}
