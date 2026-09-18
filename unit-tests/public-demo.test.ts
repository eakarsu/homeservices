import test from 'node:test'
import assert from 'node:assert/strict'
import { publicDemoConfig, isPublicDemoUser } from '../src/lib/public-demo'

const env = { PUBLIC_DEMO_LOGIN_ENABLED:'true', PUBLIC_DEMO_EMAIL:'public-demo@example.invalid', PUBLIC_DEMO_PASSWORD:'sample-password-only', PUBLIC_DEMO_COMPANY_ID:'sample-company' }
const user = { email:env.PUBLIC_DEMO_EMAIL, companyId:'sample-company', role:'OFFICE', isActive:true, emailVerified:true }
test('public autofill requires explicit separate demo configuration', () => {
  assert.equal(publicDemoConfig({}),null)
  for (const patch of [{PUBLIC_DEMO_LOGIN_ENABLED:'false'}, {PUBLIC_DEMO_EMAIL:'owner@real-company.com'}, {PUBLIC_DEMO_PASSWORD:'short'}, {PUBLIC_DEMO_COMPANY_ID:''}]) {
    assert.equal(publicDemoConfig({...env,...patch}),null)
  }
  assert.equal(isPublicDemoUser(user,env),true)
})
test('public autofill excludes privileged, inactive, unverified and other-company accounts', () => {
  for (const patch of [{role:'ADMIN'}, {role:'MANAGER'}, {companyId:'real-company'}, {isActive:false}, {emailVerified:false}, {email:'someone@example.invalid'}]) {
    assert.equal(isPublicDemoUser({...user,...patch},env),false)
  }
})
