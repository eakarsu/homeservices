'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  SparklesIcon,
  MapPinIcon,
  ClockIcon,
  TruckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BeakerIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Technician {
  id: string
  name: string
  status: string
  currentLocation: { lat: number; lng: number } | null
  assignedJobs: number
  skills: string[]
}

interface UnassignedJob {
  id: string
  jobNumber: string
  title: string
  priority: string
  tradeType: string
  estimatedDuration: number
  customerName: string
  address: string
  location: { lat: number; lng: number } | null
}

interface OptimizationResult {
  assignments: {
    jobId: string
    jobNumber: string
    technicianId: string
    technicianName: string
    estimatedTravelTime: number
    estimatedArrival: string
    reason: string
  }[]
  metrics: {
    totalTravelTime: number
    avgTravelTime: number
    jobsAssigned: number
    unassignedJobs: number
  }
  warnings: string[]
}

// Sample data for demonstration
const SAMPLE_TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'Mike Johnson',
    status: 'AVAILABLE',
    currentLocation: { lat: 33.4484, lng: -112.0740 },
    assignedJobs: 2,
    skills: ['HVAC', 'Refrigeration']
  },
  {
    id: 'tech-2',
    name: 'Sarah Williams',
    status: 'AVAILABLE',
    currentLocation: { lat: 33.4942, lng: -112.0261 },
    assignedJobs: 1,
    skills: ['HVAC', 'Electrical']
  },
  {
    id: 'tech-3',
    name: 'David Chen',
    status: 'AVAILABLE',
    currentLocation: { lat: 33.4152, lng: -111.8315 },
    assignedJobs: 3,
    skills: ['Plumbing', 'HVAC']
  }
]

const SAMPLE_JOBS: UnassignedJob[] = [
  {
    id: 'job-1',
    jobNumber: 'J-2024-001',
    title: 'AC Not Cooling',
    priority: 'EMERGENCY',
    tradeType: 'HVAC',
    estimatedDuration: 90,
    customerName: 'Johnson Residence',
    address: '1234 Palm Dr, Phoenix, AZ',
    location: { lat: 33.4516, lng: -112.0740 }
  },
  {
    id: 'job-2',
    jobNumber: 'J-2024-002',
    title: 'Thermostat Replacement',
    priority: 'HIGH',
    tradeType: 'HVAC',
    estimatedDuration: 60,
    customerName: 'Smith Office',
    address: '5678 Central Ave, Phoenix, AZ',
    location: { lat: 33.4484, lng: -112.0773 }
  },
  {
    id: 'job-3',
    jobNumber: 'J-2024-003',
    title: 'Annual Maintenance',
    priority: 'NORMAL',
    tradeType: 'HVAC',
    estimatedDuration: 45,
    customerName: 'Williams Home',
    address: '9012 Camelback Rd, Phoenix, AZ',
    location: { lat: 33.5094, lng: -112.0353 }
  },
  {
    id: 'job-4',
    jobNumber: 'J-2024-004',
    title: 'Ductwork Inspection',
    priority: 'NORMAL',
    tradeType: 'HVAC',
    estimatedDuration: 60,
    customerName: 'Brown Residence',
    address: '3456 Indian School Rd, Phoenix, AZ',
    location: { lat: 33.4942, lng: -112.0740 }
  }
]

const SAMPLE_OPTIMIZATION: OptimizationResult = {
  assignments: [
    {
      jobId: 'job-1',
      jobNumber: 'J-2024-001',
      technicianId: 'tech-1',
      technicianName: 'Mike Johnson',
      estimatedTravelTime: 8,
      estimatedArrival: '9:30 AM',
      reason: 'Closest technician with HVAC skills, handles emergency priority'
    },
    {
      jobId: 'job-2',
      jobNumber: 'J-2024-002',
      technicianId: 'tech-1',
      technicianName: 'Mike Johnson',
      estimatedTravelTime: 12,
      estimatedArrival: '11:45 AM',
      reason: 'Sequential routing from previous job, same area'
    },
    {
      jobId: 'job-3',
      jobNumber: 'J-2024-003',
      technicianId: 'tech-2',
      technicianName: 'Sarah Williams',
      estimatedTravelTime: 10,
      estimatedArrival: '10:00 AM',
      reason: 'Near current location, light workload'
    },
    {
      jobId: 'job-4',
      jobNumber: 'J-2024-004',
      technicianId: 'tech-2',
      technicianName: 'Sarah Williams',
      estimatedTravelTime: 15,
      estimatedArrival: '12:30 PM',
      reason: 'Efficient routing after maintenance job'
    }
  ],
  metrics: {
    totalTravelTime: 45,
    avgTravelTime: 11,
    jobsAssigned: 4,
    unassignedJobs: 0
  },
  warnings: ['Tech-3 (David Chen) has 3 jobs already assigned today']
}

