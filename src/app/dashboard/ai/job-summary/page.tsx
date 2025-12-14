'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import {
  SparklesIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CameraIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BeakerIcon,
  UserIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface JobSummaryResult {
  summary: string
  workPerformed: string[]
  partsUsed: {
    part: string
    quantity: number
    cost: number
  }[]
  findings: {
    finding: string
    severity: 'info' | 'warning' | 'critical'
    recommendation: string
  }[]
  recommendations: string[]
  followUpNeeded: boolean
  followUpReason?: string
  customerCommunication: {
    summary: string
    technicalDetails: string
    plainEnglish: string
  }
  qualityScore: number
  estimatedNextService: string
}

const tradeTypes = ['HVAC', 'PLUMBING', 'ELECTRICAL', 'GENERAL']

interface SampleJob {
  id: string
  jobNumber: string
  title: string
  customerName: string
  address: string
  tradeType: string
}

const SAMPLE_JOBS: SampleJob[] = [
  {
    id: 'job-1',
    jobNumber: 'JOB-2024-1234',
    title: 'AC Not Cooling - Emergency',
    customerName: 'Johnson Residence',
    address: '1234 Palm Dr, Phoenix, AZ 85001',
    tradeType: 'HVAC'
  },
  {
    id: 'job-2',
    jobNumber: 'JOB-2024-1235',
    title: 'Water Heater Replacement',
    customerName: 'Smith Commercial',
    address: '5678 Central Ave, Phoenix, AZ 85004',
    tradeType: 'PLUMBING'
  },
  {
    id: 'job-3',
    jobNumber: 'JOB-2024-1236',
    title: 'Panel Upgrade 100A to 200A',
    customerName: 'Williams Home',
    address: '9012 Camelback Rd, Phoenix, AZ 85016',
    tradeType: 'ELECTRICAL'
  }
]

