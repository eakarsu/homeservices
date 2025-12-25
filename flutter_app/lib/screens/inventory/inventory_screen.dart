import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../utils/app_colors.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  List<InventoryItem> _items = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadInventory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadInventory() async {
    setState(() => _isLoading = true);

    // Mock inventory data - in production, this would come from API
    await Future.delayed(const Duration(milliseconds: 500));

    _items = [
      InventoryItem(
        id: '1',
        name: 'Capacitor 35/5 MFD',
        sku: 'CAP-355-01',
        quantity: 5,
        unitPrice: 24.99,
        category: 'HVAC',
      ),
      InventoryItem(
        id: '2',
        name: 'Contactor 1P 30A',
        sku: 'CON-1P30-01',
        quantity: 3,
        unitPrice: 18.50,
        category: 'HVAC',
      ),
      InventoryItem(
        id: '3',
        name: 'Refrigerant R-410A (25lb)',
        sku: 'REF-410-25',
        quantity: 2,
        unitPrice: 175.00,
        category: 'HVAC',
      ),
      InventoryItem(
        id: '4',
        name: '1/2" Copper Pipe (10ft)',
        sku: 'PIP-CU-05',
        quantity: 8,
        unitPrice: 32.00,
        category: 'Plumbing',
      ),
      InventoryItem(
        id: '5',
        name: 'Ball Valve 3/4"',
        sku: 'VAL-BL-34',
        quantity: 12,
        unitPrice: 8.75,
        category: 'Plumbing',
      ),
      InventoryItem(
        id: '6',
        name: 'Water Heater Element',
        sku: 'WHE-4500-01',
        quantity: 4,
        unitPrice: 22.00,
        category: 'Plumbing',
      ),
      InventoryItem(
        id: '7',
        name: '20A GFCI Outlet',
        sku: 'GFI-20-WH',
        quantity: 10,
        unitPrice: 15.99,
        category: 'Electrical',
      ),
      InventoryItem(
        id: '8',
        name: '200A Main Breaker',
        sku: 'BRK-200-M',
        quantity: 1,
        unitPrice: 89.00,
        category: 'Electrical',
      ),
      InventoryItem(
        id: '9',
        name: '12/2 Romex (250ft)',
        sku: 'WIR-122-250',
        quantity: 2,
        unitPrice: 145.00,
        category: 'Electrical',
      ),
    ];

    setState(() => _isLoading = false);
  }

  List<InventoryItem> _getFilteredItems(String category) {
    var filtered = _items;

    if (category != 'All') {
      filtered = filtered.where((item) => item.category == category).toList();
    }

    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered.where((item) =>
          item.name.toLowerCase().contains(query) ||
          (item.sku?.toLowerCase().contains(query) ?? false)).toList();
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Truck Inventory'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'HVAC'),
            Tab(text: 'Plumbing'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: _scanBarcode,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadInventory,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search parts by name or SKU...',
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

          // Inventory list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildInventoryList('All'),
                      _buildInventoryList('HVAC'),
                      _buildInventoryList('Plumbing'),
                    ],
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addPart,
        icon: const Icon(Icons.add),
        label: const Text('Add Part'),
        backgroundColor: AppColors.primaryOrange,
        foregroundColor: Colors.white,
      ),
    );
  }

  Widget _buildInventoryList(String category) {
    final items = _getFilteredItems(category);

    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.inventory_2_outlined,
              size: 64,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              'No Parts Found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isNotEmpty
                  ? 'Try a different search term'
                  : 'No parts in this category',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadInventory,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return _InventoryItemCard(
            item: item,
            onTap: () => _showItemDetails(item),
            onUsePressed: () => _usePart(item),
          );
        },
      ),
    );
  }

  void _scanBarcode() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Barcode scanner would open here'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _addPart() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => const _AddPartSheet(),
    );
  }

  void _showItemDetails(InventoryItem item) {
    showModalBottomSheet(
      context: context,
      builder: (context) => _ItemDetailsSheet(item: item),
    );
  }

  void _usePart(InventoryItem item) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Use Part'),
        content: Text('Mark 1x "${item.name}" as used for current job?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                final index = _items.indexWhere((i) => i.id == item.id);
                if (index != -1) {
                  _items[index] = InventoryItem(
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    quantity: item.quantity - 1,
                    unitPrice: item.unitPrice,
                    category: item.category,
                  );
                }
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Used 1x ${item.name}'),
                  backgroundColor: AppColors.secondaryGreen,
                ),
              );
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }
}

