import { api } from './api'

export interface ForgotPasswordResponse {
  message: string
  challenge: string
}

interface ForgotPasswordParams {
  email: string
}

interface ResetPasswordParams {
  challenge: string
  code: string
  newPassword: string
}

export async function forgotPassword({ email }: ForgotPasswordParams) {
  const response = await api.post<ForgotPasswordResponse>('/password/forgot', {
    email,
  })

  return response.data
}

export async function resetPassword({
  challenge,
  code,
  newPassword,
}: ResetPasswordParams) {
  const response = await api.post<{
    message: string
  }>('/password/reset', {
    challenge,
    code,
    newPassword,
  })

  return response.data
}
