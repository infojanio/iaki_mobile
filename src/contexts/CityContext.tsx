import {
  createContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react'

import { useToast } from 'native-base'

import { api } from '@services/api'

import { useAuth } from '@hooks/useAuth'

import { BannerDTO } from '@dtos/BannerDTO'

/* ==============================
   🧱 TIPOS
============================== */

export type City = {
  id: string
  name: string
  uf: string
}

type CityContextData = {
  city: City | null

  cityBanners: BannerDTO[]

  isLoading: boolean

  fetchUserCity: () => Promise<void>

  setUserCity: (city: City) => Promise<void>

  refreshCityBanners: () => Promise<void>

  clearCity: () => void
}

export const CityContext = createContext({} as CityContextData)

/* ==============================
   🏙️ PROVIDER
============================== */

type CityProviderProps = {
  children: ReactNode
}

export function CityProvider({ children }: CityProviderProps) {
  const { userId } = useAuth()

  const toast = useToast()

  const [city, setCity] = useState<City | null>(null)

  const [cityBanners, setCityBanners] = useState<BannerDTO[]>([])

  const [isLoading, setIsLoading] = useState(false)

  /* ==============================
     🎯 CARREGAR BANNERS DA CIDADE
  ============================== */

  const refreshCityBanners = useCallback(async () => {
    if (!city?.id) {
      setCityBanners([])
      return
    }

    try {
      const response = await api.get(`/banners/city/${city.id}`)

      const banners =
        response.data?.data ?? response.data?.banners ?? response.data ?? []

      // 🔥 embaralha
      const shuffled = [...banners].sort(() => Math.random() - 0.5)

      // 🔥 mostra apenas 3
      setCityBanners(shuffled.slice(0, 3))
    } catch (error) {
      console.error('[CityContext] Erro ao carregar banners:', error)

      setCityBanners([])
    }
  }, [city?.id])

  /* ==============================
     🔄 RECARREGA AO TROCAR CIDADE
  ============================== */

  useEffect(() => {
    refreshCityBanners()
  }, [refreshCityBanners])

  /* ==============================
     🏙️ DEFINIR CIDADE
  ============================== */

  async function setUserCity(selectedCity: City) {
    try {
      setIsLoading(true)

      await api.patch('/users/city', {
        cityId: selectedCity.id,
      })

      setCity(selectedCity)

      /*
      toast.show({
        title: 'Cidade alterada',
        placement: 'top',
      })
      */
    } catch (error) {
      console.error('[CityContext] Erro ao salvar cidade:', error)

      toast.show({
        title: 'Erro ao alterar cidade',
        placement: 'top',
      })

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /* ==============================
     👤 BUSCAR CIDADE DO USUÁRIO
  ============================== */

  async function fetchUserCity() {
    try {
      const { data } = await api.get('/me')

      const user = data?.user

      if (user?.city) {
        setCity(user.city)
        return
      }

      // 🔥 fallback
      if (user?.cityId && user?.cityName) {
        setCity({
          id: user.cityId,
          name: user.cityName,
          uf: user.uf ?? '',
        })
      }
    } catch (error) {
      console.error('[CityContext] Erro ao buscar cidade do usuário:', error)
    }
  }

  /* ==============================
     🧹 LIMPAR CONTEXTO
  ============================== */

  function clearCity() {
    setCity(null)
    setCityBanners([])
  }

  /* ==============================
     🔐 REAGE AO LOGOUT
  ============================== */

  useEffect(() => {
    if (!userId) {
      clearCity()
    }
  }, [userId])

  /* ==============================
     📦 CONTEXT
  ============================== */

  return (
    <CityContext.Provider
      value={{
        city,

        cityBanners,

        isLoading,

        fetchUserCity,

        setUserCity,

        refreshCityBanners,

        clearCity,
      }}
    >
      {children}
    </CityContext.Provider>
  )
}
