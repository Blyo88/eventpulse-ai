import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AiAnalysisResult {
  selected_photo_url: string
  generated_copy: string
  ai_score: number
}

class AiService {
  async analyzePhotosAndGenerateCopy(photoUrls: string[]): Promise<AiAnalysisResult> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('La variable de entorno GEMINI_API_KEY no está configurada.')
    }

    if (photoUrls.length === 0) {
      throw new Error('No se enviaron fotos para analizar.')
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    
    // Gemini 1.5 Flash es perfecto para visión multimodal veloz
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    })

    const promptText = `
      Actúa como el Comunicador Social y Community Manager de un evento tecnológico.
      A continuación, recibirás una serie de imágenes pertenecientes al evento. Tu tarea es:
      1. Evaluar todas las fotos y ELEGIR LA MEJOR (busca la más nítida, iluminada, dinámica y que represente el "éxito" o "vibe" tecnológico del evento).
      2. Redactar un copy atractivo para redes sociales (LinkedIn/Instagram) resumiendo el éxito del evento, basado en lo que ves. Usa emojis, un tono entusiasta pero profesional, e incluye hashtags relevantes.
      3. Asignar un AI Score a la foto elegida del 0 al 100, justificando internamente su calidad métrica.
      
      Devuelve ESTRICTAMENTE un objeto JSON con la siguiente estructura y claves exactas.
      {
        "selected_photo_url": "Coloca exactamente la URL de la foto que elegiste (las URLs están indicadas en el texto antes de cada imagen)",
        "generated_copy": "Tu texto redactado para el post aquí...",
        "ai_score": 95
      }
    `

    // Construimos el array Multimodal para Gemini
    const parts: any[] = [{ text: promptText }]

    for (const url of photoUrls) {
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

    // Ejecuta el modelo
    const result = await model.generateContent(parts)
    const responseText = result.response.text()

    try {
      const parsedData = JSON.parse(responseText) as AiAnalysisResult
      if (!parsedData.selected_photo_url || !parsedData.generated_copy || typeof parsedData.ai_score !== 'number') {
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
