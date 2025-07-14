import { useState } from 'react'
import { useAuth } from './useAuth'
import { useProgress } from './useProgress'
import { generateCertificate, saveCertificate } from '../services/certificateService'
import type { User, Module } from '../types'

export const useCertificateDownload = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const { getCertificate, generateCertificate: saveCertificateToStore } = useProgress()

  const downloadCertificate = async (user: User, module: Module) => {
    if (!user || !module) return

    setIsGenerating(true)
    try {
      // Generate the PDF certificate
      const certificateDataUrl = generateCertificate(user, module)

      // Generate certificate code if it doesn't exist
      const existingCertificate = getCertificate(user.id, module.id)
      if (!existingCertificate) {
        const { getAuthHeaders } = useAuth.getState()
        await saveCertificateToStore(user.id, module.id, getAuthHeaders())
      }

      // Download the certificate
      const fileName = `${module.title.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`
      saveCertificate(certificateDataUrl, fileName)
    } catch (error) {
      console.error('Failed to generate certificate:', error)
      throw error // Re-throw so components can handle it if needed
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    downloadCertificate,
    isGenerating
  }
}
