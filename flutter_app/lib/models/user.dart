import 'package:json_annotation/json_annotation.dart';
import 'job.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String email;
  final String? name;
  final String? phone;
  final UserRole role;
  final Technician? technician;
  final String? companyId;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.email,
    this.name,
    this.phone,
    required this.role,
    this.technician,
    this.companyId,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

  String get displayName => name ?? email;

  String get initials {
    if (name == null || name!.isEmpty) {
      return email.substring(0, 2).toUpperCase();
    }
    final parts = name!.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name!.substring(0, 2).toUpperCase();
  }

  bool get isTechnician => role == UserRole.technician;
}

enum UserRole {
  @JsonValue('ADMIN')
  admin,
  @JsonValue('MANAGER')
  manager,
  @JsonValue('DISPATCHER')
  dispatcher,
  @JsonValue('TECHNICIAN')
  technician,
  @JsonValue('OFFICE')
  office;
}

@JsonSerializable()
class Technician {
  final String id;
  final String? employeeId;
  final List<String>? skills;
  final List<String>? certifications;
  final List<TradeType>? tradeTypes;
  final double? currentLat;
  final double? currentLng;
  final DateTime? lastLocationUpdate;
  final TechnicianStatus? status;
  final DateTime? hireDate;
  final double? hourlyRate;

  Technician({
    required this.id,
    this.employeeId,
    this.skills,
    this.certifications,
    this.tradeTypes,
    this.currentLat,
    this.currentLng,
    this.lastLocationUpdate,
    this.status,
    this.hireDate,
    this.hourlyRate,
  });

  factory Technician.fromJson(Map<String, dynamic> json) => _$TechnicianFromJson(json);
  Map<String, dynamic> toJson() => _$TechnicianToJson(this);

  bool get hasLocation => currentLat != null && currentLng != null;

  String get skillsList => skills?.join(', ') ?? 'No skills listed';
}

enum TechnicianStatus {
  @JsonValue('AVAILABLE')
  available,
  @JsonValue('BUSY')
  busy,
  @JsonValue('ON_BREAK')
  onBreak,
  @JsonValue('OFFLINE')
  offline;

  String get displayName {
    switch (this) {
      case TechnicianStatus.available:
        return 'Available';
      case TechnicianStatus.busy:
        return 'Busy';
      case TechnicianStatus.onBreak:
        return 'On Break';
      case TechnicianStatus.offline:
        return 'Offline';
    }
  }
}

@JsonSerializable()
class AuthResponse {
  final User user;
  final String token;
  final DateTime? expiresAt;

  AuthResponse({
    required this.user,
    required this.token,
    this.expiresAt,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => _$AuthResponseFromJson(json);
  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}

@JsonSerializable()
class LoginRequest {
  final String email;
  final String password;

  LoginRequest({
    required this.email,
    required this.password,
  });

  factory LoginRequest.fromJson(Map<String, dynamic> json) => _$LoginRequestFromJson(json);
  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);
}

@JsonSerializable()
class DiagnosticResult {
  final List<String> possibleCauses;
  final List<String> diagnosticSteps;
  final List<String> recommendedParts;
  final List<String> safetyWarnings;

  DiagnosticResult({
    required this.possibleCauses,
    required this.diagnosticSteps,
    required this.recommendedParts,
    required this.safetyWarnings,
  });

  factory DiagnosticResult.fromJson(Map<String, dynamic> json) => _$DiagnosticResultFromJson(json);
  Map<String, dynamic> toJson() => _$DiagnosticResultToJson(this);
}

@JsonSerializable()
class InventoryItem {
  final String id;
  final String name;
  final String? sku;
  final int quantity;
  final double? unitPrice;
  final String? category;

  InventoryItem({
    required this.id,
    required this.name,
    this.sku,
    required this.quantity,
    this.unitPrice,
    this.category,
  });

  factory InventoryItem.fromJson(Map<String, dynamic> json) => _$InventoryItemFromJson(json);
  Map<String, dynamic> toJson() => _$InventoryItemToJson(this);
}
