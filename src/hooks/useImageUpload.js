import { useState, useCallback } from 'react';
import { validateImageFile, MAX_FILE_SIZE, ALLOWED_TYPES } from '../lib/storage';

/**
 * useImageUpload
 *
 * Generic hook for uploading images to Firebase Storage.
 * Handles validation, progress, loading state, and errors.
 *
 * @param {function(File, function(number): void): Promise<string>} uploadFn
 *   A function that accepts (file, onProgress) and returns a Promise<downloadURL>.
 *   Pass one of: uploadUserAvatar, uploadNodePhoto, uploadBranchPhoto
 *   — partially applied with their fixed args (userId / ideaId+nodeId / etc.)
 *
 * @returns {{
 *   upload:    function(File): Promise<string|null>,
 *   uploading: boolean,
 *   progress:  number,   // 0–100
 *   error:     string|null,
 *   reset:     function(): void,
 * }}
 *
 * @example — avatar upload
 *   const { upload, uploading, progress, error } = useImageUpload(
 *     (file, onProgress) => uploadUserAvatar(uid, file, onProgress)
 *   );
 *   const url = await upload(selectedFile);
 *
 * @example — node photo upload
 *   const { upload, uploading, progress, error } = useImageUpload(
 *     (file, onProgress) => uploadNodePhoto(ideaId, 'solution', file, onProgress)
 *   );
 */
export function useImageUpload(uploadFn) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState(null);

  /**
   * reset — clear error and progress back to idle state.
   * Call this when the user dismisses an error or selects a new file.
   */
  const reset = useCallback(() => {
    setError(null);
    setProgress(0);
    setUploading(false);
  }, []);

  /**
   * upload — validate and upload a file.
   *
   * @param {File} file
   * @returns {Promise<string|null>} Download URL on success, null on failure.
   */
  const upload = useCallback(
    async (file) => {
      setError(null);
      setProgress(0);

      // ── Client-side validation ──────────────────
      try {
        validateImageFile(file);
      } catch (validationError) {
        setError(validationError.message);
        return null;
      }

      // ── Upload ──────────────────────────────────
      setUploading(true);
      try {
        const url = await uploadFn(file, (pct) => {
          setProgress(pct);
        });
        setProgress(100);
        return url;
      } catch (uploadError) {
        setError(uploadError.message || 'Upload failed. Please try again.');
        return null;
      } finally {
        setUploading(false);
      }
    },
    [uploadFn]
  );

  return { upload, uploading, progress, error, reset };
}

/**
 * ImageUploadInput
 *
 * Ready-to-use input component that wires up useImageUpload.
 * Drop this wherever you need a photo upload button.
 *
 * @prop {function(File, function(number): void): Promise<string>} uploadFn
 * @prop {function(string): void} onSuccess   - called with the download URL
 * @prop {string}  [label]                    - button label
 * @prop {string}  [currentPhotoURL]          - shows current image if provided
 * @prop {boolean} [disabled]
 *
 * @example
 *   <ImageUploadInput
 *     uploadFn={(file, progress) => uploadUserAvatar(uid, file, progress)}
 *     onSuccess={(url) => updateProfile({ photoURL: url })}
 *     label="Upload profile photo"
 *     currentPhotoURL={user.photoURL}
 *   />
 */
export function ImageUploadInput({
  uploadFn,
  onSuccess,
  label = 'Upload image',
  currentPhotoURL,
  disabled = false,
}) {
  const { upload, uploading, progress, error, reset } = useImageUpload(uploadFn);

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input value so the same file can be re-selected after an error
    e.target.value = '';
    const url = await upload(file);
    if (url && typeof onSuccess === 'function') {
      onSuccess(url);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Current image preview */}
      {currentPhotoURL && (
        <img
          src={currentPhotoURL}
          alt="Current upload"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(0,0,0,0.1)',
          }}
        />
      )}

      {/* Upload button */}
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          opacity: disabled || uploading ? 0.6 : 1,
          fontFamily: 'DM Mono, monospace',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.06em',
          color: '#0a0a0a',
          padding: '10px 18px',
          border: '1.5px solid rgba(0,0,0,0.15)',
          borderRadius: '6px',
          background: '#fff',
          transition: 'border-color 0.15s',
          width: 'fit-content',
        }}
      >
        <input
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          style={{ display: 'none' }}
          disabled={disabled || uploading}
          onChange={handleChange}
        />
        {uploading ? `Uploading… ${progress}%` : label}
      </label>

      {/* Progress bar */}
      {uploading && (
        <div
          style={{
            height: '3px',
            background: 'rgba(0,0,0,0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
            maxWidth: '240px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: '#FFE034',
              borderRadius: '2px',
              transition: 'width 0.2s ease',
            }}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            fontSize: '11px',
            color: '#c0392b',
            fontFamily: 'DM Mono, monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>{error}</span>
          <button
            onClick={reset}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#c0392b',
              fontSize: '11px',
              textDecoration: 'underline',
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* File size hint */}
      {!uploading && !error && (
        <div style={{ fontSize: '10px', color: '#aaa', fontFamily: 'DM Mono, monospace' }}>
          Max {MAX_FILE_SIZE / 1024 / 1024}MB · JPEG, PNG, WebP
        </div>
      )}
    </div>
  );
}
