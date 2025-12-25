import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../models/job.dart';
import '../../providers/job_provider.dart';
import '../../utils/app_colors.dart';
import '../../widgets/job_card.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  CalendarFormat _calendarFormat = CalendarFormat.week;
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JobProvider>().loadJobs();
    });
  }

  List<Job> _getJobsForDay(DateTime day, List<Job> allJobs) {
    return allJobs.where((job) {
      if (job.scheduledStart == null) return false;
      return isSameDay(job.scheduledStart!, day);
    }).toList()
      ..sort((a, b) =>
          (a.scheduledStart ?? DateTime.now())
              .compareTo(b.scheduledStart ?? DateTime.now()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Schedule'),
        actions: [
          IconButton(
            icon: const Icon(Icons.today),
            onPressed: () {
              setState(() {
                _focusedDay = DateTime.now();
                _selectedDay = DateTime.now();
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<JobProvider>().loadJobs(),
          ),
        ],
      ),
      body: Consumer<JobProvider>(
        builder: (context, jobProvider, _) {
          final selectedDayJobs = _getJobsForDay(_selectedDay, jobProvider.jobs);

          return Column(
            children: [
              // Calendar
              Card(
                margin: const EdgeInsets.all(8),
                child: TableCalendar<Job>(
                  firstDay: DateTime.now().subtract(const Duration(days: 365)),
                  lastDay: DateTime.now().add(const Duration(days: 365)),
                  focusedDay: _focusedDay,
                  calendarFormat: _calendarFormat,
                  selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                  onDaySelected: (selectedDay, focusedDay) {
                    setState(() {
                      _selectedDay = selectedDay;
                      _focusedDay = focusedDay;
                    });
                  },
                  onFormatChanged: (format) {
                    setState(() {
                      _calendarFormat = format;
                    });
                  },
                  eventLoader: (day) => _getJobsForDay(day, jobProvider.jobs),
                  calendarStyle: CalendarStyle(
                    todayDecoration: BoxDecoration(
                      color: AppColors.primaryOrange.withOpacity(0.3),
                      shape: BoxShape.circle,
                    ),
                    selectedDecoration: const BoxDecoration(
                      color: AppColors.primaryOrange,
                      shape: BoxShape.circle,
                    ),
                    markerDecoration: const BoxDecoration(
                      color: AppColors.secondaryBlue,
                      shape: BoxShape.circle,
                    ),
                    markersMaxCount: 3,
                    markerSize: 6,
                    markerMargin: const EdgeInsets.symmetric(horizontal: 0.5),
                  ),
                  headerStyle: const HeaderStyle(
                    formatButtonVisible: true,
                    titleCentered: true,
                  ),
                ),
              ),

              // Selected day header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Text(
                      DateFormat('EEEE, MMMM d').format(_selectedDay),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primaryOrange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${selectedDayJobs.length} jobs',
                        style: const TextStyle(
                          color: AppColors.primaryOrange,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Jobs list
              Expanded(
                child: jobProvider.isLoading && jobProvider.jobs.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : selectedDayJobs.isEmpty
                        ? _buildEmptyState()
                        : RefreshIndicator(
                            onRefresh: () => jobProvider.loadJobs(),
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: selectedDayJobs.length,
                              itemBuilder: (context, index) {
                                final job = selectedDayJobs[index];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: _ScheduleJobCard(
                                    job: job,
                                    onTap: () => context.go('/jobs/${job.id}'),
                                  ),
                                );
                              },
                            ),
                          ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    final isToday = isSameDay(_selectedDay, DateTime.now());

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isToday ? Icons.free_breakfast : Icons.event_available,
            size: 64,
            color: AppColors.textTertiary,
          ),
          const SizedBox(height: 16),
          Text(
            isToday ? 'No Jobs Today' : 'No Jobs Scheduled',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            isToday
                ? 'Enjoy your break or check upcoming jobs'
                : 'No jobs scheduled for this day',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _ScheduleJobCard extends StatelessWidget {
  final Job job;
  final VoidCallback onTap;

  const _ScheduleJobCard({
    required this.job,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Time column
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    job.scheduledStart != null
                        ? DateFormat('h:mm').format(job.scheduledStart!)
                        : '--:--',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    job.scheduledStart != null
                        ? DateFormat('a').format(job.scheduledStart!)
                        : '',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              // Vertical divider
              Container(
                width: 3,
                height: 50,
                decoration: BoxDecoration(
                  color: _getStatusColor(),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 16),
              // Job details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      job.title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      job.customerName,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    Text(
                      job.fullAddress,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              // Status and arrow
              Column(
                children: [
                  _buildStatusChip(context),
                  const SizedBox(height: 8),
                  const Icon(
                    Icons.chevron_right,
                    color: AppColors.textTertiary,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor() {
    switch (job.status) {
      case JobStatus.inProgress:
        return AppColors.primaryOrange;
      case JobStatus.completed:
        return AppColors.secondaryGreen;
      case JobStatus.enRoute:
        return AppColors.warning;
      default:
        return AppColors.secondaryBlue;
    }
  }

  Widget _buildStatusChip(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _getStatusColor().withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        job.status.displayName,
        style: TextStyle(
          color: _getStatusColor(),
          fontSize: 10,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
