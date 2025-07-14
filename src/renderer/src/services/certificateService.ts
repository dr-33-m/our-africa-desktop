import { jsPDF } from 'jspdf'
import { Module, User } from '../types'
// Function to draw BookOpen icon using jsPDF commands
function drawBookOpenIcon(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(79, 42, 106) // Primary color #4F2A6A
  // Book cover (simplified rectangle)
  doc.rect(x, y, size * 1.5, size * 1.2, 'F')
  // Book pages (simplified lines)
  doc.setDrawColor(79, 42, 106)
  doc.setLineWidth(0.5)
  for (let i = 0; i < 5; i++) {
    doc.line(
      x + size * 0.2,
      y + size * 0.2 + i * size * 0.2,
      x + size * 1.3,
      y + size * 0.2 + i * size * 0.2
    )
  }
}

export const generateCertificate = (user: User, module: Module): string => {
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

  // Add BookOpen icon
  drawBookOpenIcon(doc, 297 / 2 - 12, 160, 10)

  // Add platform name
  doc.setFontSize(12)
  doc.setTextColor(79, 42, 106) // Primary color #4F2A6A
  doc.setFont('helvetica', 'bold')
  doc.text('Our Africa', 297 / 2, 180, { align: 'center' })

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
