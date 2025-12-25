import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

import '../models/job.dart';
import '../models/user.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio _dio;
  final _storage = const FlutterSecureStorage();
  final _logger = Logger();

  static const String _tokenKey = 'auth_token';

  String get baseUrl => dotenv.env['API_BASE_URL'] ?? 'https://app.servicecrewai.com/api';

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          _logger.d('API Request: ${options.method} ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          _logger.d('API Response: ${response.statusCode}');
          return handler.next(response);
        },
        onError: (error, handler) {
          _logger.e('API Error: ${error.message}');
          if (error.response?.statusCode == 401) {
            clearToken();
          }
          return handler.next(error);
        },
      ),
    );
  }

  // Token Management
  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<void> setToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
  }

  // Auth API
  Future<AuthResponse> login(String email, String password) async {
    final response = await _dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    final authResponse = AuthResponse.fromJson(response.data);
    await setToken(authResponse.token);
    return authResponse;
  }

  Future<User> getCurrentUser() async {
    final response = await _dio.get('/auth/me');
    return User.fromJson(response.data);
  }

  Future<void> logout() async {
    await clearToken();
  }

  // Jobs API
  Future<List<Job>> getMyJobs({bool all = false}) async {
    final response = await _dio.get(
      '/technicians/my-jobs',
      queryParameters: all ? {'all': 'true'} : null,
    );
    return (response.data as List).map((j) => Job.fromJson(j)).toList();
  }

  Future<Job> getJob(String id) async {
    final response = await _dio.get('/jobs/$id');
    return Job.fromJson(response.data);
  }

  Future<Job> updateJobStatus(String id, JobStatus status) async {
    final response = await _dio.put(
      '/jobs/$id',
      data: {'status': status.value},
    );
    return Job.fromJson(response.data);
  }

  Future<JobNote> addJobNote(String jobId, String content, {String noteType = 'TECHNICIAN'}) async {
    final response = await _dio.post(
      '/jobs/$jobId/notes',
      data: {'content': content, 'noteType': noteType},
    );
    return JobNote.fromJson(response.data);
  }

  Future<JobPhoto> uploadJobPhoto(String jobId, File imageFile, {PhotoType photoType = PhotoType.during}) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        imageFile.path,
        filename: 'job_photo_${DateTime.now().millisecondsSinceEpoch}.jpg',
      ),
      'type': photoType.name.toUpperCase(),
    });

    final response = await _dio.post(
      '/jobs/$jobId/photos',
      data: formData,
    );
    return JobPhoto.fromJson(response.data);
  }

  // Location API
  Future<void> updateLocation(double latitude, double longitude) async {
    await _dio.post(
      '/technicians/location',
      data: {'latitude': latitude, 'longitude': longitude},
    );
  }

  // Push Token API
  Future<void> updatePushToken(String token, {String platform = 'android'}) async {
    await _dio.post(
      '/users/push-token',
      data: {'pushToken': token, 'pushPlatform': platform},
    );
  }

  // Inventory API
  Future<List<InventoryItem>> getInventory() async {
    final response = await _dio.get('/inventory');
    return (response.data as List).map((i) => InventoryItem.fromJson(i)).toList();
  }

  // AI API
  Future<DiagnosticResult> getDiagnostics(String equipmentType, String symptoms) async {
    final response = await _dio.post(
      '/ai/diagnostics',
      data: {'equipmentType': equipmentType, 'symptoms': symptoms},
    );
    return DiagnosticResult.fromJson(response.data);
  }
}
