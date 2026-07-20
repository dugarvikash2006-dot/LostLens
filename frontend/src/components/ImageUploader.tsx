import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { uploadImages } from '../api/item.api'
import { ApiError } from '../api/client'
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_MB, MAX_REPORT_IMAGES } from '../types/item'
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
    <div className="form-field">
      <label htmlFor="report-images">Photos (optional, up to {MAX_REPORT_IMAGES})</label>

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

      {remainingSlots > 0 && (
        
   <input
  id="report-images"
  ref={inputRef}
  type="file"
  accept="image/jpeg,image/png,image/webp"
  multiple
  onChange={handleFilesSelected}
  disabled={isDisabled}
/>   )}

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
