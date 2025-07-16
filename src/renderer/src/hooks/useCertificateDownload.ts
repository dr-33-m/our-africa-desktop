import { useState } from 'react'
import { useProgress } from './useProgress'
import { generateCertificate, saveCertificate } from '../services/certificateService'
import type { User, Module } from '../types'

export const useCertificateDownload = (): {
  downloadCertificate: (user: User, module: Module) => Promise<void>
  isGenerating: boolean
} => {
  const [isGenerating, setIsGenerating] = useState(false)
  const { getCertificate, generateCertificate: saveCertificateToStore } = useProgress()

  const downloadCertificate = async (user: User, module: Module): Promise<void> => {
    if (!user || !module) return

    setIsGenerating(true)
    try {
      // Generate the PDF certificate
      const certificateDataUrl = await generateCertificate(user, module)

      // Generate certificate code if it doesn't exist
      const existingCertificate = getCertificate(user.id, module.id)
      if (!existingCertificate) {
        await saveCertificateToStore(user.id, module.id)
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
