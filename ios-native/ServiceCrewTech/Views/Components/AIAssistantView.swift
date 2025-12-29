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
                if let causes = result.possibleCauses, !causes.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.secondaryRed)
                            Text("Possible Causes")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.textPrimary)
                        }

                        ForEach(causes, id: \.cause) { cause in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(cause.cause)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                        .foregroundColor(.textPrimary)
                                    Spacer()
                                    Text("\(cause.probability)%")
                                        .font(.caption)
                                        .foregroundColor(.secondaryRed)
                                }
                                Text(cause.explanation)
                                    .font(.caption)
                                    .foregroundColor(.textSecondary)
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .padding()
                    .cardStyle()
                }

                // Recommended Actions
                if let actions = result.recommendedActions, !actions.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "list.number")
                                .foregroundColor(.secondaryBlue)
                            Text("Recommended Actions")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.textPrimary)
                        }

                        ForEach(Array(actions.enumerated()), id: \.offset) { index, action in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text("\(index + 1). \(action.action)")
                                        .font(.subheadline)
                                        .foregroundColor(.textPrimary)
                                    Spacer()
                                    Text(action.priority)
                                        .font(.caption2)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(action.priority == "high" ? Color.red.opacity(0.2) : Color.blue.opacity(0.2))
                                        .cornerRadius(4)
                                }
                                HStack {
                                    Text("~\(action.estimatedTime) min")
                                        .font(.caption)
                                        .foregroundColor(.textTertiary)
                                    if !action.partsNeeded.isEmpty {
                                        Text("Parts: \(action.partsNeeded.joined(separator: ", "))")
                                            .font(.caption)
                                            .foregroundColor(.textSecondary)
                                    }
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                    .padding()
                    .cardStyle()
                }

                // Estimated Cost
                if let cost = result.estimatedRepairCost {
                    HStack {
                        Image(systemName: "dollarsign.circle.fill")
                            .foregroundColor(.secondaryGreen)
                        Text("Estimated Cost:")
                            .font(.subheadline)
                            .foregroundColor(.textSecondary)
                        Spacer()
                        Text("$\(Int(cost.low)) - $\(Int(cost.high))")
                            .font(.headline)
                            .foregroundColor(.primaryOrange)
                    }
                    .padding()
                    .cardStyle()
                }

                // Safety Warnings
                if let warnings = result.safetyWarnings, !warnings.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: "exclamationmark.shield.fill")
                                .foregroundColor(.secondaryYellow)

                            Text("Safety Warnings")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.textPrimary)
                        }

                        ForEach(warnings, id: \.self) { warning in
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
}

#Preview {
    ScrollView {
        AIAssistantView(
            tradeType: .hvac,
            diagnosticResult: .constant(DiagnosticResult(
                possibleCauses: [
                    DiagnosticResult.PossibleCause(cause: "Refrigerant leak", probability: 45, explanation: "Low refrigerant levels often cause poor cooling"),
                    DiagnosticResult.PossibleCause(cause: "Dirty condenser coils", probability: 30, explanation: "Blocked airflow reduces cooling efficiency"),
                    DiagnosticResult.PossibleCause(cause: "Faulty compressor", probability: 25, explanation: "Compressor failure prevents refrigerant circulation")
                ],
                recommendedActions: [
                    DiagnosticResult.RecommendedAction(action: "Check refrigerant levels", priority: "high", estimatedTime: 30, partsNeeded: ["Refrigerant gauge"]),
                    DiagnosticResult.RecommendedAction(action: "Clean condenser coils", priority: "medium", estimatedTime: 45, partsNeeded: ["Coil cleaner"]),
                    DiagnosticResult.RecommendedAction(action: "Test compressor", priority: "low", estimatedTime: 20, partsNeeded: [])
                ],
                additionalQuestions: nil,
                safetyWarnings: ["Ensure power is off before inspection", "Wear protective gloves when handling refrigerant"],
                estimatedRepairCost: DiagnosticResult.RepairCost(low: 150, high: 450)
            )),
            isLoading: false,
            onSubmit: { _ in }
        )
        .padding()
    }
}
