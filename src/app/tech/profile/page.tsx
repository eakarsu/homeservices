'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { signOut, useSession } from 'next-auth/react'
import {
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  ArrowRightOnRectangleIcon,
  CheckBadgeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface TechnicianProfile {
  id: string
  status: string
  skills: string[]
  certifications: string[]
  user: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  truck: {
    name: string
    vehicleId: string
    make: string
    model: string
    year: number
  } | null
  stats: {
    completedJobs: number
    avgRating: number
    totalReviews: number
  }
}

export default function TechProfilePage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')

  const { data: profile, isLoading } = useQuery<TechnicianProfile>({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await fetch('/api/technicians/me')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setStatus(data.status)
      return data
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch('/api/technicians/me/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    }
  })

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    updateStatusMutation.mutate(newStatus)
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header / Avatar */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-3">
          <UserCircleIcon className="w-12 h-12 text-primary-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          {profile.user.firstName} {profile.user.lastName}
        </h1>
        <p className="text-sm text-gray-500">Field Technician</p>
      </div>

      {/* Status Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Current Status</h3>
        <div className="grid grid-cols-3 gap-2">
          {['AVAILABLE', 'ON_JOB', 'OFF_DUTY'].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={updateStatusMutation.isPending}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                status === s
                  ? s === 'AVAILABLE'
                    ? 'bg-green-600 text-white'
                    : s === 'ON_JOB'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Contact Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
              <PhoneIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{profile.user.phone || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
              <EnvelopeIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{profile.user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Truck */}
      {profile.truck && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Vehicle</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full">
              <TruckIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{profile.truck.name}</p>
              <p className="text-sm text-gray-500">
                {profile.truck.year} {profile.truck.make} {profile.truck.model} ({profile.truck.vehicleId})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Performance</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{profile.stats.completedJobs}</p>
            <p className="text-xs text-gray-500">Jobs Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{profile.stats.avgRating.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Avg Rating</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{profile.stats.totalReviews}</p>
            <p className="text-xs text-gray-500">Reviews</p>
          </div>
        </div>
      </div>

      {/* Skills & Certifications */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Skills & Certifications</h3>

        {profile.skills.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                >
                  <WrenchScrewdriverIcon className="w-3 h-3" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.certifications.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Certifications</p>
            <div className="flex flex-wrap gap-2">
              {profile.certifications.map((cert) => (
                <span
                  key={cert}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"
                >
                  <CheckBadgeIcon className="w-3 h-3" />
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.skills.length === 0 && profile.certifications.length === 0 && (
          <p className="text-sm text-gray-500">No skills or certifications listed</p>
        )}
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  )
}
