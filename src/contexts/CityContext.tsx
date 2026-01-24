import { createContext, ReactNode, useState, useEffect } from 'react'
import { api } from '@services/api'
import { useToast } from 'native-base'

import { useAuth } from '@hooks/useAuth'
import { BannerDTO } from '@dtos/BannerDTO'

/* ==============================
   🧱 TIPOS
============================== */

type City = {
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
     🔄 BANNERS DA CIDADE
  ============================== */
  useEffect(() => {
    async function loadCityBanners() {
      if (!city?.id) {
        setCityBanners([])
        return
      }

      try {
        const res = await api.get('/banners', {
          params: { cityId: city.id },
        })

        setCityBanners(res.data)
      } catch (error) {
        console.error('[CityContext] Erro ao carregar banners', error)
        setCityBanners([])
      }
    }

    loadCityBanners()
  }, [city?.id])

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
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /* ==============================
     🔄 BUSCAR CIDADE DO USUÁRIO
     (hidratação futura)
  ============================== */
  async function fetchUserCity() {
    try {
      const { data } = await api.get('/users/me')

      if (data?.city) {
        setCity(data.city)
      }
    } catch (error) {
      console.error('[CityContext] Erro ao buscar cidade do usuário', error)
    }
  }

  /* ==============================
     🧹 LIMPAR CIDADE (LOGOUT)
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
        setUserCity,
        clearCity,
        fetchUserCity,
      }}
    >
      {children}
    </CityContext.Provider>
  )
}
