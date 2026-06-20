const MAX_RETRIES = 10
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30000

export async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      console.log(`[${label}] Intento ${attempt}/${MAX_RETRIES} fallo: ${err instanceof Error ? err.message : err}`)

      if (attempt < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS)
        console.log(`[${label}] Reintentando en ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`${label}: agotados ${MAX_RETRIES} reintentos. Ultimo error: ${lastError instanceof Error ? lastError.message : lastError}`)
}
