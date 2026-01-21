import {
  createContext,
  ReactNode,
  useState,
  useContext,
  useEffect,
} from 'react'
import { api } from '@services/api'
import { useToast } from 'native-base'

import { useAuth } from '@hooks/useAuth'
import { CartContext } from '@contexts/CartContext'
import { BannerDTO } from '@dtos/BannerDTO'

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

type CityProviderProps = {
  children: ReactNode
}

export function CityProvider({ children }: CityProviderProps) {
  const { userId } = useAuth()
  const { resetCartContext } = useContext(CartContext)
  const toast = useToast()

  const [city, setCity] = useState<City | null>(null)
  const [cityBanners, setCityBanners] = useState<BannerDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // ✅ EFEITO CORRETO: reage à mudança da cidade
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

  async function setUserCity(selectedCity: City) {
    try {
      setIsLoading(true)

      await api.patch('/users/city', {
        cityId: selectedCity.id,
      })

      // 🔥 regra: mudou a cidade → limpa carrinho visual
      resetCartContext()

      setCity(selectedCity)

      /*
      toast.show({
        title: 'Cidade alterada',
        description: 'Seu carrinho foi salvo.',
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

  function clearCity() {
    resetCartContext()
    setCity(null)
    setCityBanners([])
  }

  async function fetchUserCity() {
    // futuro
  }

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
