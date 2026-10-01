import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'
import { FileRejectedError } from '../utils/mediaValidation'
import { env } from './env'

// The ONE place where Cloudinary is configured. Everything else imports the helpers below,
// so no controller or service ever touches the API secret.
cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true, // always return https:// URLs
})

export type CloudinaryResourceType = 'image' | 'video'

// Thrown when a Cloudinary request fails, so callers can tell it apart from database errors
export class CloudinaryError extends Error {}

// Reads the "message" of an error object, if it has one
function messageOf(value: unknown): string | null {
  return typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string'
    ? value.message
    : null
}

// The SDK rejects with plain objects, not Error objects: { message, http_code } from the
// upload API, or { error: { message, http_code } } from the Admin API
function toCloudinaryError(err: unknown): CloudinaryError {
  const nested = typeof err === 'object' && err !== null && 'error' in err ? err.error : null
  const message = messageOf(err) ?? messageOf(nested) ?? 'unknown error'
  return new CloudinaryError(`Cloudinary request failed: ${message}`)
}

// Uploads a file from the server's temporary folder to Cloudinary.
// folder is e.g. "durgamatha/events/<eventId>/albums/<albumId>"; Cloudinary picks a unique file name.
export async function uploadFile(
  filePath: string,
  folder: string,
  resourceType: CloudinaryResourceType,
): Promise<UploadApiResponse> {
  try {
    return await cloudinary.uploader.upload(filePath, { folder, resource_type: resourceType })
  } catch (err) {
    // 400 = Cloudinary could not read the file (e.g. a text file renamed to .jpg)
    if (typeof err === 'object' && err !== null && 'http_code' in err && err.http_code === 400) {
      throw new FileRejectedError('This file is not a valid photo or video.')
    }
    throw toCloudinaryError(err)
  }
}

// Deletes one asset. "not found" counts as success: the asset is already gone, which is what we want.
export async function deleteAsset(publicId: string, resourceType: CloudinaryResourceType): Promise<void> {
  let result: { result?: string }
  try {
    result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true, // also clear cached copies on Cloudinary's CDN
    })
  } catch (err) {
    throw toCloudinaryError(err)
  }
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new CloudinaryError(`Cloudinary could not delete ${publicId}: ${result.result ?? 'unknown error'}`)
  }
}

// Deletes many assets at once (used when an album or event is deleted).
// Cloudinary's Admin API accepts at most 100 ids per call, so we send them in groups of 100.
export async function deleteAssets(assets: { publicId: string; resourceType: CloudinaryResourceType }[]): Promise<void> {
  for (const resourceType of ['image', 'video'] as const) {
    const ids = assets.filter((asset) => asset.resourceType === resourceType).map((asset) => asset.publicId)
    for (let start = 0; start < ids.length; start += 100) {
      try {
        await cloudinary.api.delete_resources(ids.slice(start, start + 100), { resource_type: resourceType, invalidate: true })
      } catch (err) {
        throw toCloudinaryError(err)
      }
    }
  }
}
