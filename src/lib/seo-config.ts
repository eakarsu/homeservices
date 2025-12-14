// SEO Configuration for Home Services AI Platform
// Update these values with your actual business information

export const siteConfig = {
  name: 'ServiceCrew AI',
  title: 'ServiceCrew AI - Smart Field Service Management Platform',
  description: 'AI-powered field service management platform for home service businesses. Streamline scheduling, dispatch, invoicing, and customer management with intelligent automation.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://servicecrewai.com',
  ogImage: '/og-image.png',
  twitterHandle: '@servicecrewai',
  creator: 'ServiceCrew AI',
  keywords: [
    'field service management',
    'home service software',
    'HVAC scheduling software',
    'plumbing business software',
    'electrical contractor software',
    'service dispatch software',
    'field service automation',
    'work order management',
    'technician scheduling',
    'service business CRM',
    'AI field service',
    'smart dispatching',
    'mobile workforce management',
    'customer management software',
    'invoice automation',
  ],
  authors: [
    {
      name: 'ServiceCrew AI',
      url: 'https://servicecrewai.com',
    },
  ],
  themeColor: '#3B82F6', // Blue-500
  locale: 'en_US',
}

// Structured data for the organization
export const organizationSchema = {
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

// Structured data for the software application
export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteConfig.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  description: siteConfig.description,
  url: siteConfig.url,
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0',
    highPrice: '199',
    offerCount: '3',
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

// FAQ Schema for common questions
export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is ServiceCrew AI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ServiceCrew AI is an AI-powered field service management platform designed for home service businesses like HVAC, plumbing, and electrical contractors. It streamlines scheduling, dispatch, invoicing, and customer management.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does AI improve field service management?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI optimizes technician routes, predicts job durations, automates scheduling conflicts, and provides smart recommendations for dispatching the right technician to each job.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a free trial available?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! ServiceCrew AI offers a free starter plan with essential features. No credit card required to get started.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can technicians use the platform on mobile devices?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely! Our mobile-optimized technician interface works on any smartphone or tablet, allowing techs to view jobs, update status, capture signatures, and process payments in the field.',
      },
    },
  ],
}

// Page-specific metadata configurations
export const pageMetadata = {
  home: {
    title: siteConfig.title,
    description: siteConfig.description,
    keywords: siteConfig.keywords.join(', '),
  },
  login: {
    title: 'Login | ServiceCrew AI',
    description: 'Sign in to your ServiceCrew AI account to manage your field service operations.',
  },
  register: {
    title: 'Start Free Trial | ServiceCrew AI',
    description: 'Create your free ServiceCrew AI account. No credit card required. Start managing your field service business smarter today.',
  },
  dashboard: {
    title: 'Dashboard | ServiceCrew AI',
    description: 'Your ServiceCrew AI dashboard - manage jobs, technicians, and customers all in one place.',
  },
  pricing: {
    title: 'Pricing Plans | ServiceCrew AI',
    description: 'Simple, transparent pricing for field service businesses of all sizes. Start free, upgrade as you grow.',
  },
  features: {
    title: 'Features | ServiceCrew AI',
    description: 'Discover powerful features for field service management: AI scheduling, smart dispatch, mobile apps, invoicing, and more.',
  },
}
