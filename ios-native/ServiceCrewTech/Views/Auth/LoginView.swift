import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var socialAuth = SocialAuthManager.shared

    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showPassword = false

    @FocusState private var focusedField: Field?

    enum Field {
        case email, password
    }

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color.primaryOrange, Color.primaryOrangeDark],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    Spacer()
                        .frame(height: 60)

                    // Logo and title
                    VStack(spacing: 16) {
                        Image(systemName: "wrench.and.screwdriver.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.white)

                        Text("ServiceCrew Tech")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        Text("Field Technician App")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    }

                    // Login form
                    VStack(spacing: 20) {
                        // Email field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.textSecondary)

                            HStack {
                                Image(systemName: "envelope.fill")
                                    .foregroundColor(.textTertiary)

                                TextField("Enter your email", text: $email)
                                    .keyboardType(.emailAddress)
                                    .textContentType(.emailAddress)
                                    .autocapitalization(.none)
                                    .autocorrectionDisabled()
                                    .focused($focusedField, equals: .email)
                            }
                            .padding()
                            .background(Color.backgroundSecondary)
                            .cornerRadius(12)
                        }

                        // Password field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.textSecondary)

                            HStack {
                                Image(systemName: "lock.fill")
                                    .foregroundColor(.textTertiary)

                                if showPassword {
                                    TextField("Enter your password", text: $password)
                                        .textContentType(.password)
                                        .focused($focusedField, equals: .password)
                                } else {
                                    SecureField("Enter your password", text: $password)
                                        .textContentType(.password)
                                        .focused($focusedField, equals: .password)
                                }

                                Button(action: { showPassword.toggle() }) {
                                    Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                                        .foregroundColor(.textTertiary)
                                }
                            }
                            .padding()
                            .background(Color.backgroundSecondary)
                            .cornerRadius(12)
                        }

                        // Login button
                        Button(action: login) {
                            HStack {
                                if isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Text("Sign In")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(isFormValid ? Color.primaryOrange : Color.primaryOrange.opacity(0.5))
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .disabled(!isFormValid || isLoading)

                        // Forgot password
                        Button(action: { /* TODO: Implement */ }) {
                            Text("Forgot Password?")
                                .font(.subheadline)
                                .foregroundColor(.primaryOrange)
                        }

                        // Divider
                        HStack(spacing: 12) {
                            Rectangle()
                                .fill(Color.borderColor)
                                .frame(height: 1)
                            Text("or continue with")
                                .font(.caption)
                                .foregroundColor(.textTertiary)
                            Rectangle()
                                .fill(Color.borderColor)
                                .frame(height: 1)
                        }
                        .padding(.top, 8)

                        // Social Login Buttons
                        HStack(spacing: 16) {
                            // Apple
                            SocialLoginButton(
                                icon: "apple.logo",
                                label: "Apple",
                                backgroundColor: .charcoal,
                                foregroundColor: .white
                            ) {
                                Task {
                                    _ = await authManager.signInWithApple()
                                }
                            }

                            // Google
                            SocialLoginButton(
                                icon: "g.circle.fill",
                                label: "Google",
                                backgroundColor: .googleBlue,
                                foregroundColor: .white
                            ) {
                                Task {
                                    await socialAuth.signInWithGoogle()
                                }
                            }

                            // Microsoft
                            MicrosoftLoginButton {
                                Task {
                                    await socialAuth.signInWithMicrosoft()
                                }
                            }
                        }

                        // Error message for social auth
                        if let error = socialAuth.error {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.primaryOrange)
                                .multilineTextAlignment(.center)
                                .padding(.top, 8)
                        }
                    }
                    .padding(24)
                    .background(Color.white)
                    .cornerRadius(24)
                    .shadow(color: Color.black.opacity(0.1), radius: 20, x: 0, y: 10)
                    .padding(.horizontal, 24)

                    Spacer()

                    // Version info
                    Text("Version 1.0.0")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                        .padding(.bottom, 20)
                }
            }
        }
        .alert("Login Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
        .onTapGesture {
            hideKeyboard()
        }
    }

    private var isFormValid: Bool {
        !email.isEmpty && !password.isEmpty && email.isValidEmail
    }

    private func login() {
        hideKeyboard()
        isLoading = true

        Task {
            do {
                try await authManager.login(email: email, password: password)
            } catch let error as APIError {
                errorMessage = error.message
                showError = true
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isLoading = false
        }
    }
}

// MARK: - Social Login Button

struct SocialLoginButton: View {
    let icon: String
    let label: String
    var backgroundColor: Color = .white
    var foregroundColor: Color = .charcoal
    var showBorder: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(foregroundColor)
                    .frame(width: 52, height: 52)
                    .background(backgroundColor)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(showBorder ? Color.borderColor : Color.clear, lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.08), radius: 6, x: 0, y: 3)

                Text(label)
                    .font(.caption2)
                    .foregroundColor(.textSecondary)
            }
        }
    }
}

// MARK: - Microsoft Login Button (Custom icon with colored squares)

struct MicrosoftLoginButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.white)
                        .frame(width: 52, height: 52)
                        .shadow(color: .black.opacity(0.08), radius: 6, x: 0, y: 3)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.borderColor, lineWidth: 1)
                        )

                    // Microsoft squares (no red - using orange instead)
                    VStack(spacing: 2) {
                        HStack(spacing: 2) {
                            Rectangle()
                                .fill(Color(hex: "F7931A")) // Orange instead of red
                                .frame(width: 10, height: 10)
                            Rectangle()
                                .fill(Color(hex: "7FBA00")) // Green
                                .frame(width: 10, height: 10)
                        }
                        HStack(spacing: 2) {
                            Rectangle()
                                .fill(Color(hex: "00A4EF")) // Blue
                                .frame(width: 10, height: 10)
                            Rectangle()
                                .fill(Color(hex: "FFB900")) // Yellow
                                .frame(width: 10, height: 10)
                        }
                    }
                }

                Text("Microsoft")
                    .font(.caption2)
                    .foregroundColor(.textSecondary)
            }
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthManager.shared)
}
