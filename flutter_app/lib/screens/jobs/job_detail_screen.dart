import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/job.dart';
import '../../providers/job_provider.dart';
import '../../providers/location_provider.dart';
import '../../utils/app_colors.dart';
import '../../widgets/status_badge.dart';

class JobDetailScreen extends StatefulWidget {
  final String jobId;

  const JobDetailScreen({super.key, required this.jobId});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _noteController = TextEditingController();
  final _symptomsController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JobProvider>().loadJob(widget.jobId);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _noteController.dispose();
    _symptomsController.dispose();
    super.dispose();
  }

  Future<void> _takePhoto() async {
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );
    if (photo != null) {
      await context.read<JobProvider>().uploadPhoto(widget.jobId, File(photo.path));
    }
  }

  Future<void> _pickPhoto() async {
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );
    if (photo != null) {
      await context.read<JobProvider>().uploadPhoto(widget.jobId, File(photo.path));
    }
  }

  Future<void> _addNote() async {
    if (_noteController.text.isEmpty) return;
    await context.read<JobProvider>().addNote(widget.jobId, _noteController.text);
    _noteController.clear();
  }

  Future<void> _getDiagnostics() async {
    if (_symptomsController.text.isEmpty) return;
    final job = context.read<JobProvider>().selectedJob;
    if (job == null) return;
    await context.read<JobProvider>().getDiagnostics(
      job.tradeType.name.toUpperCase(),
      _symptomsController.text,
    );
  }

  void _callPhone(String? phone) async {
    if (phone == null) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _openMaps(String address) async {
    final uri = Uri.parse('https://maps.google.com/?q=${Uri.encodeComponent(address)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<JobProvider>(
      builder: (context, jobProvider, _) {
        final job = jobProvider.selectedJob;

        if (jobProvider.isLoading && job == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Job Details')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        if (job == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Job Details')),
            body: const Center(child: Text('Job not found')),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(job.jobNumber),
            actions: [
              StatusBadge(status: job.status),
              const SizedBox(width: 8),
              StatusBadge(priority: job.priority),
              const SizedBox(width: 16),
            ],
          ),
          body: Column(
            children: [
              // Customer & Location Card
              _buildCustomerCard(job),

              // Action Buttons
              _buildActionButtons(job, jobProvider),

              // Tabs
              TabBar(
                controller: _tabController,
                labelColor: AppColors.primaryOrange,
                unselectedLabelColor: AppColors.textSecondary,
                indicatorColor: AppColors.primaryOrange,
                isScrollable: true,
                tabs: const [
                  Tab(text: 'Details'),
                  Tab(icon: Icon(Icons.camera_alt), text: 'Photos'),
                  Tab(text: 'Notes'),
                  Tab(text: 'Parts'),
                  Tab(icon: Icon(Icons.auto_awesome), text: 'AI'),
                ],
              ),

              // Tab Content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildDetailsTab(job),
                    _buildPhotosTab(job),
                    _buildNotesTab(job),
                    _buildPartsTab(job),
                    _buildAITab(job, jobProvider),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCustomerCard(Job job) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    job.customerName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                if (job.customer?.phone != null)
                  IconButton(
                    icon: const Icon(Icons.phone, color: AppColors.secondaryGreen),
                    onPressed: () => _callPhone(job.customer?.phone),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: () => _openMaps(job.fullAddress),
              child: Row(
                children: [
                  const Icon(Icons.location_on, color: AppColors.primaryOrange, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      job.fullAddress,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                  const Icon(Icons.open_in_new, size: 16, color: AppColors.primaryOrange),
                ],
              ),
            ),
            if (job.timeWindowStart != null && job.timeWindowEnd != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.schedule, size: 20, color: AppColors.textTertiary),
                  const SizedBox(width: 8),
                  Text(
                    '${job.timeWindowStart} - ${job.timeWindowEnd}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  if (job.estimatedDuration != null)
                    Text(
                      ' (${job.estimatedDuration} min)',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(Job job, JobProvider jobProvider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          if (job.canStart)
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => jobProvider.updateJobStatus(job.id, JobStatus.inProgress),
                icon: const Icon(Icons.play_arrow),
                label: const Text('Start Job'),
              ),
            ),
          if (job.canPause) ...[
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => jobProvider.updateJobStatus(job.id, JobStatus.onHold),
                icon: const Icon(Icons.pause),
                label: const Text('Pause'),
              ),
            ),
            const SizedBox(width: 12),
          ],
          if (job.canComplete)
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => jobProvider.updateJobStatus(job.id, JobStatus.completed),
                icon: const Icon(Icons.check_circle),
                label: const Text('Complete'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondaryGreen,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDetailsTab(Job job) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (job.description != null && job.description!.isNotEmpty) ...[
          _buildInfoCard('Description', Icons.description, job.description!),
          const SizedBox(height: 16),
        ],
        _buildInfoCard(
          'Service Info',
          Icons.build,
          '',
          child: Column(
            children: [
              _buildInfoRow('Type', job.serviceType?.name ?? 'Not specified'),
              _buildInfoRow('Trade', job.tradeType.displayName),
              if (job.scheduledStart != null)
                _buildInfoRow('Scheduled', job.scheduledStart.toString()),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPhotosTab(Job job) {
    final locationProvider = context.watch<LocationProvider>();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Camera buttons
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _takePhoto,
                icon: const Icon(Icons.camera_alt),
                label: const Text('Take Photo'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _pickPhoto,
                icon: const Icon(Icons.photo_library),
                label: const Text('Choose Photo'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // GPS info
        if (locationProvider.latitude != null)
          Text(
            'GPS: ${locationProvider.coordinateString}',
            style: Theme.of(context).textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
        const SizedBox(height: 16),

        // Photo grid
        if (job.photos.isEmpty)
          _buildEmptyState(Icons.camera_alt, 'No photos yet', 'Take or choose photos of the job site')
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: job.photos.length,
            itemBuilder: (context, index) {
              final photo = job.photos[index];
              return ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  photo.url,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return const Center(child: CircularProgressIndicator());
                  },
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildNotesTab(Job job) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _noteController,
                  decoration: const InputDecoration(hintText: 'Add a note...'),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _addNote,
                child: const Text('Add'),
              ),
            ],
          ),
        ),
        Expanded(
          child: job.notes.isEmpty
              ? _buildEmptyState(Icons.note, 'No notes yet', 'Add notes about the job')
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: job.notes.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final note = job.notes[index];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(note.content),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  note.noteType.name.toUpperCase(),
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                Text(
                                  note.createdAt.toString(),
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildPartsTab(Job job) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        OutlinedButton.icon(
          onPressed: () {/* TODO: Add parts */},
          icon: const Icon(Icons.add_circle),
          label: const Text('Add Parts Used'),
        ),
        const SizedBox(height: 16),
        if (job.partsUsed.isEmpty)
          _buildEmptyState(Icons.inventory_2, 'No parts added', 'Add parts used on this job')
        else
          ...job.partsUsed.map((item) => Card(
                child: ListTile(
                  title: Text(item.description),
                  subtitle: Text('Qty: ${item.quantity.toInt()}'),
                  trailing: Text(
                    '\$${item.totalPrice.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              )),
      ],
    );
  }

  Widget _buildAITab(Job job, JobProvider jobProvider) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          color: AppColors.primaryOrange.withOpacity(0.1),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: AppColors.primaryOrange),
                    const SizedBox(width: 8),
                    Text(
                      'AI Diagnostic Assistant',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text('Describe the symptoms and get AI-powered diagnostic suggestions.'),
                const SizedBox(height: 12),
                TextField(
                  controller: _symptomsController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    hintText: 'e.g., AC not cooling, making clicking noise...',
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: jobProvider.isLoading ? null : _getDiagnostics,
                    icon: jobProvider.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.auto_awesome),
                    label: Text(jobProvider.isLoading ? 'Analyzing...' : 'Get Diagnostic Help'),
                  ),
                ),
              ],
            ),
          ),
        ),
        if (jobProvider.diagnosticResult != null) ...[
          const SizedBox(height: 16),
          _buildDiagnosticSection(
            'Possible Causes',
            Icons.warning,
            AppColors.secondaryRed,
            jobProvider.diagnosticResult!.possibleCauses,
          ),
          const SizedBox(height: 12),
          _buildDiagnosticSection(
            'Diagnostic Steps',
            Icons.list,
            AppColors.secondaryBlue,
            jobProvider.diagnosticResult!.diagnosticSteps,
            numbered: true,
          ),
          const SizedBox(height: 12),
          _buildDiagnosticSection(
            'Recommended Parts',
            Icons.build,
            AppColors.secondaryGreen,
            jobProvider.diagnosticResult!.recommendedParts,
          ),
          if (jobProvider.diagnosticResult!.safetyWarnings.isNotEmpty) ...[
            const SizedBox(height: 12),
            _buildDiagnosticSection(
              'Safety Warnings',
              Icons.shield,
              AppColors.secondaryYellow,
              jobProvider.diagnosticResult!.safetyWarnings,
            ),
          ],
        ],
      ],
    );
  }

  Widget _buildInfoCard(String title, IconData icon, String content, {Widget? child}) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: AppColors.textSecondary),
                const SizedBox(width: 8),
                Text(title, style: Theme.of(context).textTheme.titleSmall),
              ],
            ),
            const SizedBox(height: 8),
            if (content.isNotEmpty) Text(content),
            if (child != null) child,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(value),
        ],
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String title, String subtitle) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: AppColors.textTertiary),
            const SizedBox(height: 16),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }

  Widget _buildDiagnosticSection(
    String title,
    IconData icon,
    Color color,
    List<String> items, {
    bool numbered = false,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(color: color)),
              ],
            ),
            const SizedBox(height: 12),
            ...items.asMap().entries.map((entry) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (numbered)
                        Text('${entry.key + 1}. ', style: TextStyle(color: color, fontWeight: FontWeight.w500))
                      else
                        Container(
                          width: 6,
                          height: 6,
                          margin: const EdgeInsets.only(top: 6, right: 8),
                          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                        ),
                      Expanded(child: Text(entry.value)),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
