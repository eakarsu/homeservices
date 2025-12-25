import 'package:flutter/material.dart';

import '../models/job.dart';
import '../utils/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final JobStatus status;
  final bool large;

  const StatusBadge({
    super.key,
    required this.status,
    this.large = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: large ? 12 : 8,
        vertical: large ? 6 : 4,
      ),
      decoration: BoxDecoration(
        color: _getStatusColor().withOpacity(0.15),
        borderRadius: BorderRadius.circular(large ? 16 : 12),
        border: Border.all(
          color: _getStatusColor().withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: large ? 8 : 6,
            height: large ? 8 : 6,
            decoration: BoxDecoration(
              color: _getStatusColor(),
              shape: BoxShape.circle,
            ),
          ),
          SizedBox(width: large ? 6 : 4),
          Text(
            status.displayName,
            style: TextStyle(
              color: _getStatusColor(),
              fontSize: large ? 14 : 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (status) {
      case JobStatus.pending:
        return AppColors.textTertiary;
      case JobStatus.scheduled:
        return AppColors.textSecondary;
      case JobStatus.dispatched:
        return AppColors.secondaryBlue;
      case JobStatus.enRoute:
        return AppColors.warning;
      case JobStatus.inProgress:
        return AppColors.primaryOrange;
      case JobStatus.completed:
        return AppColors.secondaryGreen;
      case JobStatus.cancelled:
        return AppColors.error;
      case JobStatus.onHold:
        return AppColors.warning;
    }
  }
}

class PriorityBadge extends StatelessWidget {
  final JobPriority priority;
  final bool large;

  const PriorityBadge({
    super.key,
    required this.priority,
    this.large = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: large ? 12 : 8,
        vertical: large ? 6 : 4,
      ),
      decoration: BoxDecoration(
        color: _getPriorityColor().withOpacity(0.15),
        borderRadius: BorderRadius.circular(large ? 16 : 12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (priority == JobPriority.emergency || priority == JobPriority.high)
            Padding(
              padding: EdgeInsets.only(right: large ? 6 : 4),
              child: Icon(
                priority == JobPriority.emergency
                    ? Icons.warning_amber
                    : Icons.arrow_upward,
                size: large ? 14 : 12,
                color: _getPriorityColor(),
              ),
            ),
          Text(
            priority.displayName,
            style: TextStyle(
              color: _getPriorityColor(),
              fontSize: large ? 14 : 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Color _getPriorityColor() {
    switch (priority) {
      case JobPriority.emergency:
        return AppColors.error;
      case JobPriority.high:
        return AppColors.warning;
      case JobPriority.normal:
        return AppColors.secondaryBlue;
      case JobPriority.low:
        return AppColors.textTertiary;
    }
  }
}

class TradeTypeBadge extends StatelessWidget {
  final TradeType tradeType;

  const TradeTypeBadge({
    super.key,
    required this.tradeType,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primaryOrange.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getTradeIcon(),
            size: 14,
            color: AppColors.primaryOrange,
          ),
          const SizedBox(width: 6),
          Text(
            tradeType.displayName,
            style: const TextStyle(
              color: AppColors.primaryOrange,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getTradeIcon() {
    switch (tradeType) {
      case TradeType.hvac:
        return Icons.ac_unit;
      case TradeType.plumbing:
        return Icons.plumbing;
      case TradeType.electrical:
        return Icons.electrical_services;
      case TradeType.appliance:
        return Icons.kitchen;
      case TradeType.general:
        return Icons.handyman;
    }
  }
}
