import { siteConfig } from '@/lib/seo-config'

interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Pre-built schema components for common use cases

export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    sameAs: [
      'https://twitter.com/servicecrewai',
      'https://linkedin.com/company/servicecrewai',
      'https://facebook.com/servicecrewai',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
  }

  return <JsonLd data={schema} />
}

export function SoftwareApplicationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    description: siteConfig.description,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '199',
      offerCount: '3',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '500',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'AI-Powered Scheduling',
      'Smart Dispatching',
      'Mobile Technician App',
      'Customer Portal',
      'Invoice Automation',
      'Inventory Management',
      'Real-time GPS Tracking',
      'Automated Reminders',
    ],
  }

  return <JsonLd data={schema} />
}

export function FAQPageJsonLd({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return <JsonLd data={schema} />
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <JsonLd data={schema} />
}

export function LocalBusinessJsonLd({
  name,
  address,
  telephone,
  priceRange,
}: {
  name: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  telephone: string
  priceRange: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    telephone,
    priceRange,
    url: siteConfig.url,
  }

  return <JsonLd data={schema} />
}

export function WebPageJsonLd({
  title,
  description,
  url,
}: {
  title: string
  description: string
  url: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  }

  return <JsonLd data={schema} />
}

export function ProductJsonLd({
  name,
  description,
  price,
  priceCurrency = 'USD',
  availability = 'InStock',
}: {
  name: string
  description: string
  price: number
  priceCurrency?: string
  availability?: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
      availability: `https://schema.org/${availability}`,
    },
  }

  return <JsonLd data={schema} />
}

export function ServiceJsonLd({
  name,
  description,
  provider,
  areaServed,
}: {
  name: string
  description: string
  provider: string
  areaServed?: string[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
    },
    ...(areaServed && {
      areaServed: areaServed.map((area) => ({
        '@type': 'Place',
        name: area,
      })),
    }),
  }

  return <JsonLd data={schema} />
}
