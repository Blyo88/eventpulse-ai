'use client'

import { useEffect, useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { updateAttendeeLocationAction } from './actions'

function SuccessContent() {
  const searchParams = useSearchParams()
  const attendeeId = searchParams.get('attendeeId')
  const heatmap = searchParams.get('heatmap') === 'true'
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false)

  useEffect(() => {
    if (heatmap && attendeeId && !hasRequestedLocation) {
      setHasRequestedLocation(true)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                updateAttendeeLocationAction(attendeeId, position.coords.latitude, position.coords.longitude)
            },
            () => console.warn("Ubicación rechazada por el usuario. Continuando...")
        )
      }
    }
  }, [heatmap, attendeeId, hasRequestedLocation])

  return (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="neu-card w-full max-w-lg p-8 text-center flex flex-col items-center gap-6"
    >
      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <h1 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
        ¡Check-in exitoso!
      </h1>
      
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
        Tu asistencia ha sido registrada correctamente. 
        {heatmap && " Ayúdanos a mapear el alcance del evento compartiendo tu ubicación de forma anónima."}
      </p>

      <button className="neu-btn-primary w-full justify-center" onClick={() => window.close()}>
        Cerrar ventana
      </button>
    </motion.div>
  )
}

export default function CheckInSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
        <Suspense fallback={<div>Cargando...</div>}>
            <SuccessContent />
        </Suspense>
    </div>
  )
}