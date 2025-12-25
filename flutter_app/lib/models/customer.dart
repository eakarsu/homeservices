import 'package:json_annotation/json_annotation.dart';

part 'customer.g.dart';

@JsonSerializable()
class Customer {
  final String id;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? phone;
  final String? alternatePhone;
  final CustomerType customerType;
  final String? companyName;
  final List<Property>? properties;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Customer({
    required this.id,
    this.firstName,
    this.lastName,
    this.email,
    this.phone,
    this.alternatePhone,
    required this.customerType,
    this.companyName,
    this.properties,
    this.createdAt,
    this.updatedAt,
  });

  factory Customer.fromJson(Map<String, dynamic> json) => _$CustomerFromJson(json);
  Map<String, dynamic> toJson() => _$CustomerToJson(this);

  String get displayName {
    if (companyName != null && companyName!.isNotEmpty) {
      return companyName!;
    }
    final first = firstName ?? '';
    final last = lastName ?? '';
    final name = '$first $last'.trim();
    return name.isEmpty ? 'Unknown Customer' : name;
  }

  String get initials {
    final first = firstName ?? '';
    final last = lastName ?? '';
    final firstInitial = first.isNotEmpty ? first[0] : '';
    final lastInitial = last.isNotEmpty ? last[0] : '';
    return '$firstInitial$lastInitial'.toUpperCase();
  }
}

enum CustomerType {
  @JsonValue('RESIDENTIAL')
  residential,
  @JsonValue('COMMERCIAL')
  commercial;
}

@JsonSerializable()
class Property {
  final String id;
  final String address;
  final String? address2;
  final String city;
  final String state;
  final String zip;
  final String? country;
  final PropertyType? propertyType;
  final double? latitude;
  final double? longitude;
  final String? notes;
  final List<Equipment>? equipment;

  Property({
    required this.id,
    required this.address,
    this.address2,
    required this.city,
    required this.state,
    required this.zip,
    this.country,
    this.propertyType,
    this.latitude,
    this.longitude,
    this.notes,
    this.equipment,
  });

  factory Property.fromJson(Map<String, dynamic> json) => _$PropertyFromJson(json);
  Map<String, dynamic> toJson() => _$PropertyToJson(this);

  String get fullAddress {
    final parts = [address];
    if (address2 != null && address2!.isNotEmpty) {
      parts.add(address2!);
    }
    parts.add('$city, $state $zip');
    return parts.join(', ');
  }

  String get shortAddress => '$address, $city';

  bool get hasCoordinates => latitude != null && longitude != null;
}

enum PropertyType {
  @JsonValue('SINGLE_FAMILY')
  singleFamily,
  @JsonValue('MULTI_FAMILY')
  multiFamily,
  @JsonValue('CONDO')
  condo,
  @JsonValue('TOWNHOUSE')
  townhouse,
  @JsonValue('COMMERCIAL')
  commercial,
  @JsonValue('INDUSTRIAL')
  industrial,
  @JsonValue('OTHER')
  other;
}

@JsonSerializable()
class Equipment {
  final String id;
  final EquipmentType equipmentType;
  final String? manufacturer;
  final String? model;
  final String? serialNumber;
  final DateTime? installDate;
  final DateTime? warrantyExpiration;
  final String? notes;

  Equipment({
    required this.id,
    required this.equipmentType,
    this.manufacturer,
    this.model,
    this.serialNumber,
    this.installDate,
    this.warrantyExpiration,
    this.notes,
  });

  factory Equipment.fromJson(Map<String, dynamic> json) => _$EquipmentFromJson(json);
  Map<String, dynamic> toJson() => _$EquipmentToJson(this);

  bool get isUnderWarranty {
    if (warrantyExpiration == null) return false;
    return warrantyExpiration!.isAfter(DateTime.now());
  }

  String get displayName {
    final parts = <String>[];
    if (manufacturer != null) parts.add(manufacturer!);
    if (model != null) parts.add(model!);
    if (parts.isEmpty) return equipmentType.displayName;
    return parts.join(' ');
  }
}

enum EquipmentType {
  @JsonValue('FURNACE')
  furnace,
  @JsonValue('AIR_CONDITIONER')
  airConditioner,
  @JsonValue('HEAT_PUMP')
  heatPump,
  @JsonValue('WATER_HEATER')
  waterHeater,
  @JsonValue('BOILER')
  boiler,
  @JsonValue('DUCTWORK')
  ductwork,
  @JsonValue('THERMOSTAT')
  thermostat,
  @JsonValue('OTHER')
  other;

  String get displayName {
    switch (this) {
      case EquipmentType.furnace:
        return 'Furnace';
      case EquipmentType.airConditioner:
        return 'Air Conditioner';
      case EquipmentType.heatPump:
        return 'Heat Pump';
      case EquipmentType.waterHeater:
        return 'Water Heater';
      case EquipmentType.boiler:
        return 'Boiler';
      case EquipmentType.ductwork:
        return 'Ductwork';
      case EquipmentType.thermostat:
        return 'Thermostat';
      case EquipmentType.other:
        return 'Other';
    }
  }
}
