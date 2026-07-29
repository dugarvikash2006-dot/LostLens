import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { CATEGORY_OPTIONS, CATEGORY_LABELS } from '../types/item'
import type { Category, ImageReference } from '../types/item'
import ImageUploader from './ImageUploader'
import { CheckIcon } from './icons'
import '../pages/Auth.css'
import '../pages/Reports.css'
import './ReportQuality.css'

export interface ReportFormValues {
  title: string
  description: string
  category: Category
  location: string
  date: string
  images: ImageReference[]
  contactName: string
  contactPhone: string
  contactEmail: string
  currentLocation: string
}

interface ReportFormErrors {
  title?: string
  description?: string
  category?: string
  location?: string
  date?: string
  contactPhone?: string
  contactEmail?: string
}

interface ReportFormProps {
  heading: string
  subheading: string
  /** e.g. "Date Lost" or "Date Found" */
  dateLabel: string
  /** Only Found reports collect a pickup location. */
  showCurrentLocation?: boolean
  submitLabel: string
  submittingLabel: string
  onSubmit: (values: ReportFormValues) => Promise<void>
}

// Lenient on purpose — "basic formatting" per the product spec, not full
// E.164 validation. Mirrors backend/src/validators/item.validator.ts.
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/
// Mirrors the email check already used in Signup.tsx, so the same
// "looks like an email" rule applies everywhere the app checks one.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Shared Title/Description/Category/Location/Date form used by both the
 * Create Lost Report and Create Found Report pages — they're identical
 * except for labels, the date field's name, and what happens on submit,
 * all of which the parent page controls via props. Also collects
 * optional contact details (either flow) and, when
 * `showCurrentLocation` is set, a pickup location (Found only).
 */
function ReportForm({
  heading,
  subheading,
  dateLabel,
  showCurrentLocation = false,
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
  const [currentLocation, setCurrentLocation] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const [errors, setErrors] = useState<ReportFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Submitting is blocked both while the form's own request is in
  // flight and while an image upload is still running — the latter
  // prevents submitting a report before its images have finished
  // uploading (and prevents starting a second upload mid-submit).
  const isBusy = isSubmitting || isUploadingImages

  // Phase 9: purely informational — never blocks or is checked at
  // submit time. Just nudges toward a report that's easier to match
  // and easier for someone else to act on.
  const qualityChecks = [
    { key: 'photo', label: 'Photo', met: images.length > 0 },
    { key: 'description', label: 'Description', met: description.trim().length >= 20 },
    { key: 'location', label: 'Location', met: location.trim().length > 0 },
    {
      key: 'contact',
      label: 'Contact details',
      met: Boolean(contactName.trim() || contactPhone.trim() || contactEmail.trim()),
    },
  ]
  const metQualityChecks = qualityChecks.filter((check) => check.met).length
  const qualityTier =
    metQualityChecks === qualityChecks.length
      ? 'Excellent'
      : metQualityChecks >= 2
        ? 'Good'
        : 'Needs more information'
  const missingQualityChecks = qualityChecks.filter((check) => !check.met)

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
    if (contactPhone.trim() && !PHONE_REGEX.test(contactPhone.trim())) {
      nextErrors.contactPhone = 'Enter a valid phone number.'
    }
    if (contactEmail.trim() && !EMAIL_REGEX.test(contactEmail.trim())) {
      nextErrors.contactEmail = 'Enter a valid email address.'
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
        currentLocation: currentLocation.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
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
            <ImageUploader
              images={images}
              onChange={setImages}
              disabled={isBusy}
              onUploadingChange={setIsUploadingImages}
            />

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

            {showCurrentLocation && (
              <div className="form-field">
                <label htmlFor="report-current-location">Current Location</label>
                <input
                  id="report-current-location"
                  type="text"
                  value={currentLocation}
                  onChange={(event) => setCurrentLocation(event.target.value)}
                  placeholder="e.g. Library Reception, Block A Security Desk"
                  disabled={isBusy}
                />
                <p className="form-hint">
                  Where can someone pick this item up? The more specific, the easier it is to
                  return.
                </p>
              </div>
            )}

            <fieldset className="report-form-contact">
              <legend>Contact Information (optional)</legend>
              <p className="form-hint">
                Share how someone can reach you about this report. Provide a phone number, an
                email address, or both.
              </p>

              <div className="form-field">
                <label htmlFor="report-contact-name">Name</label>
                <input
                  id="report-contact-name"
                  type="text"
                  value={contactName}
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="e.g. Priya Sharma"
                  disabled={isBusy}
                />
              </div>

              <div className="form-field">
                <label htmlFor="report-contact-phone">Phone</label>
                <input
                  id="report-contact-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                  aria-invalid={Boolean(errors.contactPhone)}
                  aria-describedby={errors.contactPhone ? 'report-contact-phone-error' : undefined}
                  placeholder="e.g. +91 98765 43210"
                  disabled={isBusy}
                />
                {errors.contactPhone && (
                  <p className="form-error" id="report-contact-phone-error">
                    {errors.contactPhone}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="report-contact-email">Email</label>
                <input
                  id="report-contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  aria-invalid={Boolean(errors.contactEmail)}
                  aria-describedby={errors.contactEmail ? 'report-contact-email-error' : undefined}
                  placeholder="e.g. priya@example.com"
                  disabled={isBusy}
                />
                {errors.contactEmail && (
                  <p className="form-error" id="report-contact-email-error">
                    {errors.contactEmail}
                  </p>
                )}
              </div>
            </fieldset>

            <div className="report-quality" aria-live="polite">
              <div className="report-quality-head">
                <span className="report-quality-title">Report Quality</span>
                <span
                  className={`report-quality-tier report-quality-tier-${metQualityChecks === qualityChecks.length ? 'excellent' : metQualityChecks >= 2 ? 'good' : 'low'}`}
                >
                  {qualityTier}
                </span>
              </div>
              <ul className="report-quality-checklist">
                {qualityChecks.map((check) => (
                  <li key={check.key} className={check.met ? 'is-met' : 'is-missing'}>
                    {check.met ? <CheckIcon /> : <span className="report-quality-dot" aria-hidden="true" />}
                    {check.label}
                  </li>
                ))}
              </ul>
              {missingQualityChecks.length > 0 && (
                <p className="report-quality-missing">
                  Missing: {missingQualityChecks.map((check) => check.label).join(', ')}
                </p>
              )}
            </div>

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
