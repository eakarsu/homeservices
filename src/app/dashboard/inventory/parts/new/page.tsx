'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NewPartPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    partNumber: '',
    description: '',
    category: '',
    cost: '',
    price: '',
    quantity: '',
    minQuantity: '',
    location: '',
    vendor: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cost: parseFloat(formData.cost) || 0,
          price: parseFloat(formData.price) || 0,
          quantity: parseInt(formData.quantity) || 0,
          minQuantity: parseInt(formData.minQuantity) || 0
        })
      })

      if (res.ok) {
        router.push('/dashboard/inventory/parts')
      }
    } catch (error) {
      console.error('Error creating part:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory/parts" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Part</h1>
          <p className="text-sm text-gray-500">Add a new part to inventory</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Part Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="label">Part Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="input"
                  placeholder="Enter part name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="partNumber" className="label">Part Number</label>
                <input
                  type="text"
                  id="partNumber"
                  name="partNumber"
                  className="input"
                  placeholder="SKU or part number"
                  value={formData.partNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="description" className="label">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="input"
                placeholder="Part description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="mt-4">
              <label htmlFor="category" className="label">Category</label>
              <select
                id="category"
                name="category"
                className="input"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                <option value="HVAC">HVAC</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cost" className="label">Cost *</label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  step="0.01"
                  required
                  className="input"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="price" className="label">Sell Price *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  step="0.01"
                  required
                  className="input"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="label">Quantity on Hand</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  className="input"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="minQuantity" className="label">Minimum Quantity</label>
                <input
                  type="number"
                  id="minQuantity"
                  name="minQuantity"
                  className="input"
                  placeholder="0"
                  value={formData.minQuantity}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="location" className="label">Storage Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className="input"
                  placeholder="Warehouse, shelf, etc."
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="vendor" className="label">Vendor</label>
                <input
                  type="text"
                  id="vendor"
                  name="vendor"
                  className="input"
                  placeholder="Supplier name"
                  value={formData.vendor}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Link href="/dashboard/inventory/parts" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating...' : 'Create Part'}
          </button>
        </div>
      </form>
    </div>
  )
}