class _InventoryItemCard extends StatelessWidget {
  final InventoryItem item;
  final VoidCallback onTap;
  final VoidCallback onUsePressed;

  const _InventoryItemCard({
    required this.item,
    required this.onTap,
    required this.onUsePressed,
  });

  @override
  Widget build(BuildContext context) {
    final isLowStock = item.quantity <= 2;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Category icon
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _getCategoryColor().withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _getCategoryIcon(),
                  color: _getCategoryColor(),
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              // Item details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.sku ?? 'No SKU',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: isLowStock
                                ? AppColors.warning.withOpacity(0.1)
                                : AppColors.secondaryGreen.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Qty: ${item.quantity}',
                            style: TextStyle(
                              color: isLowStock
                                  ? AppColors.warning
                                  : AppColors.secondaryGreen,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        if (isLowStock) ...[
                          const SizedBox(width: 8),
                          const Icon(
                            Icons.warning_amber,
                            size: 14,
                            color: AppColors.warning,
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              // Price and use button
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '\$${item.unitPrice?.toStringAsFixed(2) ?? '0.00'}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryOrange,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: item.quantity > 0 ? onUsePressed : null,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      minimumSize: Size.zero,
                    ),
                    child: const Text('Use'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getCategoryColor() {
    switch (item.category) {
      case 'HVAC':
        return AppColors.secondaryBlue;
      case 'Plumbing':
        return AppColors.primaryOrange;
      case 'Electrical':
        return AppColors.warning;
      default:
        return AppColors.textSecondary;
    }
  }

  IconData _getCategoryIcon() {
    switch (item.category) {
      case 'HVAC':
        return Icons.ac_unit;
      case 'Plumbing':
        return Icons.plumbing;
      case 'Electrical':
        return Icons.electrical_services;
      default:
        return Icons.category;
    }
  }
}

class _ItemDetailsSheet extends StatelessWidget {
  final InventoryItem item;

  const _ItemDetailsSheet({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.name,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _DetailRow(label: 'SKU', value: item.sku ?? 'N/A'),
          _DetailRow(label: 'Category', value: item.category ?? 'N/A'),
          _DetailRow(label: 'Quantity in Stock', value: '${item.quantity}'),
          _DetailRow(
            label: 'Unit Price',
            value: '\$${item.unitPrice?.toStringAsFixed(2) ?? 'N/A'}',
          ),
          _DetailRow(
            label: 'Total Value',
            value: '\$${((item.unitPrice ?? 0) * item.quantity).toStringAsFixed(2)}',
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.edit),
                  label: const Text('Edit'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                  label: const Text('Close'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _AddPartSheet extends StatefulWidget {
  const _AddPartSheet();

  @override
  State<_AddPartSheet> createState() => _AddPartSheetState();
}

class _AddPartSheetState extends State<_AddPartSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _skuController = TextEditingController();
  final _quantityController = TextEditingController();
  final _priceController = TextEditingController();
  String _selectedCategory = 'HVAC';

  @override
  void dispose() {
    _nameController.dispose();
    _skuController.dispose();
    _quantityController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        24,
        24,
        24,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Add New Part',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Part Name',
                prefixIcon: Icon(Icons.inventory_2),
              ),
              validator: (value) =>
                  value?.isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _skuController,
              decoration: const InputDecoration(
                labelText: 'SKU (Optional)',
                prefixIcon: Icon(Icons.qr_code),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _quantityController,
                    decoration: const InputDecoration(
                      labelText: 'Quantity',
                      prefixIcon: Icon(Icons.numbers),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) =>
                        value?.isEmpty ?? true ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _priceController,
                    decoration: const InputDecoration(
                      labelText: 'Unit Price',
                      prefixIcon: Icon(Icons.attach_money),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedCategory,
              decoration: const InputDecoration(
                labelText: 'Category',
                prefixIcon: Icon(Icons.category),
              ),
              items: ['HVAC', 'Plumbing', 'Electrical', 'General']
                  .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedCategory = value!),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submit,
                child: const Text('Add Part'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Part added successfully'),
          backgroundColor: AppColors.secondaryGreen,
        ),
      );
    }
  }
}