export default function DispatchOptimizerPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null)
  const [sampleMode, setSampleMode] = useState(false)

  const loadSampleData = () => {
    setSampleMode(true)
    setOptimizationResult(null) // Don't show results - user must click button to call OpenRouter
  }

  const { data: technicians = [], isLoading: loadingTechs } = useQuery<Technician[]>({
    queryKey: ['dispatch-technicians'],
    queryFn: async () => {
      const res = await fetch('/api/dispatch/technicians')
      if (!res.ok) throw new Error('Failed to fetch technicians')
      return res.json()
    },
    enabled: !sampleMode
  })

  const { data: unassignedJobs = [], isLoading: loadingJobs } = useQuery<UnassignedJob[]>({
    queryKey: ['unassigned-jobs', selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/dispatch/unassigned?date=${selectedDate}`)
      if (!res.ok) throw new Error('Failed to fetch unassigned jobs')
      return res.json()
    },
    enabled: !sampleMode
  })

  // Use sample data when in sample mode
  const displayTechnicians = sampleMode ? SAMPLE_TECHNICIANS : technicians
  const displayJobs = sampleMode ? SAMPLE_JOBS : unassignedJobs

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      // If in sample mode, send sample data to OpenRouter for real AI analysis
      if (sampleMode) {
        const res = await fetch('/api/ai/optimize-dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            useSampleData: true,
            date: selectedDate,
            techniciansData: displayTechnicians,
            jobsData: displayJobs,
            optimizeFor: 'balanced'
          })
        })
        if (!res.ok) throw new Error('Failed to optimize dispatch')
        return res.json()
      }

      // Normal mode
      const res = await fetch('/api/ai/optimize-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          technicianIds: displayTechnicians.filter(t => t.status === 'AVAILABLE').map(t => t.id),
          jobIds: displayJobs.map(j => j.id),
          optimizeFor: 'balanced'
        })
      })
      if (!res.ok) throw new Error('Failed to optimize dispatch')
      return res.json()
    },
    onSuccess: (data) => {
      setOptimizationResult(data)
    }
  })

  const applyMutation = useMutation({
    mutationFn: async (assignments: { jobId: string; technicianId: string }[]) => {
      const results = await Promise.all(
        assignments.map(a =>
          fetch('/api/dispatch/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(a)
          })
        )
      )
      return results
    },
    onSuccess: () => {
      setOptimizationResult(null)
    }
  })

  const availableTechs = displayTechnicians.filter(t => t.status === 'AVAILABLE')
  const isLoading = !sampleMode && (loadingTechs || loadingJobs)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              AI Dispatch Optimizer
            </h1>
            <p className="text-gray-500">
              Automatically optimize job assignments based on location, skills, and availability
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSampleData}
            className="btn-secondary flex items-center gap-2"
          >
            <BeakerIcon className="w-5 h-5" />
            Load Sample Data
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TruckIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{availableTechs.length}</p>
              <p className="text-sm text-gray-500">Available Techs</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{displayJobs.length}</p>
              <p className="text-sm text-gray-500">Unassigned Jobs</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {displayJobs.filter(j => j.priority === 'EMERGENCY').length}
              </p>
              <p className="text-sm text-gray-500">Emergency Jobs</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {optimizationResult ? `${optimizationResult.metrics.avgTravelTime}m` : '--'}
              </p>
              <p className="text-sm text-gray-500">Avg Travel Time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned Jobs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Unassigned Jobs</h2>
            <span className="text-sm text-gray-500">{displayJobs.length} jobs</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : displayJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>All jobs are assigned!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayJobs.map((job) => (
                <div
                  key={job.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    job.priority === 'EMERGENCY' ? 'border-red-300 bg-red-50' :
                    job.priority === 'HIGH' ? 'border-orange-300 bg-orange-50' :
                    'border-gray-200 bg-gray-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.customerName}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <MapPinIcon className="w-3 h-3" />
                        <span className="truncate max-w-48">{job.address}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        job.priority === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                        job.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {job.priority}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{job.estimatedDuration} min</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Technicians */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Available Technicians</h2>
            <span className="text-sm text-gray-500">{availableTechs.length} available</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : availableTechs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TruckIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No technicians available</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableTechs.map((tech) => (
                <div key={tech.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{tech.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(tech.skills || []).slice(0, 3).map((skill) => (
                          <span key={skill} className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Available
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{tech.assignedJobs} jobs today</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Optimization Result */}
      {optimizationResult && (
        <div className="card border-2 border-primary-200 bg-primary-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-primary-600" />
              Optimization Results
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOptimizationResult(null)}
                className="btn-secondary text-sm"
              >
                Dismiss
              </button>
              <button
                onClick={() => applyMutation.mutate(
                  optimizationResult.assignments.map(a => ({
                    jobId: a.jobId,
                    technicianId: a.technicianId
                  }))
                )}
                disabled={applyMutation.isPending}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {applyMutation.isPending ? 'Applying...' : 'Apply All'}
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-green-600">{optimizationResult.metrics.jobsAssigned}</p>
              <p className="text-xs text-gray-500">Jobs Assigned</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{optimizationResult.metrics.avgTravelTime}m</p>
              <p className="text-xs text-gray-500">Avg Travel</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{optimizationResult.metrics.totalTravelTime}m</p>
              <p className="text-xs text-gray-500">Total Travel</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{optimizationResult.metrics.unassignedJobs}</p>
              <p className="text-xs text-gray-500">Unassigned</p>
            </div>
          </div>

          {/* Warnings */}
          {optimizationResult.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-100 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-1">Warnings:</p>
              <ul className="text-sm text-yellow-700 list-disc list-inside">
                {optimizationResult.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Assignments */}
          <div className="space-y-2">
            {optimizationResult.assignments.map((assignment) => (
              <div key={assignment.jobId} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Job #{assignment.jobNumber}</p>
                  <p className="text-sm text-gray-500">{assignment.reason}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary-600">{assignment.technicianName}</p>
                  <p className="text-xs text-gray-500">
                    ~{assignment.estimatedTravelTime}m travel • ETA {assignment.estimatedArrival}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimize Button */}
      <div className="flex justify-center">
        <button
          onClick={() => optimizeMutation.mutate()}
          disabled={optimizeMutation.isPending || displayJobs.length === 0 || availableTechs.length === 0}
          className="btn-primary px-8 py-3 text-lg flex items-center gap-2"
        >
          {optimizeMutation.isPending ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              Optimize Dispatch
            </>
          )}
        </button>
      </div>
    </div>
  )
}
