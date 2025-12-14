'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import {
  SparklesIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  StarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface QuoteOption {
  tier: 'good' | 'better' | 'best'
  name: string
  description: string
  laborCost: number
  partsCost: number
  totalCost: number
  warranty: string
  estimatedDuration: string
  features: string[]
  savings?: string
  recommended?: boolean
}

interface QuoteResult {
  customerName: string
  jobDescription: string
  options: QuoteOption[]
  validUntil: string
  notes: string[]
  termsAndConditions: string[]
}

const tradeTypes = ['HVAC', 'PLUMBING', 'ELECTRICAL', 'GENERAL']

const commonServices: Record<string, { name: string; basePrice: number }[]> = {
  HVAC: [
    { name: 'AC Unit Replacement', basePrice: 4500 },
    { name: 'Furnace Installation', basePrice: 3500 },
    { name: 'Duct Cleaning', basePrice: 350 },
    { name: 'AC Tune-Up', basePrice: 150 },
    { name: 'Heat Pump Installation', basePrice: 5500 },
    { name: 'Thermostat Installation', basePrice: 250 }
  ],
  PLUMBING: [
    { name: 'Water Heater Replacement', basePrice: 1500 },
    { name: 'Drain Cleaning', basePrice: 200 },
    { name: 'Pipe Repair', basePrice: 350 },
    { name: 'Faucet Installation', basePrice: 175 },
    { name: 'Toilet Replacement', basePrice: 400 },
    { name: 'Sump Pump Installation', basePrice: 800 }
  ],
  ELECTRICAL: [
    { name: 'Panel Upgrade', basePrice: 2500 },
    { name: 'Outlet Installation', basePrice: 150 },
    { name: 'Ceiling Fan Installation', basePrice: 200 },
    { name: 'Whole House Surge Protector', basePrice: 350 },
    { name: 'EV Charger Installation', basePrice: 1200 },
    { name: 'Recessed Lighting', basePrice: 800 }
  ],
  GENERAL: [
    { name: 'Home Inspection', basePrice: 400 },
    { name: 'Maintenance Agreement', basePrice: 300 },
    { name: 'Emergency Service Call', basePrice: 150 }
  ]
}

const SAMPLE_QUOTE_RESULT: QuoteResult = {
  customerName: 'Robert Thompson',
  jobDescription: 'AC Unit Replacement - 3-ton split system for 2,000 sq ft home',
  options: [
    {
      tier: 'good',
      name: 'Standard Efficiency',
      description: '14 SEER AC unit with basic installation',
      laborCost: 1200,
      partsCost: 2800,
      totalCost: 4000,
      warranty: '5 years parts, 1 year labor',
      estimatedDuration: '4-6 hours',
      features: [
        '14 SEER efficiency rating',
        'Standard thermostat included',
        'Basic installation',
        'System startup and testing'
      ]
    },
    {
      tier: 'better',
      name: 'High Efficiency',
      description: '16 SEER AC unit with enhanced installation',
      laborCost: 1400,
      partsCost: 3600,
      totalCost: 5000,
      warranty: '10 years parts, 2 years labor',
      estimatedDuration: '5-7 hours',
      features: [
        '16 SEER efficiency rating',
        'Programmable thermostat included',
        'UV air purifier add-on available',
        'Ductwork inspection included',
        'Annual maintenance reminder'
      ],
      savings: 'Save up to $200/year on energy bills',
      recommended: true
    },
    {
      tier: 'best',
      name: 'Premium Efficiency',
      description: '20 SEER variable-speed AC with smart features',
      laborCost: 1800,
      partsCost: 5700,
      totalCost: 7500,
      warranty: 'Lifetime compressor, 10 years parts, 5 years labor',
      estimatedDuration: '6-8 hours',
      features: [
        '20 SEER efficiency rating',
        'Variable-speed compressor',
        'Smart WiFi thermostat included',
        'Whole-home air purification',
        'Humidity control',
        'Quiet operation (50 dB)',
        '2-year maintenance plan included'
      ],
      savings: 'Save up to $500/year on energy bills'
    }
  ],
  validUntil: '30 days from quote date',
  notes: [
    'Prices include removal and disposal of old equipment',
    'Permit fees may apply based on local requirements',
    'Financing options available with approved credit'
  ],
  termsAndConditions: [
    'Quote valid for 30 days',
    '50% deposit required to schedule installation',
    'Final inspection by city inspector may be required'
  ]
}

