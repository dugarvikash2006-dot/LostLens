import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { CATEGORY_OPTIONS } from '../types/item'
import type { Category, ImageReference } from '../types/item'
import ImageUploader from './ImageUploader'
import '../pages/Auth.css'
import '../pages/Reports.css'

export interface ReportFormValues {
  title: string
  description: string
  category: Category
  location: string
  date: string
  images: ImageReference[]
}

interface ReportFormErrors {
  title?: string
  description?: string
  category?: string
  location?: string
  date?: string
}

interface ReportFormProps {
  heading: string
  subheading: string
  /** e.g. "Date Lost" or "Date Found" */
  dateLabel: string
  submitLabel: string
  submittingLabel: string
  onSubmit: (values: ReportFormValues) => Promise<void>
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

/**
 * Shared Title/Description/Category/Location/Date form used by both the
 * Create Lost Report and Create Found Report pages — they're identical
 * except for labels, the date field's name, and what happens on submit,
 * all of which the parent page controls via props.
 */
function ReportForm({
  heading,
  subheading,
  dateLabel,
  submitLabel,
  submittingLabel,
  onSubmit,
}: ReportFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [images, setImages] = useState<ImageReference[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const [errors, setErrors] = useState<ReportFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Submitting is blocked both while the form's own request is in
  // flight and while an image upload is still running — the latter
  // prevents submitting a report before its images have finished
  // uploading (and prevents starting a second upload mid-submit).
  const isBusy = isSubmitting || isUploadingImages

  // Light frontend checks only — the backend remains the source of truth
  // for exact length/format rules.
  const validate = (): ReportFormErrors => {
    const nextErrors: ReportFormErrors = {}

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
    if (!date) {
      nextErrors.date = `${dateLabel} is required.`
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isBusy) return

    setFormError(null)
    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || !category) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        date,
        images,
      })
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
            <h1>{heading}</h1>
            <p>{subheading}</p>
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
                disabled={isBusy}
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
                disabled={isBusy}
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
                disabled={isBusy}
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
                disabled={isBusy}
              />
              {errors.location && (
                <p className="form-error" id="report-location-error">
                  {errors.location}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="report-date">{dateLabel}</label>
              <input
                id="report-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'report-date-error' : undefined}
                disabled={isBusy}
              />
              {errors.date && (
                <p className="form-error" id="report-date-error">
                  {errors.date}
                </p>
              )}
            </div>

            <ImageUploader
              images={images}
              onChange={setImages}
              disabled={isBusy}
              onUploadingChange={setIsUploadingImages}
            />

            <button type="submit" className="btn btn-primary btn-block" disabled={isBusy}>
              {isSubmitting ? submittingLabel : isUploadingImages ? 'Uploading photos…' : submitLabel}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default ReportForm
