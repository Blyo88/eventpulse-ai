'use client'

import { useState, useCallback, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { Tables } from '@/types/supabase'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_MB = 10

interface PhotoGalleryProps {
  eventId: string
  initialPhotos: Tables<'photos'>[]
}

interface UploadingFile {
  id: string
  name: string
  preview: string
  progress: 'uploading' | 'done' | 'error'
  error?: string
}

export default function PhotoGallery({ eventId, initialPhotos }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

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
    formData.append('event_id', eventId)
    formData.append('file', file)

    const res = await fetch('/api/photos', { method: 'POST', body: formData })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error al subir')
    return json.data as Tables<'photos'>
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
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
    [eventId]
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

  return (
    <div className="flex flex-col gap-6">
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
            o haz click para seleccionar · JPG, PNG, WebP · máx. {MAX_SIZE_MB} MB
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

      {/* Progreso de uploads en curso */}
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
                {/* Thumbnail */}
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

                {/* Estado */}
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
      {photos.length === 0 && uploading.length === 0 ? (
        <div className="neu-card flex flex-col items-center py-14 gap-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
               stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Sube la primera foto de este evento
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="neu-card overflow-hidden flex flex-col gap-2"
                style={{ padding: '10px' }}
              >
                {/* Imagen */}
                <div
                  className="rounded-xl overflow-hidden aspect-square"
                  style={{ boxShadow: 'var(--shadow-soft-inset)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.storage_url}
                    alt="Foto del evento"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Meta */}
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
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
