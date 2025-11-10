import AsyncStorage from '@react-native-async-storage/async-storage'
import { AUTH_TOKEN_STORAGE } from '@storage/storageConfig'

type StorageAuthTokenProps = {
  token: string
  refreshToken: string
}

export async function storageAuthTokenSave({
  token,
  refreshToken,
}: StorageAuthTokenProps) {
  await AsyncStorage.setItem(
    AUTH_TOKEN_STORAGE,
    JSON.stringify({ token, refreshToken }),
  )
}

export async function storageAuthTokenGet(): Promise<StorageAuthTokenProps> {
  const response = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE)

  if (!response) {
    return { token: '', refreshToken: '' }
  }

  try {
    const { token, refreshToken } = JSON.parse(response)

    return {
      token: token ?? '',
      refreshToken: refreshToken ?? '',
    }
  } catch (error) {
    console.error('[storageAuthTokenGet] Erro ao fazer parse do token:', error)
    return { token: '', refreshToken: '' }
  }
}

export async function storageAuthTokenRemove() {
  await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE)
}
