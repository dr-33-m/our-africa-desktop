import { jsPDF } from 'jspdf'
import { Module, User } from '../types'
import logoImage from '../assets/logo.png'

// Function to load image as base64
const loadImageAsBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      try {
        const dataURL = canvas.toDataURL('image/png')
        resolve(dataURL)
      } catch (error) {
        reject(error)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

export const generateCertificate = async (user: User, module: Module): Promise<string> => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  // Set background color
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, 297, 210, 'F')

  // Add border
  doc.setDrawColor(79, 42, 106) // Primary color #4F2A6A
  doc.setLineWidth(1)
  doc.rect(10, 10, 277, 190)

  // Add header
  doc.setFontSize(30)
  doc.setTextColor(79, 42, 106) // Primary color #4F2A6A
  doc.setFont('helvetica', 'bold')
  doc.text('Certificate of Completion', 297 / 2, 40, { align: 'center' })

  // Add decoration line
  doc.setDrawColor(249, 168, 38) // Secondary color #F9A826
  doc.setLineWidth(1)
  doc.line(70, 50, 227, 50)

  // Add certificate text
  doc.setFontSize(16)
  doc.setTextColor(68, 68, 68)
  doc.setFont('helvetica', 'normal')
  doc.text('This is to certify that', 297 / 2, 70, { align: 'center' })

  // Add user name
  doc.setFontSize(24)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(user.username, 297 / 2, 85, { align: 'center' })

  // Add completion text
  doc.setFontSize(16)
  doc.setTextColor(68, 68, 68)
  doc.setFont('helvetica', 'normal')
  doc.text('has successfully completed the course', 297 / 2, 100, {
    align: 'center'
  })

  // Add course name
  doc.setFontSize(20)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(module.title, 297 / 2, 115, { align: 'center' })

  // Add date
  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  doc.setFontSize(14)
  doc.setTextColor(68, 68, 68)
  doc.setFont('helvetica', 'normal')
  doc.text(`Issued on ${formattedDate}`, 297 / 2, 135, { align: 'center' })

  // Add certificate ID
  const certificateId = generateCertificateId(user.id, module.id)
  doc.setFontSize(10)
  doc.text(`Certificate ID: ${certificateId}`, 297 / 2, 150, {
    align: 'center'
  })

  // Add logo or fallback text
  try {
    const logoBase64 = await loadImageAsBase64(logoImage)
    const logoSize = 20 // Logo size in mm
    doc.addImage(
      logoBase64,
      'PNG',
      297 / 2 - logoSize / 2, // Center horizontally
      155, // Y position
      logoSize,
      logoSize,
      undefined,
      'FAST'
    )
  } catch (error) {
    console.warn('Failed to load logo for certificate:', error)
    // Fallback: Add "Our Africa" text instead of logo
    doc.setFontSize(12)
    doc.setTextColor(79, 42, 106) // Primary color #4F2A6A
    doc.setFont('helvetica', 'bold')
    doc.text('Our Africa', 297 / 2, 170, { align: 'center' })
  }

  // Save the PDF
  return doc.output('datauristring')
}

const generateCertificateId = (userId: number, moduleId: number): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `VC-${userId}-${moduleId}-${timestamp}-${random}`.toUpperCase()
}

export const saveCertificate = (dataUrl: string, fileName: string): void => {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  link.click()
}
