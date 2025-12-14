'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface DiagnosticResult {
  possibleCauses: {
    cause: string
    probability: number
    explanation: string
  }[]
  recommendedActions: {
    action: string
    priority: 'high' | 'medium' | 'low'
    estimatedTime: number
    partsNeeded: string[]
  }[]
  additionalQuestions: string[]
  safetyWarnings: string[]
  estimatedRepairCost: {
    low: number
    high: number
  }
}

const tradeTypes = ['HVAC', 'PLUMBING', 'ELECTRICAL', 'GENERAL']

const commonSymptoms: Record<string, string[]> = {
  HVAC: [
    'No cooling',
    'No heating',
    'Weak airflow',
    'Strange noises',
    'Bad smell',
    'Water leak',
    'Ice on coils',
    'Thermostat not working',
    'High energy bills',
    'Uneven temperatures'
  ],
  PLUMBING: [
    'No hot water',
    'Low water pressure',
    'Clogged drain',
    'Leaking pipe',
    'Running toilet',
    'Dripping faucet',
    'Sewage smell',
    'Water heater noise',
    'Frozen pipes',
    'Garbage disposal not working'
  ],
  ELECTRICAL: [
    'Outlet not working',
    'Breaker keeps tripping',
    'Flickering lights',
    'Buzzing sounds',
    'Burning smell',
    'Warm outlets',
    'Sparking outlet',
    'No power',
    'GFCI won\'t reset',
    'Dimming lights'
  ],
  GENERAL: [
    'General maintenance',
    'Inspection needed',
    'Unknown issue',
    'Multiple problems'
  ]
}

// Sample data for demonstration
const SAMPLE_RESULT: DiagnosticResult = {
  possibleCauses: [
    {
      cause: 'Refrigerant Leak',
      probability: 75,
      explanation: 'The combination of weak airflow, ice on coils, and the unit running constantly strongly suggests a refrigerant leak. Low refrigerant causes the evaporator coil to freeze and reduces cooling capacity.'
    },
    {
      cause: 'Dirty Evaporator Coil',
      probability: 45,
      explanation: 'A dirty evaporator coil can restrict airflow and cause ice formation. This is more likely in a 12-year-old unit that may not have been cleaned regularly.'
    },
    {
      cause: 'Faulty Blower Motor',
      probability: 30,
      explanation: 'A failing blower motor could explain the weak airflow. At 12 years old, the motor bearings may be worn.'
    }
  ],
  recommendedActions: [
    {
      action: 'Check refrigerant levels and inspect for leaks',
      priority: 'high',
      estimatedTime: 45,
      partsNeeded: ['Refrigerant (R-410A)', 'Leak sealant', 'UV dye kit']
    },
    {
      action: 'Clean evaporator and condenser coils',
      priority: 'high',
      estimatedTime: 60,
      partsNeeded: ['Coil cleaner', 'Fin comb']
    },
    {
      action: 'Inspect and test blower motor',
      priority: 'medium',
      estimatedTime: 30,
      partsNeeded: []
    },
    {
      action: 'Replace air filter and check ductwork',
      priority: 'low',
      estimatedTime: 15,
      partsNeeded: ['Air filter (16x25x1)']
    }
  ],
  additionalQuestions: [
    'When did you first notice the ice forming on the unit?',
    'Has the system been serviced in the last 12 months?',
    'Are all vents in the house open and unobstructed?',
    'Have you noticed any hissing or bubbling sounds near the outdoor unit?'
  ],
  safetyWarnings: [
    'Do not attempt to chip ice off the coils - this can damage the fins',
    'Turn off the system to allow ice to melt naturally before service',
    'Refrigerant handling requires EPA certification'
  ],
  estimatedRepairCost: {
    low: 350,
    high: 1200
  }
}

