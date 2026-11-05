'use client'

import { useSearchParams } from 'next/navigation'

export function LoginNotice() {
  const params = useSearchParams()
  let message: string | null = null
  let isError = false

  if (params.get('verified') === 'true') {
    message = '¡Email verificado! Ya puedes iniciar sesión.'
  } else if (params.get('registered') === 'true') {
    message = 'Cuenta creada. Revisa tu email y haz clic en el enlace de verificación.'
  } else if (params.get('verify_error')) {
    message = 'El enlace de verificación no es válido o ha expirado. Intenta registrarte de nuevo.'
    isError = true
  }

  if (!message) return null

  return (
    <div
      className="mb-5 p-3 text-sm text-center"
      style={{
        background: isError ? 'rgba(240, 113, 103, 0.12)' : 'rgba(72, 187, 120, 0.12)',
        color: isError ? '#e53e3e' : '#2f855a',
        borderRadius: 'var(--r-md)',
      }}
    >
      {message}
    </div>
  )
}
