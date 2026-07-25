import { cloudinary } from '../config/cloudinary'
import { getImageEmbedding, logEmbeddingSummary } from './ai.service'

export interface UploadedImage {
  imageUrl: string
  publicId: string
}

// Cloudinary folder — keeps LostLens uploads namespaced instead of
// landing in the account's root, and lets a public_id be generated
// automatically rather than trusting anything from the client (original
// filenames are never used as the Cloudinary public_id).
const UPLOAD_FOLDER = 'lostlens/items'

function uploadBuffer(buffer: Buffer): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: UPLOAD_FOLDER, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed.'))
          return
        }
        resolve({ imageUrl: result.secure_url, publicId: result.public_id })
      },
    )
    uploadStream.end(buffer)
  })
}

// Milestone 2: best-effort call to the standalone AI service for each
// newly uploaded image. This never affects the upload response — any
// failure is already caught and logged inside getImageEmbedding, so this
// function itself cannot throw. Embeddings are only logged for now, not
// persisted (see the "Future database storage" note in ai.service.ts's
// module docs / the backend README).
async function requestAndLogEmbedding(imageUrl: string): Promise<void> {
  const embedding = await getImageEmbedding(imageUrl)

  if (embedding) {
    logEmbeddingSummary(imageUrl, embedding)
  } else {
    console.warn(`No embedding generated for ${imageUrl} (AI service unavailable or errored).`)
  }
}

export async function uploadReportImages(
  files: Express.Multer.File[],
): Promise<UploadedImage[]> {
  const uploaded = await Promise.all(files.map((file) => uploadBuffer(file.buffer)))

  // Best-effort, run after every image has a real Cloudinary URL. Awaited
  // (rather than fire-and-forget) so a future milestone can persist the
  // result to the database with a single added line here, without
  // restructuring this function.
  await Promise.all(uploaded.map((image) => requestAndLogEmbedding(image.imageUrl)))

  return uploaded
}
