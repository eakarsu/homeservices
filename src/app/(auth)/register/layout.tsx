import type { Metadata } from 'next'
import { pageMetadata, siteConfig } from '@/lib/seo-config'

export const metadata: Metadata = {
  title: pageMetadata.register.title,
  description: pageMetadata.register.description,
  openGraph: {
    title: pageMetadata.register.title,
    description: pageMetadata.register.description,
    url: `${siteConfig.url}/register`,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
