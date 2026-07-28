import { cloudinary } from '../config/cloudinary'
import { generateAndStoreEmbedding } from './embedding.service'
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
export async function uploadReportImages(
  files: Express.Multer.File[],
): Promise<UploadedImage[]> {
  const uploaded = await Promise.all(files.map((file) => uploadBuffer(file.buffer)))

  await Promise.allSettled(
    uploaded.map((image) => generateAndStoreEmbedding(image))
  )

  return uploaded
}
