import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/job.dart';
import '../utils/app_colors.dart';
import 'status_badge.dart';

class JobCard extends StatelessWidget {
  final Job job;
  final bool showStatus;
  final VoidCallback? onTap;

  const JobCard({
    super.key,
    required this.job,
    this.showStatus = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Priority indicator bar
            Container(
              height: 4,
              color: _getPriorityColor(),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    children: [
                      // Trade type icon
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primaryOrange.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          _getTradeIcon(),
                          color: AppColors.primaryOrange,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Job number and title
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              job.jobNumber,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              job.title,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      // Status badge
                      if (showStatus)
                        StatusBadge(status: job.status),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Customer info
                  Row(
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          job.customerName,
                          style: Theme.of(context).textTheme.bodyMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Address
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          job.fullAddress,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Scheduled time and priority
                  Row(
                    children: [
                      Icon(
                        Icons.schedule,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _formatScheduledTime(),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const Spacer(),
                      _buildPriorityChip(context),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getPriorityColor() {
    switch (job.priority) {
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

  IconData _getTradeIcon() {
    switch (job.tradeType) {
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

  String _formatScheduledTime() {
    if (job.scheduledStart == null) return 'Not scheduled';

    final now = DateTime.now();
    final scheduled = job.scheduledStart!;

    if (scheduled.year == now.year &&
        scheduled.month == now.month &&
        scheduled.day == now.day) {
      return 'Today ${DateFormat('h:mm a').format(scheduled)}';
    }

    final tomorrow = now.add(const Duration(days: 1));
    if (scheduled.year == tomorrow.year &&
        scheduled.month == tomorrow.month &&
        scheduled.day == tomorrow.day) {
      return 'Tomorrow ${DateFormat('h:mm a').format(scheduled)}';
    }

    return DateFormat('MMM d, h:mm a').format(scheduled);
  }

  Widget _buildPriorityChip(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _getPriorityColor().withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (job.priority == JobPriority.emergency)
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: Icon(
                Icons.warning_amber,
                size: 12,
                color: _getPriorityColor(),
              ),
            ),
          Text(
            job.priority.displayName,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: _getPriorityColor(),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
