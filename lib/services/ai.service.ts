import { createAdminClient } from './../supabase/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Tables } from '@/types/supabase'

export interface AiAnalysisResult {
  selected_photos: {
    url: string;
    ai_score: number;
    reason: string;
  }[];
  generated_copy: string;
}

class AiService {
  async saveAnalysis(eventId: string, data: AiAnalysisResult): Promise<Tables<'ai_analyses'>> {
    const supabase = await createAdminClient()
    
    // Calcula score promedio de las fotos o toma el primero
    const ai_score = data.selected_photos.length > 0 
      ? Math.round(data.selected_photos.reduce((acc, p) => acc + p.ai_score, 0) / data.selected_photos.length) 
      : 0
    
    const urls = data.selected_photos.map(p => p.url)

    const payload = {
      event_id: eventId,
      selected_photo_urls: urls,
      generated_copy: data.generated_copy,
      ai_score,
      updated_at: new Date().toISOString()
    }

    const { data: upserted, error } = await supabase
      .from('ai_analyses')
      .upsert(payload, { onConflict: 'event_id' })
      .select()
      .single()

    if (error) {
      console.error('Error saving AI analysis to db:', error)
      throw new Error('No se pudo guardar el análisis de IA en la base de datos.')
    }
    
    return upserted
  }

  async getAnalysisByEventId(eventId: string): Promise<Tables<'ai_analyses'> | null> {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle()
      
    if (error) {
      console.error('Error fetching AI analysis:', error)
      return null
    }
    return data
  }

  async analyzePhotosAndGenerateCopy(
    imageUrls: string[],
    eventName?: string,
    eventDescription?: string,
    requestedPhotoCount: number = 3,
    customContext?: string
  ): Promise<AiAnalysisResult> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('La variable de entorno GEMINI_API_KEY no está configurada.')
    }

    if (imageUrls.length === 0) {
      throw new Error('No se enviaron fotos para analizar.')
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    
    // Gemini 1.5 Flash es perfecto para visión multimodal veloz (modificado a 3.5 en dev)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    })

    const promptText = `
      Actúa como Social Media Manager. Analiza la siguiente descripción del evento: '${eventDescription || ""}'. Si esta descripción contiene información, ES OBLIGATORIO que te bases en ella para redactar el copy del evento '${eventName || ""}'. Si está vacía, deduce el contexto solo por las imágenes. Adapta tu tono a la temática.
      A continuación, recibirás una serie de imágenes pertenecientes al evento. Tu tarea es:
      1. Debes seleccionar EXACTAMENTE ${requestedPhotoCount} fotos de la lista de URLs proporcionada. Ni más ni menos. Elige las de mejor calidad técnica, enfoque y composición. Excluye las borrosas.
      2. Para redactar el copy, básate en la descripción del evento '${eventDescription || ''}'. ADEMÁS, el usuario ha dado esta instrucción específica: '${customContext || ''}'. Si esta instrucción adicional no está vacía, es OBLIGATORIO que la incluyas y adaptes el tono a lo que pide. Si está vacía, genera el texto automáticamente basado en la descripción general. Redacta un copy atractivo para redes sociales (LinkedIn/Instagram) con emojis, un tono entusiasta pero profesional, e incluye hashtags relevantes.
      3. Asignar un AI Score a cada foto elegida del 0 al 100 y dar una pequeña razón ("reason") justificando por qué se eligió.
      
      Devuelve ESTRICTAMENTE un objeto JSON con la siguiente estructura y claves exactas.
      {
        "selected_photos": [
          {
            "url": "Coloca exactamente la URL de la foto que elegiste (las URLs están indicadas en el texto antes de cada imagen)",
            "ai_score": 90,
            "reason": "Por qué se eligió"
          }
        ],
        "generated_copy": "Tu texto redactado para el post aquí..."
      }
    `

    // Construimos el array Multimodal para Gemini
    const parts: any[] = [{ text: promptText }]

    for (const url of imageUrls) {
      try {
        const response = await fetch(url)
        if (!response.ok) continue
        
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mimeType = response.headers.get('content-type') || 'image/jpeg'

        // Le indicamos a Gemini la URL exacta para que la pueda devolver en el JSON
        parts.push({ text: `[FOTO CANDIDATA URL: ${url}]` })
        parts.push({
          inlineData: {
            data: buffer.toString('base64'),
            mimeType
          }
        })
      } catch (err) {
        console.warn(`Error procesando foto ${url} para Gemini:`, err)
      }
    }

    if (parts.length === 1) {
      throw new Error('No se pudo procesar ninguna de las fotos proporcionadas.')
    }

    // Ejecuta el modelo con reintento automático (exponential backoff)
    let retries = 0;
    const MAX_RETRIES = 3;
    let responseText = '';

    while (retries < MAX_RETRIES) {
      try {
        const result = await model.generateContent(parts)
        responseText = result.response.text()
        break; // Éxito!
      } catch (err: any) {
        if ((err.message.includes('503') || err.message.includes('Service Unavailable')) && retries < MAX_RETRIES - 1) {
          retries++;
          const delay = Math.pow(2, retries) * 1000;
          console.warn(`Error 503 en IA, reintentando en ${delay}ms (Intento ${retries}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        console.error('Error final de Gemini:', err);
        throw new Error('Fallo crítico al llamar a la API de IA: ' + err.message);
      }
    }

    try {
      const parsedData = JSON.parse(responseText) as AiAnalysisResult
      if (!Array.isArray(parsedData.selected_photos) || !parsedData.generated_copy) {
        throw new Error('El JSON devuelto por Gemini no tiene la estructura requerida.')
      }
      return parsedData
    } catch (parseError) {
      console.error('Error parseando JSON de Gemini:', responseText)
      throw new Error('Fallo al parsear el resultado de la IA.')
    }
  }
}

export const aiService = new AiService()
