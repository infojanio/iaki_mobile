import axios, { AxiosError } from 'axios'
import {
  storageAuthTokenGet,
  storageAuthTokenSave,
  storageAuthTokenRemove,
} from '@storage/storageAuthToken'
import { signOutApp } from './authHelpers'

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://iakibackend-production.up.railway.app'

export const api = axios.create({
  baseURL,
  timeout: 10000,
})

let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (error: any) => void
}[] = []

function processQueue(error: any, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

// 🔐 REQUEST — injeta access token
api.interceptors.request.use(async (config) => {
  const stored = await storageAuthTokenGet()

  if (stored?.token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${stored.token}`
  }

  return config
})

// 🔁 RESPONSE — refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config

    // log útil
    console.log('AXIOS ERROR:', {
      message: error.message,
      code: (error as any)?.code,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      data: error.response?.data,
    })

    // Se não for 401, não tenta refresh
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // Proteção contra loop infinito
    if (originalRequest?._retry) {
      await storageAuthTokenRemove()
      signOutApp()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    // Se já tem refresh em andamento, enfileira
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    isRefreshing = true

    try {
      const stored = await storageAuthTokenGet()
      if (!stored?.refreshToken) throw new Error('Refresh token inexistente')

      // ⚠️ usa axios "puro" pra não cair no interceptor e evitar Authorization expirado
      const { data } = await axios.post(
        `${baseURL}/token/refresh`,
        { refreshToken: stored.refreshToken },
        { timeout: 10000 },
      )

      const accessToken = data?.accessToken ?? data?.token
      const refreshToken = data?.refreshToken

      if (!accessToken || !refreshToken) {
        throw new Error('Resposta do refresh inválida (faltando tokens)')
      }

      await storageAuthTokenSave({ token: accessToken, refreshToken })

      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
      originalRequest.headers = originalRequest.headers ?? {}
      originalRequest.headers.Authorization = `Bearer ${accessToken}`

      processQueue(null, accessToken)
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      await storageAuthTokenRemove()
      signOutApp()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
