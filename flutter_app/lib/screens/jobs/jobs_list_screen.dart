import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/job.dart';
import '../../providers/job_provider.dart';
import '../../utils/app_colors.dart';
import '../../widgets/job_card.dart';

class JobsListScreen extends StatefulWidget {
  const JobsListScreen({super.key});

  @override
  State<JobsListScreen> createState() => _JobsListScreenState();
}

class _JobsListScreenState extends State<JobsListScreen> {
  String _searchQuery = '';
  JobFilter _selectedFilter = JobFilter.all;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JobProvider>().loadJobs(all: true);
    });
  }

  List<Job> _filterJobs(List<Job> jobs) {
    var filtered = jobs;

    // Apply status filter
    switch (_selectedFilter) {
      case JobFilter.all:
        break;
      case JobFilter.scheduled:
        filtered = filtered.where((j) =>
          [JobStatus.scheduled, JobStatus.dispatched].contains(j.status)).toList();
        break;
      case JobFilter.active:
        filtered = filtered.where((j) => j.status == JobStatus.inProgress).toList();
        break;
      case JobFilter.completed:
        filtered = filtered.where((j) => j.status == JobStatus.completed).toList();
        break;
    }

    // Apply search
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered.where((j) =>
        j.jobNumber.toLowerCase().contains(query) ||
        j.title.toLowerCase().contains(query) ||
        j.customerName.toLowerCase().contains(query) ||
        j.fullAddress.toLowerCase().contains(query)
      ).toList();
    }

    return filtered;
  }

  int _getFilterCount(List<Job> jobs, JobFilter filter) {
    switch (filter) {
      case JobFilter.all:
        return jobs.length;
      case JobFilter.scheduled:
        return jobs.where((j) =>
          [JobStatus.scheduled, JobStatus.dispatched].contains(j.status)).length;
      case JobFilter.active:
        return jobs.where((j) => j.status == JobStatus.inProgress).length;
      case JobFilter.completed:
        return jobs.where((j) => j.status == JobStatus.completed).length;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Jobs'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<JobProvider>().loadJobs(all: true),
          ),
        ],
      ),
      body: Consumer<JobProvider>(
        builder: (context, jobProvider, _) {
          final filteredJobs = _filterJobs(jobProvider.jobs);

          return Column(
            children: [
              // Search bar
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search jobs, customers, addresses...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () => setState(() => _searchQuery = ''),
                          )
                        : null,
                  ),
                  onChanged: (value) => setState(() => _searchQuery = value),
                ),
              ),

              // Filter tabs
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: JobFilter.values.map((filter) {
                    final isSelected = _selectedFilter == filter;
                    final count = _getFilterCount(jobProvider.jobs, filter);
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text('${filter.label} ($count)'),
                        selected: isSelected,
                        onSelected: (_) => setState(() => _selectedFilter = filter),
                        backgroundColor: filter.color.withOpacity(0.15),
                        selectedColor: filter.color,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : filter.color,
                          fontWeight: FontWeight.w500,
                        ),
                        showCheckmark: false,
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 16),

              // Job list
              Expanded(
                child: jobProvider.isLoading && jobProvider.jobs.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : filteredJobs.isEmpty
                        ? _buildEmptyState()
                        : RefreshIndicator(
                            onRefresh: () => jobProvider.loadJobs(all: true),
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: filteredJobs.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final job = filteredJobs[index];
                                return JobCard(
                                  job: job,
                                  showStatus: true,
                                  onTap: () => context.go('/jobs/${job.id}'),
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
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.search_off,
            size: 64,
            color: AppColors.textTertiary,
          ),
          const SizedBox(height: 16),
          Text(
            'No Jobs Found',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            _searchQuery.isNotEmpty
                ? 'Try a different search term'
                : 'No jobs match this filter',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

enum JobFilter {
  all('All', AppColors.primaryOrange),
  scheduled('Scheduled', AppColors.textSecondary),
  active('Active', AppColors.secondaryBlue),
  completed('Completed', AppColors.secondaryGreen);

  final String label;
  final Color color;

  const JobFilter(this.label, this.color);
}
