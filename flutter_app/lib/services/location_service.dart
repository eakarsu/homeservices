import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:logger/logger.dart';

import 'api_service.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  static LocationService get instance => _instance;

  final _logger = Logger();

  Position? _currentPosition;
  Position? get currentPosition => _currentPosition;

  StreamSubscription<Position>? _positionStream;
  Timer? _updateTimer;

  bool _isTracking = false;
  bool get isTracking => _isTracking;

  // Update interval in seconds
  static const int _updateIntervalSeconds = 60;

  LocationService._internal();

  Future<bool> checkPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _logger.w('Location services are disabled');
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _logger.w('Location permission denied');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _logger.w('Location permission permanently denied');
      return false;
    }

    return true;
  }

  Future<Position?> getCurrentPosition() async {
    final hasPermission = await checkPermission();
    if (!hasPermission) return null;

    try {
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      return _currentPosition;
    } catch (e) {
      _logger.e('Failed to get current position: $e');
      return null;
    }
  }

  Future<void> startTracking() async {
    if (_isTracking) return;

    final hasPermission = await checkPermission();
    if (!hasPermission) return;

    _isTracking = true;

    // Get initial position
    await getCurrentPosition();
    await _sendLocationToServer();

    // Start position stream
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 50, // Update every 50 meters
    );

    _positionStream = Geolocator.getPositionStream(locationSettings: locationSettings).listen(
      (Position position) {
        _currentPosition = position;
        _logger.d('Position updated: ${position.latitude}, ${position.longitude}');
      },
      onError: (e) {
        _logger.e('Position stream error: $e');
      },
    );

    // Start periodic server updates
    _updateTimer = Timer.periodic(
      const Duration(seconds: _updateIntervalSeconds),
      (_) => _sendLocationToServer(),
    );

    _logger.i('Location tracking started');
  }

  Future<void> stopTracking() async {
    _isTracking = false;

    await _positionStream?.cancel();
    _positionStream = null;

    _updateTimer?.cancel();
    _updateTimer = null;

    _logger.i('Location tracking stopped');
  }

  Future<void> _sendLocationToServer() async {
    if (_currentPosition == null) return;

    try {
      await ApiService().updateLocation(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
      );
      _logger.d('Location sent to server');
    } catch (e) {
      _logger.e('Failed to send location to server: $e');
    }
  }

  String get coordinateString {
    if (_currentPosition == null) return 'Unknown';
    return '${_currentPosition!.latitude.toStringAsFixed(6)}, ${_currentPosition!.longitude.toStringAsFixed(6)}';
  }

  double? get latitude => _currentPosition?.latitude;
  double? get longitude => _currentPosition?.longitude;

  Future<double?> distanceTo(double lat, double lng) async {
    if (_currentPosition == null) return null;
    return Geolocator.distanceBetween(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
      lat,
      lng,
    );
  }
}
