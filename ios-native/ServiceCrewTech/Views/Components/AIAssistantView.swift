import SwiftUI

struct AIAssistantView: View {
    let tradeType: TradeType
    @Binding var diagnosticResult: DiagnosticResult?
    let isLoading: Bool
    let onSubmit: (String) -> Void

    @State private var symptoms = ""

    var body: some View {
        VStack(spacing: 16) {
            // Header card
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: "sparkles")
                        .foregroundColor(.primaryOrange)

                    Text("AI Diagnostic Assistant")
                        .font(.headline)
                        .foregroundColor(.textPrimary)
                }

                Text("Describe the symptoms and get AI-powered diagnostic suggestions.")
                    .font(.subheadline)
                    .foregroundColor(.textSecondary)

                TextEditor(text: $symptoms)
                    .frame(minHeight: 80)
                    .padding(8)
                    .background(Color.backgroundSecondary)
                    .cornerRadius(12)
                    .overlay(
                        Group {
                            if symptoms.isEmpty {
                                Text("e.g., AC unit not cooling, making clicking noise, ice buildup on coils...")
                                    .font(.subheadline)
                                    .foregroundColor(.textTertiary)
                                    .padding(12)
                            }
                        },
                        alignment: .topLeading
                    )

                Button(action: { onSubmit(symptoms) }) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            Text("Analyzing...")
                        } else {
                            Image(systemName: "sparkles")
                            Text("Get Diagnostic Help")
                        }
                    }
                    .primaryButtonStyle()
                }
                .disabled(symptoms.isEmpty || isLoading)
            }
            .padding()
            .background(
                LinearGradient(
                    colors: [Color.primaryOrange.opacity(0.1), Color.secondaryBlue.opacity(0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(16)

            // Results
            if let result = diagnosticResult {
                // Possible Causes
                resultSection(
                    title: "Possible Causes",
                    icon: "exclamationmark.triangle.fill",
                    color: .secondaryRed,
                    items: result.possibleCauses
                )

                // Diagnostic Steps
                resultSection(
                    title: "Diagnostic Steps",
                    icon: "list.number",
                    color: .secondaryBlue,
                    items: result.diagnosticSteps,
                    numbered: true
                )

                // Recommended Parts
                resultSection(
                    title: "Recommended Parts",
                    icon: "wrench.and.screwdriver.fill",
                    color: .secondaryGreen,
                    items: result.recommendedParts
                )

                // Safety Warnings
                if !result.safetyWarnings.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "exclamationmark.shield.fill")
                                .foregroundColor(.secondaryYellow)

                            Text("Safety Warnings")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.textPrimary)
                        }

                        ForEach(result.safetyWarnings, id: \.self) { warning in
                            HStack(alignment: .top, spacing: 8) {
                                Text("⚠️")
                                Text(warning)
                                    .font(.subheadline)
                                    .foregroundColor(.textSecondary)
                            }
                        }
                    }
                    .padding()
                    .background(Color.secondaryYellow.opacity(0.15))
                    .cornerRadius(12)
                }
            }
        }
    }

    private func resultSection(
        title: String,
        icon: String,
        color: Color,
        items: [String],
        numbered: Bool = false
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)

                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.textPrimary)
            }

            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                    HStack(alignment: .top, spacing: 8) {
                        if numbered {
                            Text("\(index + 1).")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(color)
                        } else {
                            Circle()
                                .fill(color)
                                .frame(width: 6, height: 6)
                                .padding(.top, 6)
                        }

                        Text(item)
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)
                    }
                }
            }
        }
        .padding()
        .cardStyle()
    }
}

#Preview {
    ScrollView {
        AIAssistantView(
            tradeType: .hvac,
            diagnosticResult: .constant(DiagnosticResult(
                possibleCauses: ["Refrigerant leak", "Dirty condenser coils", "Faulty compressor"],
                diagnosticSteps: ["Check refrigerant levels", "Inspect condenser coils", "Test compressor"],
                recommendedParts: ["Refrigerant", "Capacitor", "Contactor"],
                safetyWarnings: ["Ensure power is off before inspection"]
            )),
            isLoading: false,
            onSubmit: { _ in }
        )
        .padding()
    }
}
