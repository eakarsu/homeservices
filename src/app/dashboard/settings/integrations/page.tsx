'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  MapIcon,
  SparklesIcon,
  CloudIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  status: 'connected' | 'disconnected' | 'error'
  category: 'payments' | 'communications' | 'maps' | 'ai' | 'accounting'
  configFields: {
    key: string
    label: string
    type: 'text' | 'password'
    required: boolean
  }[]
  config?: Record<string, string>
}

const integrations: Integration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept credit card payments from customers',
    icon: CreditCardIcon,
    status: 'disconnected',
    category: 'payments',
    configFields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false },
    ]
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Send SMS notifications and reminders',
    icon: ChatBubbleLeftRightIcon,
    status: 'disconnected',
    category: 'communications',
    configFields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'phoneNumber', label: 'Phone Number', type: 'text', required: true },
    ]
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Send transactional emails to customers',
    icon: EnvelopeIcon,
    status: 'disconnected',
    category: 'communications',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'fromEmail', label: 'From Email', type: 'text', required: true },
      { key: 'fromName', label: 'From Name', type: 'text', required: false },
    ]
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Route optimization and address lookup',
    icon: MapIcon,
    status: 'disconnected',
    category: 'maps',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'AI-powered diagnostics and dispatch optimization',
    icon: SparklesIcon,
    status: 'disconnected',
    category: 'ai',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'model', label: 'Model', type: 'text', required: false },
    ]
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync invoices and payments with accounting',
    icon: CloudIcon,
    status: 'disconnected',
    category: 'accounting',
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ]
  },
]

const categories = [
  { id: 'all', name: 'All' },
  { id: 'payments', name: 'Payments' },
  { id: 'communications', name: 'Communications' },
  { id: 'maps', name: 'Maps & Routing' },
  { id: 'ai', name: 'AI Features' },
  { id: 'accounting', name: 'Accounting' },
]

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const { data: savedIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      // In a real app, this would fetch from API
      return {} as Record<string, { status: string; config: Record<string, string> }>
    }
  })

  const saveMutation = useMutation({
    mutationFn: async ({ integrationId, config }: { integrationId: string; config: Record<string, string> }) => {
      const res = await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId, config })
      })
      if (!res.ok) throw new Error('Failed to save integration')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      setConfiguring(null)
      setFormData({})
    }
  })

  const testMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await fetch(`/api/settings/integrations/${integrationId}/test`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error('Connection test failed')
      return res.json()
    }
  })

  const filteredIntegrations = integrations.filter(
    i => selectedCategory === 'all' || i.category === selectedCategory
  )

  const getIntegrationStatus = (id: string) => {
    return savedIntegrations?.[id]?.status || 'disconnected'
  }

  const handleConfigure = (integration: Integration) => {
    setConfiguring(integration.id)
    setFormData(savedIntegrations?.[integration.id]?.config || {})
  }

  const handleSave = () => {
    if (!configuring) return
    saveMutation.mutate({ integrationId: configuring, config: formData })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500">Connect third-party services to enhance your workflow</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              selectedCategory === cat.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration) => {
          const status = getIntegrationStatus(integration.id)
          const Icon = integration.icon

          return (
            <div key={integration.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-3 rounded-lg',
                    status === 'connected' ? 'bg-green-100' :
                    status === 'error' ? 'bg-red-100' :
                    'bg-gray-100'
                  )}>
                    <Icon className={cn(
                      'w-6 h-6',
                      status === 'connected' ? 'text-green-600' :
                      status === 'error' ? 'text-red-600' :
                      'text-gray-600'
                    )} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{integration.name}</h2>
                    <span className={cn(
                      'text-xs font-medium',
                      status === 'connected' ? 'text-green-600' :
                      status === 'error' ? 'text-red-600' :
                      'text-gray-500'
                    )}>
                      {status === 'connected' ? 'Connected' :
                       status === 'error' ? 'Error' :
                       'Not connected'}
                    </span>
                  </div>
                </div>
                {status === 'connected' ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : status === 'error' ? (
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                ) : null}
              </div>

              <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleConfigure(integration)}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  Configure
                </button>
                {status === 'connected' && (
                  <button
                    onClick={() => testMutation.mutate(integration.id)}
                    disabled={testMutation.isPending}
                    className="btn-secondary text-sm"
                  >
                    <ArrowPathIcon className={cn(
                      'w-4 h-4',
                      testMutation.isPending && 'animate-spin'
                    )} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Configuration Modal */}
      {configuring && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Configure {integrations.find(i => i.id === configuring)?.name}
            </h2>

            <div className="space-y-4 mb-6">
              {integrations.find(i => i.id === configuring)?.configFields.map((field) => (
                <div key={field.key}>
                  <label className="label">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="input"
                    placeholder={field.type === 'password' ? '••••••••' : ''}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfiguring(null)
                  setFormData({})
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex-1 btn-primary"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
