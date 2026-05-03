/**
 * Image upload via Cloudinary (unsigned uploads).
 * Drop-in replacement for the old Firebase Storage module —
 * same exported function signatures, same onProgress callback.
 */

const CLOUD_NAME    = 'dxqcqlk0n';
const UPLOAD_PRESET = 'nocapvc_imageupload';
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file) {
  if (!file) throw new Error('No file provided.');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 5 MB.`
    );
  }
}

function uploadToCloudinary(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch {
          reject(new Error('Upload succeeded but response was invalid.'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err?.error?.message || `Upload failed (${xhr.status}).`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}.`));
        }
      }
    };

    xhr.onerror   = () => reject(new Error('Network error during upload.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out.'));

    xhr.send(formData);
  });
}

export async function uploadUserAvatar(userId, file, onProgress) {
  if (!userId) throw new Error('userId is required.');
  validateImageFile(file);
  return uploadToCloudinary(file, `nocapvc/users/${userId}`, onProgress);
}

export async function uploadNodePhoto(ideaId, nodeId, file, onProgress) {
  if (!ideaId) throw new Error('ideaId is required.');
  if (!nodeId)  throw new Error('nodeId is required.');
  validateImageFile(file);
  return uploadToCloudinary(file, `nocapvc/ideas/${ideaId}/nodes`, onProgress);
}

export async function uploadBranchPhoto(ideaId, branchId, file, onProgress) {
  if (!ideaId)   throw new Error('ideaId is required.');
  if (!branchId) throw new Error('branchId is required.');
  validateImageFile(file);
  return uploadToCloudinary(file, `nocapvc/ideas/${ideaId}/branches`, onProgress);
}

// Cloudinary signed deletion needs a server — no-op is safe for now
export async function deletePhoto(_url) {
  return;
}
