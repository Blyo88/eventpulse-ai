import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AiAnalysisResult {
  selected_photos: {
    url: string;
    ai_score: number;
    reason: string;
  }[];
  generated_copy: string;
}

class AiService {
  async analyzePhotosAndGenerateCopy(imageUrls: string[], eventName?: string, eventDescription?: string): Promise<AiAnalysisResult> {
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
      1. Analiza todas las fotos. Selecciona un TOP de las mejores (mínimo 1, máximo 4, según la cantidad y calidad). Excluye las borrosas.
      2. Redactar un copy atractivo para redes sociales (LinkedIn/Instagram) resumiendo el éxito del evento, basado en lo que ves y el contexto. Usa emojis, un tono entusiasta pero profesional, e incluye hashtags relevantes.
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

    // Ejecuta el modelo
    const result = await model.generateContent(parts)
    const responseText = result.response.text()

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
