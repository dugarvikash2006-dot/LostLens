import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLostReport } from '../api/item.api'
import { ApiError } from '../api/client'
import { CATEGORY_OPTIONS } from '../types/item'
import type { Category } from '../types/item'
import './Auth.css'
import './Reports.css'

interface FormErrors {
  title?: string
  description?: string
  category?: string
  location?: string
  dateLost?: string
}

const CATEGORY_LABELS: Record<Category, string> = {
  ELECTRONICS: 'Electronics',
  ACCESSORIES: 'Accessories',
  BAGS: 'Bags',
  DOCUMENTS: 'Documents',
  KEYS: 'Keys',
  CLOTHING: 'Clothing',
  BOOKS: 'Books',
  OTHER: 'Other',
}

function CreateLostReport() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [location, setLocation] = useState('')
  const [dateLost, setDateLost] = useState('')

  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Light frontend checks only — the backend remains the source of truth
  // for exact length/format rules.
  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {}

    if (!title.trim()) {
      nextErrors.title = 'Title is required.'
    }
    if (!description.trim()) {
      nextErrors.description = 'Description is required.'
    }
    if (!category) {
      nextErrors.category = 'Category is required.'
    }
    if (!location.trim()) {
      nextErrors.location = 'Location is required.'
    }
    if (!dateLost) {
      nextErrors.dateLost = 'Date lost is required.'
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) return

    setFormError(null)
    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || !category) {
      return
    }

    setIsSubmitting(true)

    try {
      await createLostReport({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        dateLost,
      })
      navigate('/my-reports')
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-section report-form-section section">
      <div className="container auth-container">
        <div className="auth-card report-form-card card">
          <div className="auth-header report-form-header">
            <h1>Report a Lost Item</h1>
            <p>Fill in the details below — the more specific, the easier it is to match.</p>
          </div>

          {formError && (
            <div className="auth-error" role="alert">
              {formError}
            </div>
          )}

          <form className="auth-form report-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="report-title">Title</label>
              <input
                id="report-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'report-title-error' : undefined}
                placeholder="e.g. Blue Water Bottle"
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="form-error" id="report-title-error">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="report-description">Description</label>
              <textarea
                id="report-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'report-description-error' : undefined}
                placeholder="Describe the item, any distinctive marks, etc."
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="form-error" id="report-description-error">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="report-category">Category</label>
              <select
                id="report-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={errors.category ? 'report-category-error' : undefined}
                disabled={isSubmitting}
              >
                <option value="">Select a category…</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {CATEGORY_LABELS[option]}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="form-error" id="report-category-error">
                  {errors.category}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="report-location">Location</label>
              <input
                id="report-location"
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? 'report-location-error' : undefined}
                placeholder="e.g. Library, 2nd Floor"
                disabled={isSubmitting}
              />
              {errors.location && (
                <p className="form-error" id="report-location-error">
                  {errors.location}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="report-date-lost">Date Lost</label>
              <input
                id="report-date-lost"
                type="date"
                value={dateLost}
                onChange={(event) => setDateLost(event.target.value)}
                aria-invalid={Boolean(errors.dateLost)}
                aria-describedby={errors.dateLost ? 'report-date-lost-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.dateLost && (
                <p className="form-error" id="report-date-lost-error">
                  {errors.dateLost}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default CreateLostReport
