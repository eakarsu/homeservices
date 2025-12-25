import 'package:flutter/foundation.dart';
import '../services/notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationService _notificationService = NotificationService.instance;

  String? get fcmToken => _notificationService.fcmToken;

  Future<void> registerToken() async {
    await _notificationService.registerToken();
    notifyListeners();
  }

  Future<void> showNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    await _notificationService.showNotification(
      title: title,
      body: body,
      payload: payload,
    );
  }

  Future<void> clearBadge() async {
    await _notificationService.clearBadge();
  }
}
