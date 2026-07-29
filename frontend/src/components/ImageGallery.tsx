import { useEffect, useState } from 'react'
import type { ReportImage } from '../types/item'
import './ImageGallery.css'

interface ImageGalleryProps {
  images: ReportImage[]
  /** The report's item name, used to give each photo a meaningful accessible name. */
  itemName?: string
}

/**
 * Responsive thumbnail grid with a click-to-enlarge lightbox. No external
 * gallery library — this is deliberately just a grid plus a full-screen
 * overlay, which covers everything the details page needs.
 */
function ImageGallery({ images, itemName }: ImageGalleryProps) {
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

  const subject = itemName ?? 'this report'

  return (
    <div className="image-gallery">
      <div className="image-gallery-grid">
        {images.map((image, index) => (
          <button
            type="button"
            key={image.id}
            className="image-gallery-thumb"
            onClick={() => setActiveIndex(index)}
            aria-label={`${subject} — photo ${index + 1} of ${images.length}, view larger`}
          >
            {/* Decorative relative to the button above, which already
                carries the full accessible name (button aria-label
                takes precedence over this img's alt in the accessible
                name computation) — empty alt here is correct, not an
                oversight. */}
            <img src={image.imageUrl} alt="" className="img-fade-in" />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${subject} — full-size photo`}
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
            alt={`${subject} — full-size photo ${activeIndex + 1} of ${images.length}`}
            className="image-lightbox-image img-fade-in"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default ImageGallery
