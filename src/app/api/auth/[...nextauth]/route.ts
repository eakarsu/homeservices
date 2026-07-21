import NextAuth from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth'
import { validateRuntimeConfig } from '@/lib/runtime-config'

const handler = NextAuth(authOptions)

async function validatedHandler(request: NextRequest, context: unknown) {
  validateRuntimeConfig()
  return handler(request, context as never)
}

export { validatedHandler as GET, validatedHandler as POST }
