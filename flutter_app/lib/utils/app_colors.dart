import 'package:flutter/material.dart';
import '../models/job.dart';

class AppColors {
  // Primary brand colors
  static const Color primaryOrange = Color(0xFFEA580C);
  static const Color primaryOrangeDark = Color(0xFFC2410C);
  static const Color primaryOrangeLight = Color(0xFFFB923C);

  // Secondary colors
  static const Color secondaryBlue = Color(0xFF3B82F6);
  static const Color secondaryGreen = Color(0xFF22C55E);
  static const Color secondaryYellow = Color(0xFFEAB308);
  static const Color secondaryRed = Color(0xFFEF4444);
  static const Color secondaryPurple = Color(0xFF8B5CF6);

  // Neutral colors
  static const Color backgroundPrimary = Color(0xFFF9FAFB);
  static const Color backgroundSecondary = Color(0xFFF3F4F6);
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textTertiary = Color(0xFF9CA3AF);
  static const Color borderColor = Color(0xFFE5E7EB);

  // Status colors
  static const Color success = secondaryGreen;
  static const Color warning = secondaryYellow;
  static const Color error = secondaryRed;
  static const Color info = secondaryBlue;

  // Job status colors
  static Color getStatusColor(JobStatus status) {
    switch (status) {
      case JobStatus.scheduled:
        return textSecondary;
      case JobStatus.dispatched:
        return secondaryBlue;
      case JobStatus.enRoute:
        return secondaryPurple;
      case JobStatus.inProgress:
        return primaryOrange;
      case JobStatus.onHold:
        return secondaryYellow;
      case JobStatus.completed:
        return secondaryGreen;
      case JobStatus.cancelled:
        return secondaryRed;
    }
  }

  // Job priority colors
  static Color getPriorityColor(JobPriority priority) {
    switch (priority) {
      case JobPriority.low:
        return textSecondary;
      case JobPriority.normal:
        return secondaryBlue;
      case JobPriority.high:
        return primaryOrange;
      case JobPriority.urgent:
        return secondaryRed;
      case JobPriority.emergency:
        return secondaryPurple;
    }
  }
}
