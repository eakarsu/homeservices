import SwiftUI

struct JobCardView: View {
    let job: Job
    var showStatus: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack(alignment: .top) {
                // Status icon
                statusIcon

                VStack(alignment: .leading, spacing: 4) {
                    Text(job.jobNumber)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.textPrimary)

                    Text(job.title)
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                        .lineLimit(1)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    if showStatus {
                        Text(job.status.displayName)
                            .badge(color: job.status.swiftUIColor)
                    }

                    Text(job.priority.displayName)
                        .badge(color: job.priority.swiftUIColor)
                }
            }

            // Location
            HStack(spacing: 8) {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(.textTertiary)

                Text(job.shortAddress)
                    .font(.caption)
                    .foregroundColor(.textSecondary)
                    .lineLimit(1)
            }

            // Time window
            if let timeStart = job.timeWindowStart, let timeEnd = job.timeWindowEnd {
                HStack(spacing: 8) {
                    Image(systemName: "clock.fill")
                        .foregroundColor(.textTertiary)

                    Text("\(timeStart) - \(timeEnd)")
                        .font(.caption)
                        .foregroundColor(.textSecondary)
                }
            }

            // Customer
            HStack {
                Text(job.customerName)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.textSecondary)

                Spacer()

                if let phone = job.customer?.phone {
                    Button(action: { phone.callPhoneNumber() }) {
                        Image(systemName: "phone.fill")
                            .foregroundColor(.secondaryGreen)
                            .padding(8)
                            .background(Color.secondaryGreen.opacity(0.15))
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.top, 4)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    @ViewBuilder
    private var statusIcon: some View {
        switch job.status {
        case .inProgress:
            Image(systemName: "play.circle.fill")
                .foregroundColor(.secondaryBlue)
        case .completed:
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.secondaryGreen)
        default:
            Image(systemName: "calendar.circle.fill")
                .foregroundColor(.textTertiary)
        }
    }
}

#Preview {
    VStack(spacing: 16) {
        JobCardView(
            job: Job(
                id: "1",
                jobNumber: "JOB-001",
                title: "AC Repair and Maintenance Service",
                description: nil,
                status: .scheduled,
                priority: .high,
                tradeType: .hvac,
                scheduledStart: Date(),
                scheduledEnd: nil,
                timeWindowStart: "9:00 AM",
                timeWindowEnd: "11:00 AM",
                estimatedDuration: 120,
                actualDuration: nil,
                customer: Customer(
                    id: "1",
                    firstName: "John",
                    lastName: "Smith",
                    email: nil,
                    phone: "555-1234",
                    alternatePhone: nil,
                    customerType: .residential,
                    companyName: nil,
                    properties: nil,
                    createdAt: nil,
                    updatedAt: nil
                ),
                property: Property(
                    id: "1",
                    address: "123 Main Street",
                    address2: nil,
                    city: "Austin",
                    state: "TX",
                    zip: "78701",
                    country: nil,
                    propertyType: nil,
                    latitude: nil,
                    longitude: nil,
                    notes: nil,
                    equipment: nil
                ),
                serviceType: nil,
                notes: [],
                lineItems: [],
                photos: [],
                createdAt: Date(),
                updatedAt: Date()
            ),
            showStatus: true
        )
    }
    .padding()
    .background(Color.backgroundPrimary)
}