export default function QuoteGeneratorPage() {
  const router = useRouter()
  const [tradeType, setTradeType] = useState('HVAC')
  const [selectedService, setSelectedService] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [propertySize, setPropertySize] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [sampleMode, setSampleMode] = useState(false)
  const [sampleResult, setSampleResult] = useState<QuoteResult | null>(null)

  const loadSampleData = () => {
    setSampleMode(true)
    setTradeType('HVAC')
    setSelectedService('AC Unit Replacement')
    setCustomerName('Robert Thompson')
    setPropertySize('2000')
    setAdditionalNotes('Customer interested in energy-efficient options. Existing unit is 15 years old, 3-ton Carrier system. Home has good ductwork in attic.')
    setSampleResult(null)
  }

  const quoteMutation = useMutation({
    mutationFn: async () => {
      setSampleResult(null)
      const res = await fetch('/api/ai/quote-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeType,
          service: selectedService,
          customerName,
          propertySize: propertySize ? parseInt(propertySize) : undefined,
          additionalNotes,
          useSampleData: sampleMode
        })
      })
      if (!res.ok) throw new Error('Failed to generate quote')
      return res.json() as Promise<QuoteResult>
    }
  })

  const result = sampleResult || quoteMutation.data

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'good': return 'border-gray-300 bg-gray-50'
      case 'better': return 'border-primary-400 bg-primary-50'
      case 'best': return 'border-yellow-400 bg-yellow-50'
      default: return 'border-gray-300'
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'good': return 'bg-gray-500'
      case 'better': return 'bg-primary-600'
      case 'best': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.push('/dashboard/ai')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to AI Features"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="w-7 h-7 text-primary-600" />
              AI Quote Generator
            </h1>
            <p className="text-gray-500">
              Generate professional Good/Better/Best quotes with AI
            </p>
          </div>
        </div>
        <button
          onClick={loadSampleData}
          className="btn-secondary flex items-center gap-2"
        >
          <BeakerIcon className="w-5 h-5" />
          Load Sample Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          {/* Trade Type */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Type</h2>
            <div className="grid grid-cols-2 gap-2">
              {tradeTypes.map((trade) => (
                <button
                  key={trade}
                  onClick={() => {
                    setTradeType(trade)
                    setSelectedService('')
                  }}
                  className={cn(
                    'px-4 py-3 rounded-lg border-2 font-medium transition-colors',
                    tradeType === trade
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {trade}
                </button>
              ))}
            </div>
          </div>

          {/* Service Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service</h2>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="input w-full"
            >
              <option value="">Select a service...</option>
              {commonServices[tradeType]?.map((service) => (
                <option key={service.name} value={service.name}>
                  {service.name} (Base: ${service.basePrice.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Customer Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Property Size (sq ft)</label>
                <input
                  type="number"
                  value={propertySize}
                  onChange={(e) => setPropertySize(e.target.value)}
                  placeholder="e.g., 2000"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any special requirements, existing equipment details, customer preferences..."
              rows={4}
              className="input"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={() => quoteMutation.mutate()}
            disabled={quoteMutation.isPending || !selectedService || !customerName}
            className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2"
          >
            {quoteMutation.isPending ? (
              <>
                <SparklesIcon className="w-5 h-5 animate-pulse" />
                Generating Quote...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate Quote
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!result && !quoteMutation.isPending && (
            <div className="card text-center py-12">
              <CurrencyDollarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Generate a Quote
              </h3>
              <p className="text-gray-500">
                Select a service and enter customer details to generate a professional quote with Good/Better/Best options
              </p>
            </div>
          )}

          {quoteMutation.isPending && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Generating professional quote...</p>
            </div>
          )}

          {result && (
            <>
              {/* Quote Header */}
              <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Quote for {result.customerName}</h2>
                    <p className="text-primary-100">{result.jobDescription}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-primary-200">Valid Until</p>
                    <p className="font-semibold">{result.validUntil}</p>
                  </div>
                </div>
              </div>

              {/* Quote Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.options.map((option) => (
                  <div
                    key={option.tier}
                    className={cn(
                      'card border-2 relative',
                      getTierColor(option.tier),
                      option.recommended && 'ring-2 ring-primary-500'
                    )}
                  >
                    {option.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <StarIcon className="w-3 h-3" />
                          RECOMMENDED
                        </span>
                      </div>
                    )}

                    <div className={cn(
                      'text-center text-white text-sm font-bold py-1 rounded-t-lg -mx-4 -mt-4 mb-4',
                      getTierBadgeColor(option.tier)
                    )}>
                      {option.tier.toUpperCase()}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-1">{option.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{option.description}</p>

                    <div className="text-center mb-4">
                      <p className="text-3xl font-bold text-gray-900">
                        ${option.totalCost.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Labor: ${option.laborCost.toLocaleString()} | Parts: ${option.partsCost.toLocaleString()}
                      </p>
                    </div>

                    {option.savings && (
                      <div className="bg-green-100 text-green-700 text-sm text-center py-1 px-2 rounded mb-4">
                        {option.savings}
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        {option.estimatedDuration}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <WrenchScrewdriverIcon className="w-4 h-4" />
                        {option.warranty}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">INCLUDES:</p>
                      <ul className="space-y-1">
                        {option.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {result.notes.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-3">Important Notes</h3>
                  <ul className="space-y-2">
                    {result.notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-primary-500">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Terms */}
              {result.termsAndConditions.length > 0 && (
                <div className="card bg-gray-50">
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm">Terms & Conditions</h3>
                  <ul className="space-y-1">
                    {result.termsAndConditions.map((term, i) => (
                      <li key={i} className="text-xs text-gray-500">
                        {i + 1}. {term}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button className="btn-primary flex-1 py-3">
                  Send Quote to Customer
                </button>
                <button className="btn-secondary flex-1 py-3">
                  Download PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
