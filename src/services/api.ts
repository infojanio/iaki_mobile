import axios, { AxiosError } from 'axios'
import { AppError } from '../utils/AppError'
import {
  storageAuthTokenGet,
  storageAuthTokenSave,
  storageAuthTokenRemove,
} from '@storage/storageAuthToken'
import { signOutApp } from './authHelpers'

const api = axios.create({
  baseURL: 'http://192.168.1.43:3333', // substitua pelo seu IP http://192.168.3.70:3333
  //baseURL: 'https://iaki-backend-production.up.railway.app', // use https!
  timeout: 10000,
})

let isRefreshing = false
let failedQueue: any[] = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.request.use(async (config) => {
  const { token } = await storageAuthTokenGet()
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    const tokenExpired =
      error.response?.status === 401 &&
      (error.response?.data as { message?: string })?.message ===
        'token.expired'
    console.log('recado', error.response?.data)

    if (tokenExpired && !originalRequest._retry) {
      originalRequest._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        try {
          const { refreshToken } = await storageAuthTokenGet()

          const { data } = await api.post('/token/refresh', {
            refreshToken,
          })

          await storageAuthTokenSave({
            token: data.accessToken,
            refreshToken: data.refreshToken,
          })

          api.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${data.accessToken}`

          originalRequest.headers[
            'Authorization'
          ] = `Bearer ${data.accessToken}`

          failedQueue.forEach((request) => {
            request.resolve(data.accessToken)
          })

          failedQueue = []

          return api(originalRequest)
        } catch (refreshError) {
          failedQueue.forEach((request) => {
            request.reject(refreshError)
          })

          failedQueue = []
          await storageAuthTokenRemove()
          signOutApp() // 👈 chama o signOut do contexto
        } finally {
          isRefreshing = false
        }
      }

      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            }
            resolve(api(originalRequest))
          },
          reject: (err: any) => reject(err), // 👈 aqui coloque `(err: any)` para corrigir o erro do TS
        })
      })
    }

    if (error.response && error.response.data) {
      return Promise.reject(
        new AppError((error.response.data as { message: string }).message),
      )
    } else {
      return Promise.reject(error)
    }
  },
)

export { api }
