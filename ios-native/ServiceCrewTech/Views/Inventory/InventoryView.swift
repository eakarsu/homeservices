import SwiftUI

struct InventoryView: View {
    @StateObject private var viewModel = InventoryViewModel()
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.textTertiary)

                    TextField("Search parts...", text: $searchText)
                        .textFieldStyle(.plain)

                    if !searchText.isEmpty {
                        Button(action: { searchText = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.textTertiary)
                        }
                    }
                }
                .padding()
                .background(Color.backgroundSecondary)
                .cornerRadius(12)
                .padding()

                // Inventory list
                if viewModel.isLoading && viewModel.items.isEmpty {
                    loadingView
                } else if filteredItems.isEmpty {
                    emptyStateView
                } else {
                    List {
                        ForEach(groupedItems.keys.sorted(), id: \.self) { category in
                            Section(header: Text(category)) {
                                ForEach(groupedItems[category] ?? []) { item in
                                    InventoryItemRow(item: item)
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .background(Color.backgroundPrimary)
            .navigationTitle("Inventory")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack {
                        NavigationLink(destination: NewPartView(onSave: {
                            Task { await viewModel.loadInventory() }
                        })) {
                            Image(systemName: "plus")
                        }
                        Button(action: viewModel.refresh) {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                }
            }
            .task {
                await viewModel.loadInventory()
            }
            .refreshable {
                await viewModel.loadInventory()
            }
        }
    }

    private var filteredItems: [InventoryItem] {
        if searchText.isEmpty {
            return viewModel.items
        }
        return viewModel.items.filter { item in
            item.name.lowercased().contains(searchText.lowercased()) ||
            (item.sku?.lowercased().contains(searchText.lowercased()) ?? false)
        }
    }

    private var groupedItems: [String: [InventoryItem]] {
        Dictionary(grouping: filteredItems) { $0.category ?? "Other" }
    }

    private var loadingView: some View {
        VStack {
            Spacer()
            ProgressView()
            Text("Loading inventory...")
                .font(.subheadline)
                .foregroundColor(.textSecondary)
                .padding(.top)
            Spacer()
        }
    }

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "cube.box")
                .font(.system(size: 48))
                .foregroundColor(.textTertiary)

            Text("No Items Found")
                .font(.headline)
                .foregroundColor(.textPrimary)

            Text(searchText.isEmpty ? "Your inventory is empty" : "Try a different search term")
                .font(.subheadline)
                .foregroundColor(.textSecondary)

            Spacer()
        }
    }
}

struct InventoryItemRow: View {
    let item: InventoryItem

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(item.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.textPrimary)

                if let sku = item.sku {
                    Text("SKU: \(sku)")
                        .font(.caption)
                        .foregroundColor(.textTertiary)
                }

                // Show reorder level (min quantity)
                if let minQty = item.minQuantity {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.down.to.line")
                            .font(.caption2)
                        Text("Reorder at: \(minQty)")
                            .font(.caption)
                    }
                    .foregroundColor(item.isLowStock ? .orange : .textTertiary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                HStack(spacing: 4) {
                    Text("\(item.quantity)")
                        .font(.headline)
                        .foregroundColor(item.isLowStock ? .orange : (item.quantity > 0 ? .secondaryGreen : .secondaryRed))

                    if item.isLowStock {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }

                if let price = item.unitPrice {
                    Text(price.asCurrency)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

@MainActor
class InventoryViewModel: ObservableObject {
    @Published var items: [InventoryItem] = []
    @Published var isLoading = false

    func loadInventory() async {
        isLoading = true
        do {
            items = try await APIService.shared.getInventory()
        } catch {
            print("Failed to load inventory: \(error)")
        }
        isLoading = false
    }

    func refresh() {
        Task {
            await loadInventory()
        }
    }
}

// MARK: - New Part View

struct NewPartView: View {
    @Environment(\.dismiss) var dismiss
    var onSave: (() -> Void)?

    // Part Information
    @State private var name = ""
    @State private var partNumber = ""
    @State private var description = ""
    @State private var category = "HVAC"

    // Pricing
    @State private var cost = ""
    @State private var sellPrice = ""

    // Inventory
    @State private var quantity = ""
    @State private var minQuantity = ""
    @State private var location = ""
    @State private var vendor = ""

    @State private var isSaving = false
    @State private var errorMessage: String?

    let categories = ["HVAC", "PLUMBING", "ELECTRICAL", "GENERAL"]

    var body: some View {
        Form {
            Section("Part Information") {
                TextField("Part Name *", text: $name)
                TextField("Part Number", text: $partNumber)
                TextField("Description", text: $description, axis: .vertical)
                    .lineLimit(2...4)
                Picker("Category", selection: $category) {
                    ForEach(categories, id: \.self) { cat in
                        Text(cat).tag(cat)
                    }
                }
            }

            Section("Pricing") {
                TextField("Cost *", text: $cost)
                    .keyboardType(.decimalPad)
                TextField("Sell Price *", text: $sellPrice)
                    .keyboardType(.decimalPad)
            }

            Section("Inventory") {
                TextField("Quantity on Hand", text: $quantity)
                    .keyboardType(.numberPad)
                TextField("Minimum Quantity", text: $minQuantity)
                    .keyboardType(.numberPad)
                TextField("Storage Location", text: $location)
                TextField("Vendor", text: $vendor)
            }

            if let error = errorMessage {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("New Part")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") { dismiss() }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Save") {
                    Task { await savePart() }
                }
                .disabled(!isFormValid || isSaving)
            }
        }
    }

    var isFormValid: Bool {
        !name.isEmpty && !cost.isEmpty && !sellPrice.isEmpty
    }

    func savePart() async {
        isSaving = true
        errorMessage = nil
        do {
            try await InventoryService.shared.createPart(
                name: name,
                partNumber: partNumber.isEmpty ? nil : partNumber,
                description: description.isEmpty ? nil : description,
                category: category,
                cost: Double(cost) ?? 0,
                sellPrice: Double(sellPrice) ?? 0,
                quantity: Int(quantity) ?? 0,
                minQuantity: Int(minQuantity),
                location: location.isEmpty ? nil : location,
                vendor: vendor.isEmpty ? nil : vendor
            )
            onSave?()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}

#Preview {
    InventoryView()
}
