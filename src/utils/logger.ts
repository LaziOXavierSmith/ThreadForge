// Minimal timestamped logger. Swap for pino/winston in production.

const ts = () => new Date().toISOString().slice(11, 19)

export const logger = {
  info: (msg: string) => console.log(`[${ts()}] ℹ  ${msg}`),
  warn: (msg: string) => console.warn(`[${ts()}] ⚠  ${msg}`),
  success: (msg: string) => console.log(`[${ts()}] ✅ ${msg}`),
  error: (msg: string) => console.error(`[${ts()}] ❌ ${msg}`),
}
