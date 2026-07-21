#!/usr/bin/env node
'use strict'

const { loadEnvConfig } = require('@next/env')

loadEnvConfig(process.cwd(), false)

const failures = []
const origins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean)
const templateHosts = (process.env.TEMPLATE_ALLOWED_HOSTS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean)
const deliveryHosts = (process.env.EMAIL_DELIVERY_ALLOWED_HOSTS || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean)

if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32 || /(fallback|change-in-production|your-secret|password123)/i.test(process.env.NEXTAUTH_SECRET)) failures.push('NEXTAUTH_SECRET')
if (!process.env.NEXTAUTH_URL?.startsWith('https://')) failures.push('NEXTAUTH_URL (HTTPS required)')
if (!process.env.DATABASE_URL?.startsWith('postgresql://') || /(?:password|localhost)/i.test(process.env.DATABASE_URL)) failures.push('DATABASE_URL (external PostgreSQL required)')
if (!origins.length || origins.includes('*') || origins.some(origin => !origin.startsWith('https://'))) failures.push('CORS_ALLOWED_ORIGINS (explicit HTTPS origins required)')
if (!templateHosts.length || templateHosts.some(host => host.includes('://') || host === '*' || /localhost/i.test(host))) failures.push('TEMPLATE_ALLOWED_HOSTS (explicit external hostnames required)')
if (!process.env.EMAIL_DELIVERY_URL?.startsWith('https://')) failures.push('EMAIL_DELIVERY_URL (HTTPS required)')
if (!deliveryHosts.length || deliveryHosts.some(host => host.includes('://') || host === '*' || /localhost/i.test(host))) failures.push('EMAIL_DELIVERY_ALLOWED_HOSTS (explicit external hostnames required)')
if (!process.env.EMAIL_DELIVERY_TOKEN || process.env.EMAIL_DELIVERY_TOKEN.length < 16) failures.push('EMAIL_DELIVERY_TOKEN')

try {
  const deliveryHost = new URL(process.env.EMAIL_DELIVERY_URL || '').hostname.toLowerCase()
  if (deliveryHost && !deliveryHosts.includes(deliveryHost)) failures.push('EMAIL_DELIVERY_URL host must be allowlisted')
} catch {
  // The HTTPS check above already records an invalid URL.
}

if (failures.length) {
  console.error(`Refusing production startup; invalid configuration: ${failures.join(', ')}`)
  process.exit(1)
}
