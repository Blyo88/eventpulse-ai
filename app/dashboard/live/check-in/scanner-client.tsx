'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { processQRCodeAction } from './[eventId]/actions'

export default function LiveCheckInScanner({ eventId, enableHeatMap }: { eventId: string, enableHeatMap: boolean }) {
  const [activeTab, setActiveTab] = useState<'presentes' | 'pendientes'>('pendientes')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    if (!isScanning) return
    const scanner = new Html5QrcodeScanner('reader', { 
        qrbox: { width: 250, height: 250 },
        fps: 5,
    }, false)
    
    scanner.render((decodedText: string) => {
        scanner.clear()
        handleSuccessfulScan(decodedText)
    }, (error: any) => {})

    return () => { scanner.clear() }
  }, [isScanning])

  const handleSuccessfulScan = async (token: string) => {
    setIsScanning(false)
    const result = await processQRCodeAction(token, eventId)
    
    if (result.success) {
      setToast({ message: result.message, type: 'success' })
      // Aquí se aplicaría el Optimistic UI (mover de pendiente a presente)
    } else {
      setToast({ message: result.message, type: 'error' })
    }

    setTimeout(() => {
      setToast(null)
      setIsScanning(true)
    }, 2000)
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-md mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`neu-card p-4 text-center ${toast.type === 'success' ? 'bg-emerald-950/20 text-emerald-500' : 'bg-red-950/20 text-red-500'}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2 p-1 neu-card rounded-full">
        {/* ... (tabs intactas) */}
      </div>

      {/* Scanner UI */}
      <div className="neu-card p-2 aspect-square overflow-hidden" style={{ borderRadius: 'var(--r-xl)' }}>
        <div id="reader" className="w-full h-full" />
      </div>
    </div>
  )
}