import { ReactNode, createContext, useEffect, useState } from 'react'
import { setSignOutCallback } from '@services/authHelpers'

import {
  storageAuthTokenSave,
  storageAuthTokenGet,
  storageAuthTokenRemove,
} from '@storage/storageAuthToken'
import {
  storageUserSave,
  storageUserGet,
  storageUserRemove,
} from '@storage/storageUser'

import { UserDTO } from '@dtos/UserDTO'
import { api } from '@services/api'

export type AuthContextDataProps = {
  user: UserDTO
  userId: string
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<UserDTO>
  signOut: () => Promise<void>
  updateToken: (token: string, refreshToken?: string) => Promise<void>
  isLoadingUserStorageData: boolean
}

type AuthContextProviderProps = {
  children: ReactNode
}

export const AuthContext = createContext<AuthContextDataProps>(
  {} as AuthContextDataProps,
)

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<UserDTO>({} as UserDTO)
  const [isLoadingUserStorageData, setIsLoadingUserStorageData] = useState(true)

  const userId = user?.id ?? ''

  async function userAndTokenUpdate(userData: UserDTO, token: string) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
  }

  async function updateToken(token: string, refreshToken?: string) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    if (refreshToken) {
      await storageAuthTokenSave({ token, refreshToken })
    }
  }

  async function storageUserAndTokenSave(
    userData: UserDTO,
    token: string,
    refreshToken: string,
  ) {
    await storageUserSave(userData)
    await storageAuthTokenSave({ token, refreshToken })
  }

  async function signIn(email: string, password: string): Promise<UserDTO> {
    const { data } = await api.post('/sessions', { email, password })

    if (!data.user || !data.accessToken || !data.refreshToken) {
      throw new Error('Dados inválidos retornados da API!')
    }

    await storageUserAndTokenSave(
      data.user,
      data.accessToken,
      data.refreshToken,
    )

    await userAndTokenUpdate(data.user, data.accessToken)

    return data.user
  }

  async function signOut() {
    setUser({} as UserDTO)
    await storageUserRemove()
    await storageAuthTokenRemove()
    delete api.defaults.headers.common['Authorization']
  }

  async function loadUserData() {
    try {
      setIsLoadingUserStorageData(true)

      const userLogged = await storageUserGet()
      const storedToken = await storageAuthTokenGet()

      if (storedToken?.token && userLogged?.id) {
        await userAndTokenUpdate(userLogged, storedToken.token)
      } else {
        setUser({} as UserDTO)
      }
    } finally {
      setIsLoadingUserStorageData(false)
    }
  }

  useEffect(() => {
    setSignOutCallback(signOut)
    loadUserData()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        isAdmin: user?.role === 'ADMIN',
        signIn,
        signOut,
        updateToken,
        isLoadingUserStorageData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
