import SwiftUI
import AuthenticationServices

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager

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
                        HStack {
                            Rectangle()
                                .fill(Color.textTertiary.opacity(0.3))
                                .frame(height: 1)
                            Text("or")
                                .font(.subheadline)
                                .foregroundColor(.textTertiary)
                                .padding(.horizontal, 16)
                            Rectangle()
                                .fill(Color.textTertiary.opacity(0.3))
                                .frame(height: 1)
                        }
                        .padding(.vertical, 8)

                        // Sign in with Apple
                        SignInWithAppleButton(
                            onRequest: { request in
                                let appleRequest = authManager.startAppleSignIn()
                                request.requestedScopes = appleRequest.requestedScopes
                                request.nonce = appleRequest.nonce
                            },
                            onCompletion: { result in
                                Task {
                                    await authManager.handleAppleSignIn(result: result)
                                }
                            }
                        )
                        .signInWithAppleButtonStyle(.black)
                        .frame(height: 50)
                        .cornerRadius(12)
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

#Preview {
    LoginView()
        .environmentObject(AuthManager.shared)
}
