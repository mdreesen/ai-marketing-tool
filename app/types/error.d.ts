export interface NuxtError {
    status: number
    fatal: boolean
    unhandled: boolean
    statusText?: string
    data?: unknown
    cause?: unknown
    // legacy/deprecated equivalent of `status`
    statusCode: number
    // legacy/deprecated equivalent of `statusText`
    statusMessage?: string
  }