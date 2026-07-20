import { useEffect, useState } from 'react'
import type { ReportImage } from '../types/item'
import './ImageGallery.css'

interface ImageGalleryProps {
  images: ReportImage[]
}

/**
 * Responsive thumbnail grid with a click-to-enlarge lightbox. No external
 * gallery library — this is deliberately just a grid plus a full-screen
 * overlay, which covers everything the details page needs.
 */
function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Close on Escape while the lightbox is open.
  useEffect(() => {
    if (activeIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex])

  if (images.length === 0) {
    return null
  }

  return (
    <div className="image-gallery">
      <div className="image-gallery-grid">
        {images.map((image, index) => (
          <button
            type="button"
            key={image.id}
            className="image-gallery-thumb"
            onClick={() => setActiveIndex(index)}
            aria-label={`View image ${index + 1} of ${images.length} larger`}
          >
            <img src={image.imageUrl} alt="" />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            className="image-lightbox-close"
            onClick={() => setActiveIndex(null)}
            aria-label="Close preview"
          >
            ×
          </button>
          <img
            src={images[activeIndex].imageUrl}
            alt=""
            className="image-lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default ImageGallery
