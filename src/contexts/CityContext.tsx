import {
  createContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
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

export function CityProvider({ children }: CityProviderProps) {
  const { userId } = useAuth()

  const [city, setCity] = useState<City | null>(null)
  const [cityBanners, setCityBanners] = useState<BannerDTO[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [isSyncingCity, setIsSyncingCity] = useState(false)

  /*
   * Carrega os banners da cidade atual.
   */
  const refreshCityBanners = useCallback(async () => {
    const cityId = city?.id

    if (!cityId) {
      setCityBanners([])
      return
    }

    try {
      const response = await api.get(`/banners/city/${cityId}`)

      const responseBanners =
        response.data?.data ?? response.data?.banners ?? response.data ?? []

      const banners = Array.isArray(responseBanners) ? responseBanners : []

      const shuffled = [...banners].sort(() => Math.random() - 0.5)

      setCityBanners(shuffled.slice(0, 3))
    } catch (error) {
      console.error('[CityContext] Erro ao carregar banners:', error)

      setCityBanners([])
    }
  }, [city?.id])

  /*
   * Recarrega os banners quando a cidade muda.
   */
  useEffect(() => {
    if (city?.id) {
      refreshCityBanners()
    } else {
      setCityBanners([])
    }
  }, [city?.id, refreshCityBanners])

  /*
   * Atualização otimista:
   *
   * 1. Atualiza o contexto imediatamente.
   * 2. A tela pode navegar para a Home.
   * 3. A atualização no backend continua em segundo plano.
   */
  const setUserCity = useCallback(
    async (selectedCity: City) => {
      const previousCity = city

      // Atualiza imediatamente
      setCity(selectedCity)

      // Não bloqueia a abertura da Home
      setIsSyncingCity(true)

      try {
        const startedAt = Date.now()

        await api.patch('/users/city', {
          cityId: selectedCity.id,
        })

        console.log(
          `[CityContext] Cidade sincronizada em ${Date.now() - startedAt}ms`,
        )
      } catch (error: any) {
        console.error('[CityContext] Erro ao sincronizar cidade:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        })

        /*
         * Não mostramos toast porque a cidade já está selecionada
         * localmente e a falha pode ser apenas temporária.
         *
         * Se você quiser impedir o uso da cidade quando o backend
         * falhar, descomente:
         *
         * setCity(previousCity)
         * throw error
         */
        void previousCity
      } finally {
        setIsSyncingCity(false)
      }
    },
    [city],
  )

  /*
   * Busca a cidade cadastrada no perfil do usuário.
   */
  const fetchUserCity = useCallback(async () => {
    if (!userId) {
      return
    }

    try {
      setIsLoading(true)

      const { data } = await api.get('/me')
      const user = data?.user ?? data

      if (user?.city?.id) {
        setCity({
          id: user.city.id,
          name: user.city.name,
          uf: user.city.uf ?? '',
        })

        return
      }

      if (user?.cityId && user?.cityName) {
        setCity({
          id: user.cityId,
          name: user.cityName,
          uf: user.uf ?? '',
        })
      }
    } catch (error: any) {
      console.error('[CityContext] Erro ao buscar cidade:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      })
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const clearCity = useCallback(() => {
    setCity(null)
    setCityBanners([])
    setIsLoading(false)
    setIsSyncingCity(false)
  }, [])

  useEffect(() => {
    if (!userId) {
      clearCity()
    }
  }, [userId, clearCity])

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
