'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { Tables } from '@/types/supabase'
import AddEventModal from './add-event-modal'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 10

const springConfig = { type: "spring" as const, stiffness: 400, damping: 25 }

interface UploadingFile {
  id: string
  name: string
  preview: string
  progress: 'uploading' | 'done' | 'error'
  error?: string
}

interface AiResult {
  selected_photos: {
    url: string;
    ai_score: number;
    reason: string;
  }[];
  generated_copy: string;
}

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const motionVal = useMotionValue(0)
  const springVal = useSpring(motionVal, { stiffness: 60, damping: 20 })
  const rounded = useTransform(springVal, (latest: number) => Math.round(latest))
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    motionVal.set(value)
  }, [value, motionVal])

  useEffect(() => {
    const unsub = rounded.on('change', (v: number) => setDisplay(v))
    return unsub
  }, [rounded])

  return <>{display}</>
}

function SpotlightCard({ children, className, style, onClick }: { 
  children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void 
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    cardRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    cardRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`spotlight-card ${className || ''}`}
      style={style}
    >
      {children}
    </div>
  )
}

export default function AiStudioClient({ events }: { events: Tables<'events'>[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null) // null = grid, 'general' = estudio libre, o uuid de evento
  
  const [photos, setPhotos] = useState<Tables<'photos'>[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  const [eventsData, setEventsData] = useState<Record<string, { photoCount: number, hasAi: boolean }>>({})
  const [generalStats, setGeneralStats] = useState<{ photoCount: number; hasAi: boolean }>({ photoCount: 0, hasAi: false })
  const [loadingGridDb, setLoadingGridDb] = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 1. Cargar estadísticas globales para el Grid de Eventos y Estudio Libre
  useEffect(() => {
    async function loadGridStats() {
      setLoadingGridDb(true)
      try {
        const stats: Record<string, { photoCount: number, hasAi: boolean }> = {}
        const [generalPhotosRes, generalAiRes] = await Promise.all([
          fetch(`/api/photos?event_id=general`).then(res => res.json()).catch(() => ({ data: [] })),
          fetch(`/api/ai/analyze?event_id=general`).then(res => res.json()).catch(() => ({ data: null }))
        ])
        setGeneralStats({
          photoCount: generalPhotosRes.data?.length || 0,
          hasAi: !!generalAiRes.data
        })

        for (const event of events) {
          const [photosRes, aiRes] = await Promise.all([
            fetch(`/api/photos?event_id=${event.id}`).then(res => res.json()),
            fetch(`/api/ai/analyze?event_id=${event.id}`).then(res => res.json())
          ])
          stats[event.id] = {
            photoCount: photosRes.data?.length || 0,
            hasAi: !!aiRes.data
          }
        }
        setEventsData(stats)
      } catch (err) {
        console.error("Error cargando estadísticas del grid:", err)
      } finally {
        setLoadingGridDb(false)
      }
    }
    loadGridStats()
  }, [events])

  // 2. Cargar fotos y análisis cuando se selecciona un evento o estudio libre ('general')
  useEffect(() => {
    if (selectedEventId) {
      setLoadingPhotos(true)
      setSelectedIds(new Set()) 
      setAiResult(null) 
      
      const queryId = selectedEventId === 'general' ? 'general' : selectedEventId
      
      Promise.all([
        fetch(`/api/photos?event_id=${queryId}`).then(res => res.json()),
        fetch(`/api/ai/analyze?event_id=${queryId}`).then(res => res.json())
      ]).then(([photosRes, aiRes]) => {
        setPhotos(photosRes.data || [])
        if (aiRes.data) {
          setAiResult(aiRes.data as AiResult)
        }
      }).finally(() => {
        setLoadingPhotos(false)
      })
    }
  }, [selectedEventId])

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Tipo no permitido: ${file.type}`
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Excede ${MAX_SIZE_MB} MB`
    }
    return null
  }

  const uploadFile = async (file: File): Promise<Tables<'photos'> | null> => {
    if (!selectedEventId) throw new Error('Contexto no seleccionado')
    const formData = new FormData()
    formData.append('event_id', selectedEventId) // puede ser 'general' o uuid
    formData.append('file', file)

    const res = await fetch('/api/photos', { method: 'POST', body: formData })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error al subir')
    return json.data as Tables<'photos'>
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!selectedEventId) {
        alert('Selecciona un espacio de estudio primero')
        return
      }

      const fileArr = Array.from(files)
      if (fileArr.length === 0) return

      const entries: UploadingFile[] = fileArr.map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        name: f.name,
        preview: URL.createObjectURL(f),
        progress: 'uploading' as const,
      }))
      setUploading((prev) => [...prev, ...entries])

      await Promise.all(
        fileArr.map(async (file, idx) => {
          const entry = entries[idx]
          const validationError = validateFile(file)

          if (validationError) {
            setUploading((prev) =>
              prev.map((u) =>
                u.id === entry.id ? { ...u, progress: 'error', error: validationError } : u
              )
            )
            return
          }

          try {
            const photo = await uploadFile(file)
            if (photo) {
              setPhotos((prev) => [photo, ...prev])
              if (selectedEventId === 'general') {
                setGeneralStats((prev) => ({ ...prev, photoCount: prev.photoCount + 1 }))
              } else if (selectedEventId) {
                setEventsData((prev) => ({
                  ...prev,
                  [selectedEventId]: {
                    ...prev[selectedEventId],
                    photoCount: (prev[selectedEventId]?.photoCount || 0) + 1
                  }
                }))
              }
            }
            setUploading((prev) =>
              prev.map((u) =>
                u.id === entry.id ? { ...u, progress: 'done' } : u
              )
            )
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error desconocido'
            setUploading((prev) =>
              prev.map((u) =>
                u.id === entry.id ? { ...u, progress: 'error', error: msg } : u
              )
            )
          }
        })
      )

      setTimeout(() => {
        setUploading((prev) => prev.filter((u) => u.progress !== 'done'))
      }, 2000)
    },
    [selectedEventId]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0 || isDeleting) return
    setIsDeleting(true)
    try {
      const idsArray = Array.from(selectedIds)
      const res = await fetch('/api/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsArray }),
      })
      if (!res.ok) throw new Error('Error al eliminar')
      
      setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)))
      if (selectedEventId === 'general') {
        setGeneralStats((prev) => ({ ...prev, photoCount: Math.max(0, prev.photoCount - selectedIds.size) }))
      } else if (selectedEventId) {
        setEventsData((prev) => ({
          ...prev,
          [selectedEventId]: {
            ...prev[selectedEventId],
            photoCount: Math.max(0, (prev[selectedEventId]?.photoCount || 0) - selectedIds.size)
          }
        }))
      }
      setSelectedIds(new Set())
    } catch (err) {
      alert('Hubo un error al eliminar las fotos.')
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAnalyze = async () => {
    const targetPhotos = selectedIds.size > 0 
      ? photos.filter(p => selectedIds.has(p.id)) 
      : photos
      
    if (targetPhotos.length === 0) return

    setIsAnalyzing(true)
    setAiResult(null)

    try {
      const urls = targetPhotos.map(p => p.storage_url)
      const selectedEvent = selectedEventId !== 'general' ? events.find(e => e.id === selectedEventId) : null
      
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrls: urls,
          eventName: selectedEvent?.title || 'Estudio Libre General',
          eventDescription: selectedEvent?.description || '',
          eventId: selectedEventId
        }),
      })
      const json = await res.json()
      
      if (!res.ok) throw new Error(json.error || 'Error en Gemini AI')
      
      setAiResult(json.data as AiResult)
      
      if (selectedEventId === 'general') {
        setGeneralStats((prev) => ({ ...prev, hasAi: true }))
      } else if (selectedEventId) {
        setEventsData((prev) => ({
          ...prev,
          [selectedEventId]: { ...prev[selectedEventId], hasAi: true },
        }))
      }
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido de IA')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const downloadImage = async (url: string, filename = 'imagen-estudio.jpg') => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Error al descargar imagen:', err)
      window.open(url, '_blank')
    }
  }

  const handleBackToGrid = () => {
    setSelectedEventId(null)
    setPhotos([])
    setSelectedIds(new Set())
    setAiResult(null)
  }

  const selectedEvent = selectedEventId && selectedEventId !== 'general' ? events.find(e => e.id === selectedEventId) : null

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {!selectedEventId ? (
          /* ================================================================
             VISTA 1: GRID PRINCIPAL (Estudio Libre + Eventos)
             ================================================================ */
          <motion.div
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            {loadingGridDb ? (
              <div className="neu-card flex items-center justify-center py-16">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                     stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
                     className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity=".3"/>
                  <path d="M12 3a9 9 0 0 1 9 9"/>
                </svg>
              </div>
            ) : (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* 1. Tarjeta Especial: Estudio Libre / General */}
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  transition={springConfig}
                  onClick={() => setSelectedEventId('general')}
                  className="spring-interactive"
                >
                  <SpotlightCard
                    className="neu-card cursor-pointer flex flex-col gap-4 border border-[var(--accent)]/30"
                    style={{ padding: '24px', background: 'var(--surface-raised)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="neu-badge-accent">IA Libre</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                        Estudio Libre General
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                        Crea contenido y analiza fotos con IA sin necesidad de vincularlas a un evento formal.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                           stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Fotos en galería: <strong><AnimatedCounter value={generalStats.photoCount} /></strong>
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      {generalStats.hasAi ? (
                        <span className="neu-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          Completado ✅
                        </span>
                      ) : generalStats.photoCount > 0 ? (
                        <span className="neu-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                          Pendiente ⏳
                        </span>
                      ) : (
                        <span className="neu-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                          Sin fotos 📷
                        </span>
                      )}
                      <div className="flex items-center gap-1" style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700 }}>
                        <span>Abrir</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>

                {/* 2. Tarjetas de Eventos Existentes */}
                {events.map((event) => {
                  const stats = eventsData[event.id]
                  const photoCount = stats?.photoCount ?? 0
                  const hasAi = stats?.hasAi ?? false
                  
                  return (
                    <motion.div
                      key={event.id}
                      layoutId={`event-card-${event.id}`}
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      transition={springConfig}
                      onClick={() => setSelectedEventId(event.id)}
                      className="spring-interactive"
                    >
                      <SpotlightCard
                        className="neu-card cursor-pointer flex flex-col gap-4"
                        style={{ padding: '24px' }}
                      >
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            {event.title}
                          </h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                            {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                               stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                          </svg>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Fotos en galería: <strong><AnimatedCounter value={photoCount} /></strong>
                          </span>
                        </div>

                        <div className="mt-auto">
                          {hasAi ? (
                            <span className="neu-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                              Completado ✅
                            </span>
                          ) : photoCount > 0 ? (
                            <span className="neu-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                              Pendiente ⏳
                            </span>
                          ) : (
                            <span className="neu-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                              Sin fotos 📷
                            </span>
                          )}
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  )
                })}

                {/* 3. Botón (+) Neumórfico para Añadir Evento */}
                <motion.button
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  transition={springConfig}
                  onClick={() => setIsAddModalOpen(true)}
                  className="neu-card flex flex-col items-center justify-center cursor-pointer min-h-[180px] spring-interactive"
                  style={{ background: 'var(--glass-bg)', padding: '24px' }}
                >
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                    style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-raised)' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                    Vincular evento al Estudio
                  </span>
                </motion.button>
              </div>
            )}
          </motion.div>
        ) : (
          /* ================================================================
             VISTA 2: ESTUDIO ACTIVO (Libre o por Evento)
             ================================================================ */
          <motion.div
            key="studio-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <motion.button
                onClick={handleBackToGrid}
                className="neu-btn spring-interactive"
                style={{ gap: 8 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                transition={springConfig}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Volver a la selección
              </motion.button>

              <div className="text-right">
                <h2 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  {selectedEventId === 'general' ? 'Estudio Libre / General' : selectedEvent?.title}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {selectedEventId === 'general' ? 'Espacio independiente de análisis con IA' : new Date(selectedEvent?.date || '').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Drop Zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-2xl flex flex-col items-center justify-center gap-4 py-12 px-6 transition-all"
            style={{
              background: 'var(--surface)',
              boxShadow: isDragging
                ? 'var(--shadow-soft-inset), 0 0 0 2px var(--accent)'
                : 'var(--shadow-soft-inset)',
              borderRadius: 'var(--r-xl)',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={onInputChange}
            />

            <motion.div
              animate={{ scale: isDragging ? 1.12 : 1, opacity: isDragging ? 0.8 : 1 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center w-16 h-16 rounded-full"
              style={{ boxShadow: 'var(--shadow-soft-raised)', background: 'var(--surface)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                   stroke={isDragging ? 'var(--accent)' : 'var(--text-muted)'}
                   strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </motion.div>

            <div className="text-center">
              <p style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '1rem', color: isDragging ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 4 }}>
                {isDragging ? 'Suelta las fotos aquí' : 'Arrastra fotos aquí'}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                JPG, PNG, WebP · máx. {MAX_SIZE_MB} MB
              </p>
            </div>

            {!isDragging && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                className="neu-btn-primary"
                style={{ fontSize: '0.85rem', padding: '8px 20px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Seleccionar fotos
              </button>
            )}
          </div>

          {/* Progreso de uploads */}
          <AnimatePresence>
            {uploading.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-2"
              >
                {uploading.map((u) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-flat)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 overflow-hidden"
                      style={{ boxShadow: 'var(--shadow-soft-inset)' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.preview} alt={u.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600,
                                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </p>
                      {u.error && (
                        <p style={{ fontSize: '0.72rem', color: '#ef4444' }}>{u.error}</p>
                      )}
                    </div>

                    {u.progress === 'uploading' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                           stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
                           className="animate-spin shrink-0">
                        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity=".3"/>
                        <path d="M12 3a9 9 0 0 1 9 9"/>
                      </svg>
                    )}
                    {u.progress === 'done' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                           stroke="#10b981" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                    {u.progress === 'error' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                           stroke="#ef4444" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid de fotos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Fotos subidas
              </h2>
              {!loadingPhotos && (
                <span className="neu-badge">{photos.length} foto{photos.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {loadingPhotos ? (
              <div className="neu-card flex items-center justify-center py-8">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
                     className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity=".3"/>
                  <path d="M12 3a9 9 0 0 1 9 9"/>
                </svg>
              </div>
            ) : photos.length === 0 ? (
              <div className="neu-card flex flex-col items-center py-14 gap-3">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                     stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Carga fotos arriba para empezar
                </p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                <AnimatePresence>
                  {photos.map((photo) => {
                    const isSelected = selectedIds.has(photo.id)
                    return (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: isSelected ? 0.96 : 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        transition={springConfig}
                        onClick={() => toggleSelection(photo.id)}
                        className="neu-card overflow-hidden flex flex-col gap-2 relative cursor-pointer spring-interactive"
                        style={{
                          padding: '10px',
                          boxShadow: isSelected ? 'var(--shadow-soft-inset)' : 'var(--shadow-soft-raised)',
                        }}
                      >
                        {isAnalyzing && (selectedIds.size === 0 || selectedIds.has(photo.id)) && (
                          <div className="ai-scan-overlay" />
                        )}
                        {isSelected && (
                          <div className="absolute top-4 right-4 z-10 w-6 h-6 rounded-full flex items-center justify-center"
                               style={{ background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-soft-raised)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          </div>
                        )}

                        <div
                          className="rounded-xl overflow-hidden aspect-square relative"
                          style={{ boxShadow: 'var(--shadow-soft-inset)' }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.storage_url}
                            alt="Foto"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            style={{ opacity: isSelected ? 0.85 : 1, transition: 'opacity 0.2s' }}
                          />
                        </div>

                        <div className="flex items-center justify-between px-1">
                          {photo.ai_score !== null ? (
                            <span className="neu-badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '0.65rem' }}>
                              IA: {photo.ai_score}/100
                            </span>
                          ) : (
                            <span className="neu-badge" style={{ fontSize: '0.65rem' }}>
                              Sin score IA
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {photos.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {selectedIds.size > 0 && (
                <button
                  className="neu-btn"
                  onClick={deleteSelected}
                  disabled={isDeleting}
                  style={{ color: '#ef4444' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  {isDeleting ? 'Eliminando...' : `Eliminar seleccionadas (${selectedIds.size})`}
                </button>
              )}
              <motion.button
                className="neu-btn-primary flex-1 justify-center py-3 spring-interactive"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                whileHover={isAnalyzing ? undefined : { scale: 1.02 }}
                whileTap={isAnalyzing ? undefined : { scale: 0.97 }}
                transition={springConfig}
                style={{ opacity: isAnalyzing ? 0.85 : 1, position: 'relative', overflow: 'hidden' }}
              >
                {isAnalyzing && (
                  <motion.div
                    className="ai-gradient-pulse"
                    style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: 0 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                  />
                )}
                {isAnalyzing ? (
                  <span className="relative z-10 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity=".3"/>
                      <path d="M12 3a9 9 0 0 1 9 9"/>
                    </svg>
                    Analizando con IA...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    {selectedIds.size > 0 
                      ? `Analizar las ${selectedIds.size} fotos seleccionadas`
                      : aiResult ? `Volver a analizar con IA` : `Analizar y crear post`}
                  </span>
                )}
              </motion.button>
            </div>
          )}

          {/* Resultado Gemini AI */}
          <AnimatePresence>
            {aiResult && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="neu-card mt-6 flex flex-col md:flex-row gap-6"
                style={{ padding: '32px' }}
              >
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <h3 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Top Fotos ({aiResult.selected_photos.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {aiResult.selected_photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 rounded-xl p-3"
                        style={{ background: 'var(--surface-deep)', boxShadow: 'var(--shadow-soft-inset)' }}
                      >
                        <div
                          className="rounded-lg overflow-hidden aspect-square"
                          style={{ boxShadow: 'var(--shadow-soft-raised)' }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={`Foto seleccionada ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="neu-badge flex items-center justify-center p-0" style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '0.7rem', padding: '2px 6px' }}>
                            Score: {photo.ai_score}
                          </span>
                          <button
                            onClick={() => downloadImage(photo.url, `top-${idx + 1}.jpg`)}
                            className="neu-btn"
                            style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                            title="Descargar"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </button>
                        </div>
                        {photo.reason && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                            {photo.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <h3 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Copy sugerido para Redes Sociales
                  </h3>
                  <div
                    className="flex-1 rounded-2xl p-5"
                    style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-soft-inset)' }}
                  >
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {aiResult.generated_copy}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(aiResult.generated_copy)}
                    className="neu-btn self-end"
                    style={{ fontSize: '0.8rem', marginTop: 8 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copiar texto
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddEventModal
            events={events}
            onConfirm={(eventId) => {
              setSelectedEventId(eventId)
              setIsAddModalOpen(false)
            }}
            onClose={() => setIsAddModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
