import 'package:json_annotation/json_annotation.dart';
import 'customer.dart';

part 'job.g.dart';

@JsonSerializable()
class Job {
  final String id;
  final String jobNumber;
  final String title;
  final String? description;
  final JobStatus status;
  final JobPriority priority;
  final TradeType tradeType;
  final DateTime? scheduledStart;
  final DateTime? scheduledEnd;
  final String? timeWindowStart;
  final String? timeWindowEnd;
  final int? estimatedDuration;
  final int? actualDuration;
  final Customer? customer;
  final Property? property;
  final ServiceType? serviceType;
  final List<JobNote> notes;
  final List<LineItem> lineItems;
  final List<JobPhoto> photos;
  final DateTime createdAt;
  final DateTime updatedAt;

  Job({
    required this.id,
    required this.jobNumber,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    required this.tradeType,
    this.scheduledStart,
    this.scheduledEnd,
    this.timeWindowStart,
    this.timeWindowEnd,
    this.estimatedDuration,
    this.actualDuration,
    this.customer,
    this.property,
    this.serviceType,
    this.notes = const [],
    this.lineItems = const [],
    this.photos = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory Job.fromJson(Map<String, dynamic> json) => _$JobFromJson(json);
  Map<String, dynamic> toJson() => _$JobToJson(this);

  String get customerName {
    if (customer == null) return 'Unknown';
    final firstName = customer!.firstName ?? '';
    final lastName = customer!.lastName ?? '';
    final name = '$firstName $lastName'.trim();
    return name.isEmpty ? 'Unknown' : name;
  }

  String get fullAddress {
    if (property == null) return 'No address';
    return '${property!.address}, ${property!.city}, ${property!.state} ${property!.zip}';
  }

  String get shortAddress {
    if (property == null) return 'No address';
    return '${property!.address}, ${property!.city}';
  }

  bool get canStart => [JobStatus.scheduled, JobStatus.dispatched].contains(status);
  bool get canPause => status == JobStatus.inProgress;
  bool get canComplete => status == JobStatus.inProgress;

  List<LineItem> get partsUsed => lineItems.where((i) => i.itemType == ItemType.part).toList();
}

enum JobStatus {
  @JsonValue('SCHEDULED')
  scheduled,
  @JsonValue('DISPATCHED')
  dispatched,
  @JsonValue('EN_ROUTE')
  enRoute,
  @JsonValue('IN_PROGRESS')
  inProgress,
  @JsonValue('ON_HOLD')
  onHold,
  @JsonValue('COMPLETED')
  completed,
  @JsonValue('CANCELLED')
  cancelled;

  String get displayName {
    switch (this) {
      case JobStatus.scheduled:
        return 'Scheduled';
      case JobStatus.dispatched:
        return 'Dispatched';
      case JobStatus.enRoute:
        return 'En Route';
      case JobStatus.inProgress:
        return 'In Progress';
      case JobStatus.onHold:
        return 'On Hold';
      case JobStatus.completed:
        return 'Completed';
      case JobStatus.cancelled:
        return 'Cancelled';
    }
  }

  String get value {
    switch (this) {
      case JobStatus.scheduled:
        return 'SCHEDULED';
      case JobStatus.dispatched:
        return 'DISPATCHED';
      case JobStatus.enRoute:
        return 'EN_ROUTE';
      case JobStatus.inProgress:
        return 'IN_PROGRESS';
      case JobStatus.onHold:
        return 'ON_HOLD';
      case JobStatus.completed:
        return 'COMPLETED';
      case JobStatus.cancelled:
        return 'CANCELLED';
    }
  }
}

enum JobPriority {
  @JsonValue('LOW')
  low,
  @JsonValue('NORMAL')
  normal,
  @JsonValue('HIGH')
  high,
  @JsonValue('URGENT')
  urgent,
  @JsonValue('EMERGENCY')
  emergency;

  String get displayName => name.toUpperCase();
}

enum TradeType {
  @JsonValue('HVAC')
  hvac,
  @JsonValue('PLUMBING')
  plumbing,
  @JsonValue('ELECTRICAL')
  electrical,
  @JsonValue('APPLIANCE')
  appliance,
  @JsonValue('GENERAL_CONTRACTOR')
  generalContractor,
  @JsonValue('OTHER')
  other;

  String get displayName {
    switch (this) {
      case TradeType.hvac:
        return 'HVAC';
      case TradeType.plumbing:
        return 'Plumbing';
      case TradeType.electrical:
        return 'Electrical';
      case TradeType.appliance:
        return 'Appliance';
      case TradeType.generalContractor:
        return 'General Contractor';
      case TradeType.other:
        return 'Other';
    }
  }
}

@JsonSerializable()
class JobNote {
  final String id;
  final String content;
  final NoteType noteType;
  final DateTime createdAt;
  final String? createdBy;

  JobNote({
    required this.id,
    required this.content,
    required this.noteType,
    required this.createdAt,
    this.createdBy,
  });

  factory JobNote.fromJson(Map<String, dynamic> json) => _$JobNoteFromJson(json);
  Map<String, dynamic> toJson() => _$JobNoteToJson(this);
}

enum NoteType {
  @JsonValue('TECHNICIAN')
  technician,
  @JsonValue('DISPATCHER')
  dispatcher,
  @JsonValue('CUSTOMER')
  customer,
  @JsonValue('SYSTEM')
  system;
}

@JsonSerializable()
class LineItem {
  final String id;
  final String description;
  final double quantity;
  final double unitPrice;
  final double totalPrice;
  final ItemType itemType;

  LineItem({
    required this.id,
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    required this.itemType,
  });

  factory LineItem.fromJson(Map<String, dynamic> json) => _$LineItemFromJson(json);
  Map<String, dynamic> toJson() => _$LineItemToJson(this);
}

enum ItemType {
  @JsonValue('LABOR')
  labor,
  @JsonValue('PART')
  part,
  @JsonValue('MATERIAL')
  material,
  @JsonValue('SERVICE')
  service,
  @JsonValue('OTHER')
  other;
}

@JsonSerializable()
class JobPhoto {
  final String id;
  final String url;
  final String? caption;
  final PhotoType photoType;
  final double? latitude;
  final double? longitude;
  final DateTime takenAt;

  JobPhoto({
    required this.id,
    required this.url,
    this.caption,
    required this.photoType,
    this.latitude,
    this.longitude,
    required this.takenAt,
  });

  factory JobPhoto.fromJson(Map<String, dynamic> json) => _$JobPhotoFromJson(json);
  Map<String, dynamic> toJson() => _$JobPhotoToJson(this);
}

enum PhotoType {
  @JsonValue('BEFORE')
  before,
  @JsonValue('DURING')
  during,
  @JsonValue('AFTER')
  after,
  @JsonValue('EQUIPMENT')
  equipment,
  @JsonValue('DAMAGE')
  damage,
  @JsonValue('OTHER')
  other;
}

@JsonSerializable()
class ServiceType {
  final String id;
  final String name;
  final String? description;

  ServiceType({
    required this.id,
    required this.name,
    this.description,
  });

  factory ServiceType.fromJson(Map<String, dynamic> json) => _$ServiceTypeFromJson(json);
  Map<String, dynamic> toJson() => _$ServiceTypeToJson(this);
}
