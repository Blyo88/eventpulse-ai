import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { Tables } from '@/types/supabase'

const BUCKET = 'event_photos'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

class PhotoService {
  /** Sube un archivo al bucket de Storage y registra la metadata en la tabla photos. */
  async uploadPhoto(
    eventId: string,
    file: File
  ): Promise<Tables<'photos'>> {
    // Validaciones
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `Tipo de archivo no permitido: ${file.type}. Acepta: ${ALLOWED_TYPES.join(', ')}`
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `El archivo excede el límite de ${MAX_FILE_SIZE / 1024 / 1024} MB`
      )
    }

    const supabase = createAdminClient()

    // Generar path único: event_photos/<event_id>/<timestamp>_<filename>
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${eventId}/${timestamp}_${safeName}`

    // Subir al bucket
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Error al subir archivo: ${uploadError.message}`)
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    const storageUrl = urlData.publicUrl

    // Registrar metadata en la tabla photos
    const { data, error: insertError } = await supabase
      .from('photos')
      .insert({
        event_id: eventId,
        storage_url: storageUrl,
        is_selected: false,
      })
      .select()
      .single()

    if (insertError) {
      // Limpiar el archivo si falla el registro
      await supabase.storage.from(BUCKET).remove([storagePath])
      throw new Error(`Error al registrar foto: ${insertError.message}`)
    }

    return data
  }

  /** Lista fotos de un evento ordenadas por fecha descendente. */
  async getPhotosByEventId(eventId: string): Promise<Tables<'photos'>[]> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error al obtener fotos: ${error.message}`)
    return data || []
  }

  /** Elimina varias fotos del storage y de la tabla por array de IDs. */
  async deletePhotos(photoIds: string[]): Promise<void> {
    if (photoIds.length === 0) return
    const supabase = createAdminClient()

    // 1. Obtener la URL para extraer el path del storage
    const { data: photos, error: fetchError } = await supabase
      .from('photos')
      .select('storage_url')
      .in('id', photoIds)

    if (fetchError) throw new Error(`Fotos no encontradas (búsqueda): ${fetchError.message}`)

    // 2. Extraer paths del storage desde las URLs públicas
    const paths = photos.map((photo) => {
      const url = new URL(photo.storage_url)
      const bucketPrefix = `/storage/v1/object/public/${BUCKET}/`
      const idx = url.pathname.indexOf(bucketPrefix)
      if (idx !== -1) {
        return decodeURIComponent(url.pathname.slice(idx + bucketPrefix.length))
      }
      return null
    }).filter((p): p is string => p !== null)

    // 3. Eliminar archivos físicos del Bucket
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths)
      if (storageError) {
        console.error('Error limpiando bucket:', storageError.message)
        // Continuamos para intentar borrar en la tabla de todos modos
      }
    }

    // 4. Eliminar registros de la BD
    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .in('id', photoIds)

    if (deleteError) throw new Error(`Error al eliminar filas en base de datos: ${deleteError.message}`)
  }

  /** Actualizar score de IA (preparación para Sprint futuro). */
  async updateAiScore(
    photoId: string,
    aiScore: number,
    category: string | null
  ): Promise<Tables<'photos'>> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('photos')
      .update({ ai_score: aiScore, category: category as Tables<'photos'>['category'] })
      .eq('id', photoId)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar score: ${error.message}`)
    return data
  }
}

export const photoService = new PhotoService()
