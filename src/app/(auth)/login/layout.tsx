import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: pageMetadata.login.title,
  description: pageMetadata.login.description,
  openGraph: {
    title: pageMetadata.login.title,
    description: pageMetadata.login.description,
    url: `${siteConfig.url}/login`,
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
