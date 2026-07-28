import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { uploadImages } from '../api/item.api'
import { ApiError } from '../api/client'
import { MAX_REPORT_IMAGES } from '../types/item'
import type { ImageReference } from '../types/item'
import './ImageUploader.css'

interface ImageUploaderProps {
  images: ImageReference[]
  onChange: (images: ImageReference[]) => void
  disabled?: boolean
  /** Lets the parent form disable its submit button while an upload is in flight. */
  onUploadingChange?: (isUploading: boolean) => void
}

/**
 * Lets the user pick up to MAX_REPORT_IMAGES images, uploads them to the
 * backend (which forwards them to Cloudinary) as soon as they're
 * selected, and shows previews with a remove button. The parent
 * (ReportForm) just receives the resulting image references — it never
 * touches File objects or the upload endpoint directly.
 */
function ImageUploader({
  images,
  onChange,
  disabled = false,
  onUploadingChange,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const setUploading = (value: boolean) => {
    setIsUploading(value)
    onUploadingChange?.(value)
  }

  const remainingSlots = MAX_REPORT_IMAGES - images.length
  const isDisabled = disabled || isUploading

  const handleFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {

  const input = event.currentTarget
  const fileList = input.files

if (!fileList || fileList.length === 0) {
  return
}

const files = Array.from(fileList)

// Clear the input only AFTER copying the files.
input.value = ""

  setError(null)

  setUploading(true)

  try {

    const response = await uploadImages(files)

    

    onChange([...images, ...response.data.images])
  } catch (err) {

    setError(
      err instanceof ApiError
        ? err.message
        : "Image upload failed."
    )
  } finally {
    setUploading(false)
  }
}

  const handleRemove = (publicId: string) => {
    onChange(images.filter((image) => image.publicId !== publicId))
  }

  return (
    <div className="form-field image-uploader-field">
      {remainingSlots > 0 && (
        <label htmlFor="report-images" className={`dropzone-label ${isDisabled ? 'dropzone-label-disabled' : ''}`}>
          <input
            id="report-images"
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFilesSelected}
            disabled={isDisabled}
            className="visually-hidden"
          />
          <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 16V4m0 0-4 4m4-4 4 4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="dropzone-title">Add photos</span>
          <span className="dropzone-hint">
            Up to {MAX_REPORT_IMAGES} photos · JPG, PNG or WEBP · the clearer the photo, the
            faster Lens Match can find it
          </span>
        </label>
      )}

      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((image) => (
            <div className="image-preview" key={image.publicId}>
              <img src={image.imageUrl} alt="" />
              <button
                type="button"
                className="image-preview-remove"
                onClick={() => handleRemove(image.publicId)}
                disabled={isDisabled}
                aria-label="Remove this image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <p className="image-upload-status" role="status" aria-live="polite">
          Uploading…
        </p>
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

export default ImageUploader
