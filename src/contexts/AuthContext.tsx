import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react'

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

  /*
   * Atualiza usuário no contexto
   * e também no AsyncStorage.
   */
  updateUser: (userData: Partial<UserDTO>) => Promise<UserDTO>

  /*
   * Busca novamente o usuário
   * atualizado no backend.
   */
  refreshUser: () => Promise<UserDTO | null>

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

  /* =====================================
     USUÁRIO + TOKEN
  ===================================== */

  const userAndTokenUpdate = useCallback(
    async (userData: UserDTO, token: string) => {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      setUser(userData)
    },
    [],
  )

  /* =====================================
     ATUALIZAR USUÁRIO LOCAL
  ===================================== */

  const updateUser = useCallback(
    async (userData: Partial<UserDTO>): Promise<UserDTO> => {
      /*
       * Mescla o usuário atual
       * com os novos dados.
       */
      const updatedUser = {
        ...user,
        ...userData,
      } as UserDTO

      /*
       * Atualiza imediatamente
       * todas as telas que usam useAuth().
       */
      setUser(updatedUser)

      /*
       * Persiste para manter os
       * dados corretos após fechar
       * e abrir o aplicativo.
       */
      await storageUserSave(updatedUser)

      return updatedUser
    },
    [user],
  )

  /* =====================================
     RECARREGAR PERFIL DO BACKEND
  ===================================== */

  const refreshUser = useCallback(async (): Promise<UserDTO | null> => {
    try {
      const response = await api.get('/users/profile')

      const profile = response.data?.user ?? response.data

      if (!profile?.id) {
        console.warn('[AuthContext] Perfil retornado sem ID')

        return null
      }

      const updatedUser = {
        ...user,
        ...profile,
      } as UserDTO

      setUser(updatedUser)

      await storageUserSave(updatedUser)

      return updatedUser
    } catch (error: any) {
      console.error('[AuthContext] Erro ao atualizar perfil:', {
        message: error?.message,

        code: error?.code,

        status: error?.response?.status,

        data: error?.response?.data,
      })

      throw error
    }
  }, [user])

  /* =====================================
     TOKEN
  ===================================== */

  async function updateToken(token: string, refreshToken?: string) {
    if (!token) {
      throw new Error('Token de acesso não informado.')
    }

    /*
     * Primeiro atualiza o Axios.
     *
     * Dessa forma as próximas requisições
     * já utilizam o novo token.
     */
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    try {
      const storedTokens = await storageAuthTokenGet()

      const currentRefreshToken = refreshToken ?? storedTokens?.refreshToken

      if (!currentRefreshToken) {
        console.warn(
          '[AuthContext] Refresh token não disponível para persistência.',
        )

        return
      }

      await storageAuthTokenSave({
        token,

        refreshToken: currentRefreshToken,
      })

      console.log('[AuthContext] Tokens atualizados com sucesso.')
    } catch (error) {
      console.error(
        '[AuthContext] Erro ao persistir tokens atualizados:',
        error,
      )

      /*
       * Não removemos o token do Axios.
       *
       * Ele continua válido para a sessão
       * atual mesmo se houver uma falha
       * pontual no armazenamento local.
       */
    }
  }

  /* =====================================
     SALVAR LOGIN
  ===================================== */

  const storageUserAndTokenSave = useCallback(
    async (userData: UserDTO, token: string, refreshToken: string) => {
      await storageUserSave(userData)

      await storageAuthTokenSave({
        token,
        refreshToken,
      })
    },
    [],
  )

  /* =====================================
     LOGIN
  ===================================== */

  const signIn = useCallback(
    async (email: string, password: string): Promise<UserDTO> => {
      const { data } = await api.post('/sessions', {
        email,
        password,
      })

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
    },
    [storageUserAndTokenSave, userAndTokenUpdate],
  )

  /* =====================================
     LOGOUT
  ===================================== */

  const signOut = useCallback(async () => {
    /*
     * Primeiro remove o token
     * usado pelo Axios.
     */
    delete api.defaults.headers.common['Authorization']

    /*
     * Limpa contexto imediatamente.
     */
    setUser({} as UserDTO)

    /*
     * Depois remove os dados
     * persistidos.
     */
    await Promise.all([storageUserRemove(), storageAuthTokenRemove()])
  }, [])

  /* =====================================
     CARREGAR LOGIN SALVO
  ===================================== */

  const loadUserData = useCallback(async () => {
    try {
      setIsLoadingUserStorageData(true)

      const [userLogged, storedToken] = await Promise.all([
        storageUserGet(),

        storageAuthTokenGet(),
      ])

      if (storedToken?.token && userLogged?.id) {
        await userAndTokenUpdate(userLogged, storedToken.token)

        return
      }

      setUser({} as UserDTO)
    } catch (error) {
      console.error('[AuthContext] Erro ao carregar dados salvos:', error)

      setUser({} as UserDTO)
    } finally {
      setIsLoadingUserStorageData(false)
    }
  }, [userAndTokenUpdate])

  /* =====================================
     INICIALIZAÇÃO
  ===================================== */

  useEffect(() => {
    setSignOutCallback(signOut)

    void loadUserData()
  }, [loadUserData, signOut])

  /* =====================================
     PROVIDER
  ===================================== */

  return (
    <AuthContext.Provider
      value={{
        user,

        userId,

        isAdmin: user?.role === 'ADMIN',

        signIn,

        signOut,

        updateToken,

        updateUser,

        refreshUser,

        isLoadingUserStorageData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
