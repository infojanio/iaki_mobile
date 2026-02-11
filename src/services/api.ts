import axios, { AxiosError } from 'axios'
import { AppError } from '../utils/AppError'
import {
  storageAuthTokenGet,
  storageAuthTokenSave,
  storageAuthTokenRemove,
} from '@storage/storageAuthToken'
import { signOutApp } from './authHelpers'
import { Platform } from 'react-native'

const baseURL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3333'
    : 'http://192.168.1.43:3333'

const api = axios.create({
  baseURL,
})

let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (error: any) => void
}[] = []

function processQueue(error: any, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })

  failedQueue = []
}

/**
 * 🔐 REQUEST — injeta access token
 */
api.interceptors.request.use(async (config) => {
  const stored = await storageAuthTokenGet()

  if (stored?.token && config.headers) {
    config.headers.Authorization = `Bearer ${stored.token}`
  }

  return config
})

/**
 * 🔁 RESPONSE — refresh automático
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config

    console.log(
      'AXIOS ERROR:',
      error.response?.status,
      error.config?.url,
      error.response?.data,
    )

    // ✅ QUALQUER ERRO DIFERENTE DE 401 → só rejeita
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // 🔁 proteção contra loop
    if (originalRequest._retry) {
      await storageAuthTokenRemove()
      signOutApp()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
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

      if (!stored?.refreshToken) {
        throw new Error('Refresh token inexistente')
      }

      const { data } = await api.post('/token/refresh', {
        refreshToken: stored.refreshToken,
      })

      const { accessToken, refreshToken } = data

      await storageAuthTokenSave({
        token: accessToken,
        refreshToken,
      })

      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
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

export { api }
