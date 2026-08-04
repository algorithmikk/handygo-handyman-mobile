import { api } from '../lib/api';

interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
}

/**
 * Upload a KYC document via presigned S3 URL.
 */
export async function uploadKycDocument(
  localUri: string,
  contentType = 'image/jpeg',
): Promise<string> {
  const presignResponse = await api.post<PresignResponse>('/media/presign', {
    contentType,
    folder: 'kyc/handyman',
  });
  if (presignResponse.error || !presignResponse.data) {
    throw new Error(presignResponse.error || 'Failed to get upload URL');
  }

  const { uploadUrl, publicUrl } = presignResponse.data;
  const blob = await (await fetch(localUri)).blob();
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!putRes.ok) {
    throw new Error(`Document upload failed (${putRes.status})`);
  }
  return publicUrl;
}
