'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Tables } from '@/types/supabase'

export default function LiveCheckInScanner({ eventId, enableHeatMap }: { eventId: string, enableHeatMap: boolean }) {
  const [activeTab, setActiveTab] = useState<'presentes' | 'pendientes'>('pendientes')
  const [scanResult, setScanResult] = useState<string | null>(null)
  
  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', { 
        qrbox: { width: 250, height: 250 },
        fps: 5,
    }, false)
    
    scanner.render((decodedText) => {
        scanner.clear()
        setScanResult(decodedText)
        handleSuccessfulScan(decodedText)
    }, (error) => {
        // Ignorar errores repetitivos de escaneo
    })

    return () => { scanner.clear() }
  }, [])

  const handleSuccessfulScan = async (token: string) => {
    // Aquí implementaremos la lógica de validación + ubicación
    // Si enableHeatMap, pedir location.getCurrentPosition y enviar
    // Optimistic UI update
    console.log("Scanned:", token)
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-md mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 p-1 neu-card rounded-full">
        <button 
           className={`flex-1 py-3 rounded-full ${activeTab === 'pendientes' ? 'bg-accent text-white' : 'transparent'}`}
           onClick={() => setActiveTab('pendientes')}
        >
          Pendientes
        </button>
        <button 
           className={`flex-1 py-3 rounded-full ${activeTab === 'presentes' ? 'bg-accent text-white' : 'transparent'}`}
           onClick={() => setActiveTab('presentes')}
        >
          Presentes
        </button>
      </div>

      {/* Scanner UI */}
      <div className="neu-card p-2 aspect-square overflow-hidden" style={{ borderRadius: 'var(--r-xl)' }}>
        <div id="reader" className="w-full h-full" />
      </div>
      
      {scanResult && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="neu-card bg-emerald-950/20 text-emerald-500 p-4 text-center">
            Escaneado con éxito
        </motion.div>
      )}
    </div>
  )
}