export default function DiagnosticsPage() {
  const router = useRouter()
  const [tradeType, setTradeType] = useState('HVAC')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [equipmentType, setEquipmentType] = useState('')
  const [equipmentAge, setEquipmentAge] = useState('')
  const [sampleResult, setSampleResult] = useState<DiagnosticResult | null>(null)

  const [sampleMode, setSampleMode] = useState(false)

  const loadSampleData = () => {
    setSampleMode(true)
    setTradeType('HVAC')
    setSymptoms(['No cooling', 'Weak airflow', 'Ice on coils'])
    setEquipmentType('Central AC - Carrier')
    setEquipmentAge('12')
    setAdditionalInfo('Unit runs constantly but house stays warm. Customer noticed ice buildup on the indoor unit.')
    setSampleResult(null) // Don't show results - user must click button to call OpenRouter
  }

  const diagnosticMutation = useMutation({
    mutationFn: async () => {
      setSampleResult(null)
      const res = await fetch('/api/ai/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeType,
          symptoms,
          additionalInfo,
          equipmentType,
          equipmentAge: equipmentAge ? parseInt(equipmentAge) : undefined
        })
      })
      if (!res.ok) throw new Error('Failed to get diagnostics')
      return res.json() as Promise<DiagnosticResult>
    }
  })

  const toggleSymptom = (symptom: string) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  const result = sampleResult || diagnosticMutation.data

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
              <SparklesIcon className="w-7 h-7 text-primary-600" />
              AI Diagnostics Assistant
            </h1>
            <p className="text-gray-500">
              Describe the problem and get AI-powered diagnostic suggestions
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          {/* Trade Type Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {tradeTypes.map((trade) => (
                <button
                  key={trade}
                  onClick={() => {
                    setTradeType(trade)
                    setSymptoms([])
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

          {/* Symptoms Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Symptoms</h2>
            <p className="text-sm text-gray-500 mb-3">Select all that apply:</p>
            <div className="flex flex-wrap gap-2">
              {commonSymptoms[tradeType]?.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                    symptoms.includes(symptom)
                      ? 'border-primary-600 bg-primary-100 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Equipment Type</label>
                <input
                  type="text"
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value)}
                  placeholder="e.g., Central AC, Furnace"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Equipment Age (years)</label>
                <input
                  type="number"
                  value={equipmentAge}
                  onChange={(e) => setEquipmentAge(e.target.value)}
                  placeholder="e.g., 10"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Describe any other relevant details about the problem..."
              rows={4}
              className="input"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={() => diagnosticMutation.mutate()}
            disabled={diagnosticMutation.isPending || symptoms.length === 0}
            className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2"
          >
            {diagnosticMutation.isPending ? (
              <>
                <MagnifyingGlassIcon className="w-5 h-5 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Get Diagnosis
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {!result && !diagnosticMutation.isPending && (
            <div className="card text-center py-12">
              <LightBulbIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select symptoms to get started
              </h3>
              <p className="text-gray-500">
                Our AI will analyze the symptoms and provide diagnostic suggestions
              </p>
            </div>
          )}

          {diagnosticMutation.isPending && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Analyzing symptoms...</p>
            </div>
          )}

          {result && (
            <>
              {/* Safety Warnings */}
              {result.safetyWarnings.length > 0 && (
                <div className="card border-2 border-red-200 bg-red-50">
                  <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    Safety Warnings
                  </h3>
                  <ul className="space-y-2">
                    {result.safetyWarnings.map((warning, i) => (
                      <li key={i} className="text-red-700 text-sm flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Possible Causes */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  Possible Causes
                </h3>
                <div className="space-y-3">
                  {result.possibleCauses.map((cause, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{cause.cause}</span>
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-medium rounded-full',
                          cause.probability >= 70 ? 'bg-red-100 text-red-800' :
                          cause.probability >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {cause.probability}% likely
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{cause.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
                  Recommended Actions
                </h3>
                <div className="space-y-3">
                  {result.recommendedActions.map((action, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <span className={cn(
                            'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white',
                            action.priority === 'high' ? 'bg-red-500' :
                            action.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          )}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{action.action}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Est. time: {action.estimatedTime} min
                            </p>
                            {action.partsNeeded.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {action.partsNeeded.map((part, j) => (
                                  <span key={j} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                                    {part}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Estimate */}
              <div className="card bg-green-50 border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Estimated Repair Cost</h3>
                <p className="text-2xl font-bold text-green-700">
                  ${result.estimatedRepairCost.low} - ${result.estimatedRepairCost.high}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Includes parts and labor (estimate only)
                </p>
              </div>

              {/* Additional Questions */}
              {result.additionalQuestions.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-gray-400" />
                    Questions to Ask Customer
                  </h3>
                  <ul className="space-y-2">
                    {result.additionalQuestions.map((question, i) => (
                      <li key={i} className="text-gray-700 text-sm flex items-start gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
