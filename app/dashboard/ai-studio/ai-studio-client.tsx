'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { Tables } from '@/types/supabase'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 10

interface UploadingFile {
  id: string
  name: string
  preview: string
  progress: 'uploading' | 'done' | 'error'
  error?: string
}

interface AiResult {
  selected_photo_url: string
  generated_copy: string
  ai_score: number
}

export default function AiStudioClient({ events }: { events: Tables<'events'>[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [photos, setPhotos] = useState<Tables<'photos'>[]>([])
  // Estado para la multi-selección
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  
  // Estado de Gemini AI
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Cargar fotos cuando se selecciona un evento
  useEffect(() => {
    if (selectedEventId) {
      setLoadingPhotos(true)
      setSelectedIds(new Set()) // limpiar selección al cambiar evento
      setAiResult(null) // ocultar resultados anteriores
      fetch(`/api/photos?event_id=${selectedEventId}`)
        .then((res) => res.json())
        .then((json) => setPhotos(json.data || []))
        .finally(() => setLoadingPhotos(false))
    } else {
      setPhotos([])
      setSelectedIds(new Set())
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
    const formData = new FormData()
    formData.append('event_id', selectedEventId)
    formData.append('file', file)

    const res = await fetch('/api/photos', { method: 'POST', body: formData })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error al subir')
    return json.data as Tables<'photos'>
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!selectedEventId) {
        alert('Selecciona un evento primero')
        return
      }

      const fileArr = Array.from(files)
      if (fileArr.length === 0) return

      // Crear entries de progreso
      const entries: UploadingFile[] = fileArr.map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        name: f.name,
        preview: URL.createObjectURL(f),
        progress: 'uploading' as const,
      }))
      setUploading((prev) => [...prev, ...entries])

      // Subir en paralelo
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

      // Limpiar done después de 2s
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
      
      // Actualizar UI
      setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)))
      setSelectedIds(new Set())
    } catch (err) {
      alert('Hubo un error al eliminar las fotos.')
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAnalyze = async () => {
    // Si hay seleccionadas, analizamos esas. Si no, todas.
    const targetPhotos = selectedIds.size > 0 
      ? photos.filter(p => selectedIds.has(p.id)) 
      : photos
      
    if (targetPhotos.length === 0) return

    setIsAnalyzing(true)
    setAiResult(null)

    try {
      const urls = targetPhotos.map(p => p.storage_url)
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_urls: urls }),
      })
      const json = await res.json()
      
      if (!res.ok) throw new Error(json.error || 'Error en Gemini AI')
      
      setAiResult(json.data as AiResult)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error desconocido de IA')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selector de evento */}
      <div>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          Selecciona un evento
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          style={{
            background: 'var(--surface)',
            border: 'none',
            borderRadius: 'var(--r-pill)',
            boxShadow: 'var(--shadow-soft-inset)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
            padding: '12px 20px',
            width: '100%',
            cursor: 'pointer',
          }}
        >
          <option value="">¿Cuál es tu evento?</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} — {new Date(event.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
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
                  Carga fotos del evento arriba
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
                        transition={{ duration: 0.2 }}
                        onClick={() => toggleSelection(photo.id)}
                        className="neu-card overflow-hidden flex flex-col gap-2 relative cursor-pointer"
                        style={{
                          padding: '10px',
                          boxShadow: isSelected ? 'var(--shadow-soft-inset)' : 'var(--shadow-soft-raised)',
                        }}
                      >
                        {/* CheckCircle cuando está seleccionada */}
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
                            alt="Foto del evento"
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
                          {photo.is_selected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                 stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Action Bar (Botón IA + Eliminar) */}
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
              <button
                className="neu-btn-primary flex-1 justify-center py-3"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                style={{ opacity: isAnalyzing ? 0.7 : 1 }}
              >
                {isAnalyzing ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeOpacity=".3"/>
                      <path d="M12 3a9 9 0 0 1 9 9"/>
                    </svg>
                    Analizando con IA...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    {selectedIds.size > 0 
                      ? `Analizar las ${selectedIds.size} fotos seleccionadas`
                      : `Analizar evento completo y crear Post`}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Resultado Gemini AI */}
          <AnimatePresence>
            {aiResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="neu-card mt-6 flex flex-col md:flex-row gap-6"
                style={{ padding: '32px' }}
              >
                {/* Foto Elegida */}
                <div className="w-full md:w-1/3 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <h3 style={{ fontFamily: 'var(--font-nunito)', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Foto Ganadora
                    </h3>
                  </div>
                  <div
                    className="rounded-xl overflow-hidden shadow-inner aspect-square"
                    style={{ boxShadow: 'var(--shadow-soft-inset)' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={aiResult.selected_photo_url}
                      alt="Mejor foto elegida por IA"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calidad IA:</p>
                    <span className="neu-badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      {aiResult.ai_score} / 100
                    </span>
                  </div>
                </div>

                {/* Copy Generado */}
                <div className="w-full md:w-2/3 flex flex-col gap-3">
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
        </>
      )}
    </div>
  )
}
