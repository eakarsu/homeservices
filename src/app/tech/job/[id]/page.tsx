'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  ArrowLeftIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  PauseIcon,
  CameraIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  PhotoIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { formatDateTime, getStatusColor, getPriorityColor } from '@/lib/utils'
import { isNative, takePhoto, pickPhoto, getCurrentLocation, type PhotoResult, type LocationResult } from '@/lib/capacitor'

interface Job {
  id: string
  jobNumber: string
  title: string
  description?: string
  status: string
  priority: string
  tradeType: string
  scheduledStart?: string
  timeWindowStart?: string
  timeWindowEnd?: string
  estimatedDuration?: number
  customer: {
    id: string
    firstName?: string
    lastName?: string
    phone?: string
  }
  property?: {
    address: string
    city: string
    state: string
    zip: string
  }
  serviceType?: {
    name: string
  }
  notes: Array<{
    id: string
    content: string
    noteType: string
    createdAt: string
  }>
  lineItems: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
    itemType: string
  }>
}

export default function TechnicianJobPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const jobId = params.id as string
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'notes' | 'parts' | 'ai'>('details')
  const [newNote, setNewNote] = useState('')
  const [photos, setPhotos] = useState<PhotoResult[]>([])
  const [currentLocation, setCurrentLocation] = useState<LocationResult | null>(null)
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false)
  const [diagnosticSymptoms, setDiagnosticSymptoms] = useState('')
  const [diagnosticResult, setDiagnosticResult] = useState<{
    possibleCauses: string[]
    diagnosticSteps: string[]
    recommendedParts: string[]
    safetyWarnings: string[]
  } | null>(null)

  const { data: job, isLoading } = useQuery<Job>({
    queryKey: ['tech-job', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch job')
      return res.json()
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-job', jobId] })
      queryClient.invalidateQueries({ queryKey: ['tech-jobs-today'] })
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, noteType: 'TECHNICIAN' }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      setNewNote('')
      queryClient.invalidateQueries({ queryKey: ['tech-job', jobId] })
    },
  })

  const diagnosticMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentType: job?.tradeType || 'HVAC',
          symptoms: diagnosticSymptoms,
        }),
      })
      if (!res.ok) throw new Error('Failed to get diagnostics')
      return res.json()
    },
    onSuccess: (data) => {
      setDiagnosticResult(data)
    },
  })

  // Fetch location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getCurrentLocation()
        if (location) setCurrentLocation(location)
      } catch (error) {
        console.log('Location not available')
      }
    }
    fetchLocation()
  }, [])

  // Camera handlers
  const handleTakePhoto = async () => {
    setIsCapturingPhoto(true)
    try {
      const photo = await takePhoto()
      if (photo) {
        setPhotos(prev => [...prev, photo])
      }
    } catch (error) {
      console.error('Failed to take photo:', error)
    }
    setIsCapturingPhoto(false)
  }

  const handlePickPhoto = async () => {
    setIsCapturingPhoto(true)
    try {
      const photo = await pickPhoto()
      if (photo) {
        setPhotos(prev => [...prev, photo])
      }
    } catch (error) {
      console.error('Failed to pick photo:', error)
    }
    setIsCapturingPhoto(false)
  }

  const handleDeletePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const getCustomerName = () => {
    return `${job?.customer?.firstName || ''} ${job?.customer?.lastName || ''}`.trim() || 'Unknown'
  }

  const getFullAddress = () => {
    if (job?.property) {
      return `${job.property.address}, ${job.property.city}, ${job.property.state} ${job.property.zip}`
    }
    return 'No address'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Job not found</p>
        <Link href="/tech" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to jobs
        </Link>
      </div>
    )
  }

  const canStart = ['SCHEDULED', 'DISPATCHED'].includes(job.status)
  const canPause = job.status === 'IN_PROGRESS'
  const canComplete = job.status === 'IN_PROGRESS'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/tech" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">{job.jobNumber}</h1>
            <span className={`badge text-xs ${getStatusColor(job.status)}`}>
              {job.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-600">{job.title}</p>
        </div>
        <span className={`badge ${getPriorityColor(job.priority)}`}>
          {job.priority}
        </span>
      </div>

      {/* Customer & Location */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium">{getCustomerName()}</p>
          {job.customer?.phone && (
            <a
              href={`tel:${job.customer.phone}`}
              className="p-2 bg-green-50 text-green-600 rounded-full"
            >
              <PhoneIcon className="w-5 h-5" />
            </a>
          )}
        </div>
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(getFullAddress())}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 text-gray-600 hover:text-primary-600"
        >
          <MapPinIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{getFullAddress()}</span>
        </a>
        {job.timeWindowStart && job.timeWindowEnd && (
          <p className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <ClockIcon className="w-4 h-4" />
            {job.timeWindowStart} - {job.timeWindowEnd}
            {job.estimatedDuration && ` (${job.estimatedDuration} min)`}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {canStart && (
          <button
            onClick={() => updateStatusMutation.mutate('IN_PROGRESS')}
            disabled={updateStatusMutation.isPending}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
          >
            <PlayIcon className="w-5 h-5" />
            Start Job
          </button>
        )}
        {canPause && (
          <button
            onClick={() => updateStatusMutation.mutate('ON_HOLD')}
            disabled={updateStatusMutation.isPending}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3"
          >
            <PauseIcon className="w-5 h-5" />
            Pause
          </button>
        )}
        {canComplete && (
          <button
            onClick={() => updateStatusMutation.mutate('COMPLETED')}
            disabled={updateStatusMutation.isPending}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 py-3"
          >
            <CheckCircleIcon className="w-5 h-5" />
            Complete
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'details'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'photos'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          <CameraIcon className="w-4 h-4" />
          Photos {photos.length > 0 && `(${photos.length})`}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'notes'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          Notes
        </button>
        <button
          onClick={() => setActiveTab('parts')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
            activeTab === 'parts'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          Parts
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 flex items-center justify-center gap-1 whitespace-nowrap ${
            activeTab === 'ai'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          <SparklesIcon className="w-4 h-4" />
          AI
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'details' && (
          <div className="space-y-4">
            {job.description && (
              <div className="card">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Description
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            )}
            <div className="card">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <WrenchScrewdriverIcon className="w-5 h-5" />
                Service Info
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-500">Type:</p>
                <p>{job.serviceType?.name || 'Not specified'}</p>
                <p className="text-gray-500">Trade:</p>
                <p>{job.tradeType}</p>
                {job.scheduledStart && (
                  <>
                    <p className="text-gray-500">Scheduled:</p>
                    <p>{formatDateTime(job.scheduledStart)}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-4">
            {/* Camera buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleTakePhoto}
                disabled={isCapturingPhoto}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
              >
                <CameraIcon className="w-5 h-5" />
                {isCapturingPhoto ? 'Capturing...' : 'Take Photo'}
              </button>
              <button
                onClick={handlePickPhoto}
                disabled={isCapturingPhoto}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 py-3"
              >
                <PhotoIcon className="w-5 h-5" />
                Choose Photo
              </button>
            </div>

            {/* Location info */}
            {currentLocation && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <MapPinIcon className="w-3 h-3" />
                GPS: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </div>
            )}

            {/* Photo grid */}
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={photo.dataUrl}
                      alt={`Job photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDeletePhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                      <span className="text-white text-xs">Photo {index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No photos yet</p>
                <p className="text-sm text-gray-400">Take or choose photos of the job site</p>
              </div>
            )}

            {/* Photo tips */}
            <div className="card bg-blue-50 border-blue-200">
              <h4 className="font-medium text-sm text-blue-800 mb-2">Photo Tips</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Take before & after photos of work</li>
                <li>• Capture equipment model/serial numbers</li>
                <li>• Document any existing damage</li>
                <li>• Photos are tagged with GPS location</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="input flex-1"
              />
              <button
                onClick={() => addNoteMutation.mutate()}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                className="btn-primary px-4"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {job.notes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{note.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{note.noteType}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              {job.notes.length === 0 && (
                <p className="text-center text-gray-500 py-4">No notes yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'parts' && (
          <div className="space-y-3">
            <button className="w-full btn-secondary flex items-center justify-center gap-2">
              <WrenchScrewdriverIcon className="w-4 h-4" />
              Add Parts Used
            </button>
            <div className="space-y-2">
              {job.lineItems.filter(item => item.itemType === 'PART').map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.description}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                </div>
              ))}
              {job.lineItems.filter(item => item.itemType === 'PART').length === 0 && (
                <p className="text-center text-gray-500 py-4">No parts added yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="card bg-gradient-to-br from-primary-50 to-blue-50">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-primary-600" />
                AI Diagnostic Assistant
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Describe the symptoms and get AI-powered diagnostic suggestions.
              </p>
              <textarea
                value={diagnosticSymptoms}
                onChange={(e) => setDiagnosticSymptoms(e.target.value)}
                placeholder="e.g., AC unit not cooling, making clicking noise, ice buildup on coils..."
                rows={3}
                className="input mb-2"
              />
              <button
                onClick={() => diagnosticMutation.mutate()}
                disabled={!diagnosticSymptoms.trim() || diagnosticMutation.isPending}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {diagnosticMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Get Diagnostic Help
                  </>
                )}
              </button>
            </div>

            {diagnosticResult && (
              <div className="space-y-3">
                <div className="card">
                  <h4 className="font-medium text-sm mb-2 text-red-700">Possible Causes</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {diagnosticResult.possibleCauses.map((cause, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h4 className="font-medium text-sm mb-2 text-blue-700">Diagnostic Steps</h4>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    {diagnosticResult.diagnosticSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div className="card">
                  <h4 className="font-medium text-sm mb-2 text-green-700">Recommended Parts</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {diagnosticResult.recommendedParts.map((part, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        {part}
                      </li>
                    ))}
                  </ul>
                </div>
                {diagnosticResult.safetyWarnings.length > 0 && (
                  <div className="card bg-yellow-50 border-yellow-200">
                    <h4 className="font-medium text-sm mb-2 text-yellow-800">Safety Warnings</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {diagnosticResult.safetyWarnings.map((warning, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span>⚠️</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
