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
                    Button(action: viewModel.refresh) {
                        Image(systemName: "arrow.clockwise")
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
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text("\(item.quantity)")
                    .font(.headline)
                    .foregroundColor(item.quantity > 5 ? .secondaryGreen : (item.quantity > 0 ? .secondaryYellow : .secondaryRed))

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

#Preview {
    InventoryView()
}
