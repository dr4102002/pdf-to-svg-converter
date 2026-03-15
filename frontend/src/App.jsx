import { useState, useRef } from 'react'
import './index.css'

function App() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle, uploading, converting, success, error
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF file.')
      setStatus('error')
      return
    }
    
    setFile(selectedFile)
    setErrorMessage('')
    handleUpload(selectedFile)
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const handleUpload = async (selectedFile) => {
    setStatus('uploading')
    
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      // Get API URL from environment variables, or fallback to localhost for local dev
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      setStatus('converting')
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Conversion failed. Please try again.')
      }

      // Handle the blob response for the SVG file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setDownloadUrl(url)
      setStatus('success')
      
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during conversion.')
      setStatus('error')
    }
  }

  const resetState = () => {
    setFile(null)
    setStatus('idle')
    setDownloadUrl(null)
    setErrorMessage('')
    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl)
    }
  }

  return (
    <div className="app-container">
      <h1>Vectorize</h1>
      <p className="subtitle">Convert your PDFs to high-quality editable SVG vector formats for Illustrator</p>

      <div className="converter-card">
        {status === 'idle' || status === 'error' ? (
          <>
            <div 
              className={`dropzone ${isDragging ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInput} 
                accept="application/pdf"
                style={{ display: 'none' }} 
              />
              <div className="dropzone-content">
                <svg className="icon-upload" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="dropzone-text">Click or drag your PDF here</p>
                <p className="dropzone-hint">Only .pdf files are supported</p>
              </div>
            </div>

            {status === 'error' && (
              <div className="status-container" style={{background: 'rgba(239, 68, 68, 0.1)'}}>
                <p style={{color: '#ef4444', margin: 0}}>{errorMessage}</p>
                <button className="btn btn-reset" onClick={resetState}>Try Again</button>
              </div>
            )}
          </>
        ) : status === 'converting' || status === 'uploading' ? (
          <div className="status-container">
            <span className="loader"></span>
            <p className="status-text">
              {status === 'uploading' ? 'Uploading PDF...' : 'Converting to Vector via PyMuPDF...'}
            </p>
            <p className="dropzone-hint">This might take a few seconds.</p>
          </div>
        ) : status === 'success' ? (
          <div className="status-container">
            <svg style={{width: '64px', height: '64px', color: 'var(--success-color)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 style={{margin: '0.5rem 0', color: 'var(--text-primary)'}}>Conversion Complete!</h2>
            <p className="dropzone-hint" style={{marginBottom: '1.5rem'}}>Your SVG vector file is ready for Illustrator.</p>
            
            <a 
              href={downloadUrl} 
              download={`${file?.name.replace('.pdf', '') || 'converted'}_vector.svg`}
              className="btn btn-success"
            >
              <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download SVG
            </a>
            
            <button className="btn btn-reset" onClick={resetState}>Convert another file</button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default App
