type DemoUser = { companyId: string; email: string; role: string; isActive: boolean; emailVerified: boolean }

export function publicDemoConfig(env: Record<string, string | undefined> = process.env) {
  if (env.PUBLIC_DEMO_LOGIN_ENABLED !== 'true') return null
  const email = env.PUBLIC_DEMO_EMAIL?.trim().toLowerCase()
  const password = env.PUBLIC_DEMO_PASSWORD
  const companyId = env.PUBLIC_DEMO_COMPANY_ID
  if (!email?.endsWith('@example.invalid') || !password || password.length < 12 || !companyId) return null
  return { email, password, companyId }
}

export function isPublicDemoUser(user: DemoUser, env: Record<string, string | undefined> = process.env) {
  const demo = publicDemoConfig(env)
  return !!demo && user.email === demo.email && user.companyId === demo.companyId
    && user.role === 'OFFICE' && user.isActive && user.emailVerified
}