export default function JobSummaryPage() {
  const router = useRouter()
  const [selectedJob, setSelectedJob] = useState<SampleJob | null>(null)
  const [technicianNotes, setTechnicianNotes] = useState('')
  const [workDescription, setWorkDescription] = useState('')
  const [timeSpent, setTimeSpent] = useState('')
  const [partsUsedText, setPartsUsedText] = useState('')
  const [sampleMode, setSampleMode] = useState(false)

  const loadSampleData = () => {
    setSampleMode(true)
    setSelectedJob(SAMPLE_JOBS[0])
    setTechnicianNotes(`Found capacitor completely failed. Unit was not starting at all.
Checked refrigerant levels - low by 2 lbs, likely slow leak at service valve.
Cleaned condenser coil - heavily soiled with debris.
Noticed some corrosion on copper lines near outdoor unit.
Customer mentioned unit has been struggling for past 2 weeks.
Compressor amperage running high but within spec after repairs.`)
    setWorkDescription(`Replaced dual run capacitor (45/5 MFD).
Added 2 lbs R-410A refrigerant.
Cleaned condenser and evaporator coils.
Tightened service valve and applied leak stop.
Replaced air filter (customer provided).
Tested system - cooling properly, 18 degree split.`)
    setTimeSpent('2.5')
    setPartsUsedText(`Dual Run Capacitor 45/5 MFD - $45
R-410A Refrigerant 2 lbs - $80
Coil Cleaner - $15
Leak Stop Sealant - $25`)
  }

  const summaryMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/job-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: selectedJob,
          technicianNotes,
          workDescription,
          timeSpent: parseFloat(timeSpent) || 0,
          partsUsedText,
          useSampleData: sampleMode
        })
      })
      if (!res.ok) throw new Error('Failed to generate summary')
      return res.json() as Promise<JobSummaryResult>
    }
  })

  const result = summaryMutation.data

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-blue-100 text-blue-800 border-blue-300'
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
              <ClipboardDocumentCheckIcon className="w-7 h-7 text-primary-600" />
              AI Job Summary Generator
            </h1>
            <p className="text-gray-500">
              Generate professional job reports from technician notes
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
          {/* Job Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Job</h2>
            {sampleMode ? (
              <div className="space-y-2">
                {SAMPLE_JOBS.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={cn(
                      'w-full p-3 rounded-lg border-2 text-left transition-colors',
                      selectedJob?.id === job.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{job.jobNumber}</span>
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100">{job.tradeType}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{job.title}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <UserIcon className="w-3 h-3" />
                      {job.customerName}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Load sample data to select a job</p>
            )}
          </div>

          {/* Selected Job Details */}
          {selectedJob && (
            <div className="card bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <HomeIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedJob.title}</h3>
                  <p className="text-sm text-gray-600">{selectedJob.customerName}</p>
                  <p className="text-xs text-gray-500">{selectedJob.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Technician Notes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Technician Notes</h2>
            <textarea
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="Enter raw technician notes, observations, findings..."
              rows={6}
              className="input"
            />
          </div>

          {/* Work Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Performed</h2>
            <textarea
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="Describe work completed..."
              rows={4}
              className="input"
            />
          </div>

          {/* Time & Parts */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Time & Materials</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Time Spent (hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  placeholder="e.g., 2.5"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Parts Used</label>
                <textarea
                  value={partsUsedText}
                  onChange={(e) => setPartsUsedText(e.target.value)}
                  placeholder="List parts used with quantities and costs..."
                  rows={3}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={() => summaryMutation.mutate()}
            disabled={summaryMutation.isPending || !selectedJob || !technicianNotes}
            className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2"
          >
            {summaryMutation.isPending ? (
              <>
                <SparklesIcon className="w-5 h-5 animate-pulse" />
                Generating Summary...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate Job Summary
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {!result && !summaryMutation.isPending && (
            <div className="card text-center py-12">
              <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Generate Summary
              </h3>
              <p className="text-gray-500">
                Enter technician notes and work details to generate a professional job report
              </p>
            </div>
          )}

          {summaryMutation.isPending && (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Generating professional job summary...</p>
            </div>
          )}

          {result && (
            <>
              {/* Quality Score */}
              <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Job Quality Score</h2>
                    <p className="text-primary-100 text-sm">Based on documentation and work performed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">{result.qualityScore}%</p>
                    <p className="text-sm text-primary-200">
                      Next Service: {result.estimatedNextService}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                  Executive Summary
                </h3>
                <p className="text-gray-700">{result.summary}</p>
              </div>

              {/* Work Performed */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
                  Work Performed
                </h3>
                <ul className="space-y-2">
                  {result.workPerformed.map((work, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      {work}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Parts Used */}
              {result.partsUsed.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-3">Parts & Materials</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-gray-500">Part</th>
                          <th className="text-center py-2 text-gray-500">Qty</th>
                          <th className="text-right py-2 text-gray-500">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.partsUsed.map((part, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-2 text-gray-700">{part.part}</td>
                            <td className="py-2 text-center text-gray-700">{part.quantity}</td>
                            <td className="py-2 text-right text-gray-700">${part.cost}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="py-2" colSpan={2}>Total Parts</td>
                          <td className="py-2 text-right">
                            ${result.partsUsed.reduce((sum, p) => sum + p.cost, 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Findings */}
              {result.findings.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                    Findings & Observations
                  </h3>
                  <div className="space-y-3">
                    {result.findings.map((finding, i) => (
                      <div
                        key={i}
                        className={cn(
                          'p-3 rounded-lg border',
                          getSeverityColor(finding.severity)
                        )}
                      >
                        <p className="font-medium">{finding.finding}</p>
                        <p className="text-sm mt-1 opacity-80">
                          Recommendation: {finding.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up */}
              {result.followUpNeeded && (
                <div className="card border-2 border-orange-300 bg-orange-50">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    Follow-up Required
                  </h3>
                  <p className="text-orange-800">{result.followUpReason}</p>
                </div>
              )}

              {/* Customer Communication */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Customer Communication</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">SUMMARY FOR CUSTOMER</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{result.customerCommunication.summary}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">PLAIN ENGLISH EXPLANATION</p>
                    <p className="text-gray-700 bg-blue-50 p-3 rounded">{result.customerCommunication.plainEnglish}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">TECHNICAL DETAILS (IF REQUESTED)</p>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded text-sm">{result.customerCommunication.technicalDetails}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button className="btn-primary flex-1 py-3">
                  Save to Job Record
                </button>
                <button className="btn-secondary flex-1 py-3">
                  Email to Customer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
