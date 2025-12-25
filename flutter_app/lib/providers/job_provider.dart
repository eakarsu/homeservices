import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/job.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class JobProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Job> _jobs = [];
  Job? _selectedJob;
  bool _isLoading = false;
  String? _error;
  DiagnosticResult? _diagnosticResult;

  List<Job> get jobs => _jobs;
  Job? get selectedJob => _selectedJob;
  bool get isLoading => _isLoading;
  String? get error => _error;
  DiagnosticResult? get diagnosticResult => _diagnosticResult;

  List<Job> get todayJobs => _jobs;
  Job? get activeJob => _jobs.firstWhere(
        (j) => j.status == JobStatus.inProgress,
        orElse: () => _jobs.first,
      );

  List<Job> get upcomingJobs => _jobs
      .where((j) => ![JobStatus.completed, JobStatus.cancelled, JobStatus.inProgress]
          .contains(j.status))
      .toList();

  List<Job> get completedJobs =>
      _jobs.where((j) => j.status == JobStatus.completed).toList();

  Future<void> loadJobs({bool all = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _jobs = await _apiService.getMyJobs(all: all);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadJob(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedJob = await _apiService.getJob(id);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> updateJobStatus(String id, JobStatus status) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updatedJob = await _apiService.updateJobStatus(id, status);

      // Update in jobs list
      final index = _jobs.indexWhere((j) => j.id == id);
      if (index != -1) {
        _jobs[index] = updatedJob;
      }

      // Update selected job
      if (_selectedJob?.id == id) {
        _selectedJob = updatedJob;
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> addNote(String jobId, String content) async {
    try {
      final note = await _apiService.addJobNote(jobId, content);

      // Update selected job
      if (_selectedJob?.id == jobId) {
        _selectedJob = Job(
          id: _selectedJob!.id,
          jobNumber: _selectedJob!.jobNumber,
          title: _selectedJob!.title,
          description: _selectedJob!.description,
          status: _selectedJob!.status,
          priority: _selectedJob!.priority,
          tradeType: _selectedJob!.tradeType,
          scheduledStart: _selectedJob!.scheduledStart,
          scheduledEnd: _selectedJob!.scheduledEnd,
          timeWindowStart: _selectedJob!.timeWindowStart,
          timeWindowEnd: _selectedJob!.timeWindowEnd,
          estimatedDuration: _selectedJob!.estimatedDuration,
          actualDuration: _selectedJob!.actualDuration,
          customer: _selectedJob!.customer,
          property: _selectedJob!.property,
          serviceType: _selectedJob!.serviceType,
          notes: [..._selectedJob!.notes, note],
          lineItems: _selectedJob!.lineItems,
          photos: _selectedJob!.photos,
          createdAt: _selectedJob!.createdAt,
          updatedAt: _selectedJob!.updatedAt,
        );
        notifyListeners();
      }

      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> uploadPhoto(String jobId, File imageFile) async {
    try {
      final photo = await _apiService.uploadJobPhoto(jobId, imageFile);

      // Update selected job
      if (_selectedJob?.id == jobId) {
        _selectedJob = Job(
          id: _selectedJob!.id,
          jobNumber: _selectedJob!.jobNumber,
          title: _selectedJob!.title,
          description: _selectedJob!.description,
          status: _selectedJob!.status,
          priority: _selectedJob!.priority,
          tradeType: _selectedJob!.tradeType,
          scheduledStart: _selectedJob!.scheduledStart,
          scheduledEnd: _selectedJob!.scheduledEnd,
          timeWindowStart: _selectedJob!.timeWindowStart,
          timeWindowEnd: _selectedJob!.timeWindowEnd,
          estimatedDuration: _selectedJob!.estimatedDuration,
          actualDuration: _selectedJob!.actualDuration,
          customer: _selectedJob!.customer,
          property: _selectedJob!.property,
          serviceType: _selectedJob!.serviceType,
          notes: _selectedJob!.notes,
          lineItems: _selectedJob!.lineItems,
          photos: [..._selectedJob!.photos, photo],
          createdAt: _selectedJob!.createdAt,
          updatedAt: _selectedJob!.updatedAt,
        );
        notifyListeners();
      }

      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> getDiagnostics(String equipmentType, String symptoms) async {
    _isLoading = true;
    _diagnosticResult = null;
    notifyListeners();

    try {
      _diagnosticResult = await _apiService.getDiagnostics(equipmentType, symptoms);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearDiagnostics() {
    _diagnosticResult = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
