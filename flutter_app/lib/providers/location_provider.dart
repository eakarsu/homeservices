import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../services/location_service.dart';

class LocationProvider extends ChangeNotifier {
  final LocationService _locationService = LocationService.instance;

  Position? get currentPosition => _locationService.currentPosition;
  bool get isTracking => _locationService.isTracking;
  double? get latitude => _locationService.latitude;
  double? get longitude => _locationService.longitude;
  String get coordinateString => _locationService.coordinateString;

  Future<bool> checkPermission() async {
    return await _locationService.checkPermission();
  }

  Future<Position?> getCurrentPosition() async {
    final position = await _locationService.getCurrentPosition();
    notifyListeners();
    return position;
  }

  Future<void> startTracking() async {
    await _locationService.startTracking();
    notifyListeners();
  }

  Future<void> stopTracking() async {
    await _locationService.stopTracking();
    notifyListeners();
  }

  Future<double?> distanceTo(double lat, double lng) async {
    return await _locationService.distanceTo(lat, lng);
  }
}
