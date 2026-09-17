import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  File,
  Check,
  X as XIcon,
} from 'lucide-react'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
]
const ALLOWED_EXTENSIONS = ['.pdf', '.txt']

/**
 * Drag-and-drop resume upload component with multiple states.
 *
 * @param {Object} props
 * @param {string|null} props.sessionId - Session identifier for upload context
 * @param {(profile: object) => void} props.onUploadComplete - Callback with parsed profile after upload
 * @param {boolean} props.loading - Whether an upload is in progress
 */
export default function ResumeUpload({ sessionId, onUploadComplete, loading }) {
  const [file, setFile] = useState(null)
  const [state, setState] = useState('idle') // idle | uploading | success | error
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const validateFile = useCallback((file) => {
    if (file.size === 0) {
      return 'File is empty.'
    }
    if (file.size > MAX_SIZE) {
      return 'File size must be under 5MB'
    }
    const ext = file.name.split('.').pop().toLowerCase()
    const isAllowedType = ALLOWED_TYPES.includes(file.type) ||
      ALLOWED_EXTENSIONS.includes(`.${ext}`)
    if (!isAllowedType) {
      return 'Please upload a .pdf or .txt file'
    }
    return null
  }, [])

  const handleFileSelect = useCallback((selectedFile) => {
    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      setState('error')
      return
    }

    setError(null)
    setFile(selectedFile)
    setState('uploading')
    onUploadComplete(selectedFile)
  }, [validateFile, onUploadComplete])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer.files?.length) {
        handleFileSelect(e.dataTransfer.files[0])
      }
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleBrowse = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleInputChange = useCallback(
    (e) => {
      if (e.target.files?.length) {
        handleFileSelect(e.target.files[0])
      }
    },
    [handleFileSelect],
  )

  const handleReset = useCallback(() => {
    setFile(null)
    setError(null)
    setState('idle')
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  return (
    <div className="resume-upload">
      {state === 'idle' && (
        <div
          className="resume-upload__zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleBrowse}
          role="button"
          tabIndex={0}
          aria-label="Upload resume area. Click or drag and drop a file."
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleBrowse()
          }}
        >
          <Upload size={36} className="resume-upload__icon" />
          <p className="resume-upload__text">
            Drag &amp; drop your resume or{' '}
            <span className="resume-upload__browse">click to browse</span>
          </p>
          <p className="resume-upload__formats">
            .pdf, .txt (max 5 MB)
          </p>
        </div>
      )}

      {state === 'uploading' && file && (
        <div className="resume-upload__uploading">
          <File size={24} className="resume-upload__file-icon" />
          <div className="resume-upload__info">
            <p className="resume-upload__filename">{file.name}</p>
          </div>
          <div className="resume-upload__spinner" aria-label="Uploading">
            <svg className="resume-upload__spinner-svg" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray="31.4 31.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="resume-upload__error">
          <XIcon size={20} className="resume-upload__error-icon" />
          <p className="resume-upload__error-text">{error}</p>
          <button
            className="resume-upload__try-btn"
            onClick={handleReset}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
    </div>
  )
}
