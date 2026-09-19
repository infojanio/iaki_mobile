import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { api } from '@services/api'

import { useAuth } from '@hooks/useAuth'

import { BannerDTO } from '@dtos/BannerDTO'

export type City = {
  id: string
  name: string
  uf: string
}

export type CityContextData = {
  city: City | null
  cityBanners: BannerDTO[]

  isLoading: boolean
  isSyncingCity: boolean

  fetchUserCity: () => Promise<void>

  setUserCity: (city: City) => Promise<void>

  refreshCityBanners: () => Promise<void>

  clearCity: () => void
}

export const CityContext = createContext({} as CityContextData)

type CityProviderProps = {
  children: ReactNode
}

/* ==============================
   CONFIGURAÇÕES
============================== */

const CITY_SYNC_ATTEMPTS = 3

const CITY_SYNC_TIMEOUT = 30000

/* ==============================
   HELPERS
============================== */

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function isNetworkError(error: any) {
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.message === 'Network Error' ||
    error?.code === 'ECONNABORTED'
  )
}

/* ==============================
   PROVIDER
============================== */

export function CityProvider({ children }: CityProviderProps) {
  const { userId } = useAuth()

  const [city, setCity] = useState<City | null>(null)

  const [cityBanners, setCityBanners] = useState<BannerDTO[]>([])

  const [isLoading, setIsLoading] = useState(false)

  const [isSyncingCity, setIsSyncingCity] = useState(false)

  /*
   * Evita que respostas antigas
   * sobrescrevam uma seleção
   * mais recente.
   */
  const citySyncRequestRef = useRef(0)

  /*
   * Evita atualização após
   * desmontagem do provider.
   */
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      citySyncRequestRef.current += 1
    }
  }, [])

  /* ==============================
     BANNERS
  ============================== */

  const refreshCityBanners = useCallback(async () => {
    const cityId = city?.id

    if (!cityId) {
      if (isMountedRef.current) {
        setCityBanners([])
      }

      return
    }

    try {
      const response = await api.get(`/banners/city/${cityId}`, {
        timeout: 30000,
      })

      if (!isMountedRef.current) {
        return
      }

      const responseBanners =
        response.data?.data ?? response.data?.banners ?? response.data ?? []

      const banners = Array.isArray(responseBanners) ? responseBanners : []

      /*
       * Máximo de 3 banners
       * para reduzir carga
       * de imagens na Home.
       */
      const shuffled = [...banners].sort(() => Math.random() - 0.5)

      setCityBanners(shuffled.slice(0, 3))
    } catch (error: any) {
      console.error('[CityContext] Erro ao carregar banners:', {
        message: error?.message,

        code: error?.code,

        status: error?.response?.status,

        data: error?.response?.data,
      })

      /*
       * Falha de banner não
       * deve afetar a cidade.
       */
      if (isMountedRef.current) {
        setCityBanners([])
      }
    }
  }, [city?.id])

  /* ==============================
     ATUALIZA BANNERS
  ============================== */

  useEffect(() => {
    if (city?.id) {
      void refreshCityBanners()

      return
    }

    setCityBanners([])
  }, [city?.id, refreshCityBanners])

  /* ==============================
     SINCRONIZAR CIDADE
  ============================== */

  const setUserCity = useCallback(
    async (selectedCity: City) => {
      if (!selectedCity?.id) {
        throw new Error('Cidade inválida')
      }

      if (!userId) {
        throw new Error('Usuário não autenticado')
      }

      const requestId = ++citySyncRequestRef.current

      if (isMountedRef.current) {
        setIsSyncingCity(true)
      }

      let lastError: any = null

      try {
        for (let attempt = 1; attempt <= CITY_SYNC_ATTEMPTS; attempt++) {
          /*
           * Outra cidade foi
           * selecionada depois.
           */
          if (requestId !== citySyncRequestRef.current) {
            return
          }

          try {
            const startedAt = Date.now()

            console.log(
              `[CityContext] Sincronizando cidade - tentativa ${attempt}/${CITY_SYNC_ATTEMPTS}`,
            )

            const response = await api.patch(
              '/users/city',
              {
                cityId: selectedCity.id,
              },
              {
                timeout: CITY_SYNC_TIMEOUT,
              },
            )

            if (
              requestId !== citySyncRequestRef.current ||
              !isMountedRef.current
            ) {
              return
            }

            console.log(
              `[CityContext] Cidade sincronizada em ${
                Date.now() - startedAt
              }ms`,
              {
                cityId: selectedCity.id,

                status: response.status,
              },
            )

            /*
             * PONTO PRINCIPAL:
             *
             * só atualizamos
             * o contexto depois
             * que o backend
             * confirmou.
             */
            setCity({
              id: selectedCity.id,

              name: selectedCity.name,

              uf: selectedCity.uf ?? '',
            })

            return
          } catch (error: any) {
            lastError = error

            console.log(
              `[CityContext] Falha ao sincronizar cidade - tentativa ${attempt}:`,
              {
                message: error?.message,

                code: error?.code,

                status: error?.response?.status,

                data: error?.response?.data,
              },
            )

            /*
             * Se o backend respondeu
             * 400, 401, 403, 500 etc.,
             * não ficamos repetindo
             * indiscriminadamente.
             */
            if (!isNetworkError(error)) {
              throw error
            }

            /*
             * Última tentativa.
             */
            if (attempt === CITY_SYNC_ATTEMPTS) {
              break
            }

            /*
             * Backoff:
             *
             * tentativa 1
             *   ↓ 800 ms
             *
             * tentativa 2
             *   ↓ 1800 ms
             *
             * tentativa 3
             */
            const delay = attempt === 1 ? 800 : 1800

            await wait(delay)
          }
        }

        /*
         * As três tentativas
         * falharam.
         *
         * IMPORTANTE:
         * relança para SelectCity.
         */
        throw lastError ?? new Error('Não foi possível sincronizar a cidade')
      } finally {
        if (requestId === citySyncRequestRef.current && isMountedRef.current) {
          setIsSyncingCity(false)
        }
      }
    },
    [userId],
  )

  /* ==============================
     BUSCAR CIDADE DO USUÁRIO
  ============================== */

  const fetchUserCity = useCallback(async () => {
    if (!userId) {
      return
    }

    try {
      setIsLoading(true)

      const { data } = await api.get('/me', {
        timeout: 30000,
      })

      if (!isMountedRef.current) {
        return
      }

      const user = data?.user ?? data

      if (user?.city?.id) {
        setCity({
          id: String(user.city.id),

          name: String(user.city.name ?? ''),

          uf: String(user.city.uf ?? ''),
        })

        return
      }

      if (user?.cityId && user?.cityName) {
        setCity({
          id: String(user.cityId),

          name: String(user.cityName),

          uf: String(user.uf ?? ''),
        })

        return
      }

      /*
       * Usuário realmente
       * não tem cidade definida.
       */
      setCity(null)
    } catch (error: any) {
      console.error('[CityContext] Erro ao buscar cidade:', {
        message: error?.message,

        code: error?.code,

        status: error?.response?.status,

        data: error?.response?.data,
      })

      /*
       * Não inventamos cidade
       * em erro de conexão.
       */
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [userId])

  /* ==============================
     LIMPAR CIDADE
  ============================== */

  const clearCity = useCallback(() => {
    citySyncRequestRef.current += 1

    setCity(null)

    setCityBanners([])

    setIsLoading(false)

    setIsSyncingCity(false)
  }, [])

  /* ==============================
     LOGOUT
  ============================== */

  useEffect(() => {
    if (!userId) {
      clearCity()
    }
  }, [userId, clearCity])

  /* ==============================
     CONTEXT VALUE
  ============================== */

  const contextValue = useMemo(
    () => ({
      city,

      cityBanners,

      isLoading,

      isSyncingCity,

      fetchUserCity,

      setUserCity,

      refreshCityBanners,

      clearCity,
    }),
    [
      city,

      cityBanners,

      isLoading,

      isSyncingCity,

      fetchUserCity,

      setUserCity,

      refreshCityBanners,

      clearCity,
    ],
  )

  return (
    <CityContext.Provider value={contextValue}>{children}</CityContext.Provider>
  )
}
