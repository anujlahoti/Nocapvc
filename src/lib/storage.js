/**
 * Founder Space — Firebase Storage utilities
 *
 * Folder layout:
 *   /users/{userId}/avatar          ← profile photo
 *   /ideas/{ideaId}/nodes/{nodeId}  ← main pitch-deck node photos
 *   /ideas/{ideaId}/branches/{branchId} ← branch expansion photos
 *
 * All functions use Firebase v9 modular SDK.
 * `storage` is imported from src/firebase.js.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../firebase';

// ──────────────────────────────────────────────
//  Constants
// ──────────────────────────────────────────────

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ──────────────────────────────────────────────
//  Validation
// ──────────────────────────────────────────────

/**
 * Throws a descriptive Error if the file fails type or size checks.
 * Call this before every upload to surface issues early.
 */
export function validateImageFile(file) {
  if (!file) throw new Error('No file provided.');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type "${file.type}". Allowed: JPEG, PNG, WebP.`
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`
    );
  }
}

// ──────────────────────────────────────────────
//  Core upload helper
// ──────────────────────────────────────────────

/**
 * Upload a file to a given Storage path.
 *
 * @param {string} path   - Full storage path e.g. "users/uid/avatar"
 * @param {File}   file   - The File object to upload
 * @param {function(number): void} [onProgress] - Called with 0-100 as upload progresses
 * @returns {Promise<string>} Resolves with the public download URL
 */
export function uploadFile(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (typeof onProgress === 'function') onProgress(pct);
      },
      (error) => {
        // Map Firebase storage error codes to friendly messages
        const messages = {
          'storage/unauthorized': 'Permission denied. Please sign in and try again.',
          'storage/canceled':     'Upload cancelled.',
          'storage/quota-exceeded': 'Storage quota exceeded. Contact support.',
          'storage/unknown':      'An unknown error occurred during upload.',
        };
        reject(
          new Error(messages[error.code] || error.message || 'Upload failed.')
        );
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(new Error('Upload succeeded but failed to get download URL.'));
        }
      }
    );
  });
}

// ──────────────────────────────────────────────
//  Public upload functions
// ──────────────────────────────────────────────

/**
 * Upload a user's profile avatar.
 *
 * @param {string} userId - Firebase Auth UID
 * @param {File}   file
 * @param {function(number): void} [onProgress]
 * @returns {Promise<string>} Download URL
 *
 * @example
 *   const url = await uploadUserAvatar(auth.currentUser.uid, file, setProgress);
 */
export async function uploadUserAvatar(userId, file, onProgress) {
  if (!userId) throw new Error('userId is required.');
  validateImageFile(file);
  const path = `users/${userId}/avatar`;
  return uploadFile(path, file, onProgress);
}

/**
 * Upload a photo for a main pitch-deck node (problem/reveal/solution/market/ask).
 *
 * @param {string} ideaId  - Firestore idea document ID
 * @param {string} nodeId  - One of: "problem" | "reveal" | "solution" | "market" | "ask"
 * @param {File}   file
 * @param {function(number): void} [onProgress]
 * @returns {Promise<string>} Download URL
 *
 * @example
 *   const url = await uploadNodePhoto(ideaId, 'solution', file, setProgress);
 */
export async function uploadNodePhoto(ideaId, nodeId, file, onProgress) {
  if (!ideaId) throw new Error('ideaId is required.');
  if (!nodeId)  throw new Error('nodeId is required.');
  validateImageFile(file);
  const path = `ideas/${ideaId}/nodes/${nodeId}`;
  return uploadFile(path, file, onProgress);
}

/**
 * Upload a photo for a branch expansion card.
 *
 * @param {string} ideaId    - Firestore idea document ID
 * @param {string} branchId  - Branch node ID (UUID)
 * @param {File}   file
 * @param {function(number): void} [onProgress]
 * @returns {Promise<string>} Download URL
 *
 * @example
 *   const url = await uploadBranchPhoto(ideaId, branch.id, file, setProgress);
 */
export async function uploadBranchPhoto(ideaId, branchId, file, onProgress) {
  if (!ideaId)   throw new Error('ideaId is required.');
  if (!branchId) throw new Error('branchId is required.');
  validateImageFile(file);
  const path = `ideas/${ideaId}/branches/${branchId}`;
  return uploadFile(path, file, onProgress);
}

/**
 * Delete a photo by its download URL.
 * Safe to call with null/undefined — resolves without error.
 *
 * @param {string|null} url - Firebase Storage download URL
 * @returns {Promise<void>}
 *
 * @example
 *   await deletePhoto(user.photoURL);
 */
export async function deletePhoto(url) {
  if (!url) return;
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    // "object-not-found" is not an error worth throwing — file already gone
    if (error.code !== 'storage/object-not-found') {
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }
}
