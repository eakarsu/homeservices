import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../services/location_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  AuthStatus _status = AuthStatus.initial;
  User? _user;
  String? _error;

  AuthStatus get status => _status;
  User? get user => _user;
  String? get error => _error;

  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isLoading => _status == AuthStatus.loading;
  String get displayName => _user?.displayName ?? 'Technician';
  String get initials => _user?.initials ?? 'T';
  bool get isTechnician => _user?.isTechnician ?? false;

  AuthProvider() {
    _checkAuthState();
  }

  Future<void> _checkAuthState() async {
    _status = AuthStatus.loading;
    notifyListeners();

    try {
      final token = await _apiService.getToken();
      if (token == null) {
        _status = AuthStatus.unauthenticated;
        notifyListeners();
        return;
      }

      _user = await _apiService.getCurrentUser();
      _status = AuthStatus.authenticated;

      // Start services after successful auth check
      await _initializeServices();
    } catch (e) {
      _status = AuthStatus.unauthenticated;
      await _apiService.clearToken();
    }

    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _status = AuthStatus.loading;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.login(email, password);
      _user = response.user;
      _status = AuthStatus.authenticated;

      // Initialize services after login
      await _initializeServices();

      notifyListeners();
      return true;
    } catch (e) {
      _status = AuthStatus.error;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _status = AuthStatus.loading;
    notifyListeners();

    try {
      // Stop services
      await LocationService.instance.stopTracking();

      // Clear token
      await _apiService.logout();
    } catch (e) {
      // Ignore errors during logout
    }

    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> _initializeServices() async {
    // Register push token
    await NotificationService.instance.registerToken();

    // Start location tracking for technicians
    if (_user?.isTechnician == true) {
      await LocationService.instance.startTracking();
    }
  }

  Future<void> refreshUser() async {
    try {
      _user = await _apiService.getCurrentUser();
      notifyListeners();
    } catch (e) {
      // Handle error silently
    }
  }
}
