import { createContext, ReactNode, useEffect, useState } from 'react'
import { api } from '@services/api'
import { useAuth } from '@hooks/useAuth'

type City = {
  id: string
  name: string
  uf: string
}

type CityContextData = {
  city: City | null
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
  const [city, setCity] = useState<City | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function setUserCity(selectedCity: City) {
    try {
      setIsLoading(true)

      await api.patch('/users/city', {
        cityId: selectedCity.id,
      })

      setCity(selectedCity)
    } catch (error) {
      console.error('[CityContext] Erro ao salvar cidade:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  function clearCity() {
    setCity(null)
  }

  return (
    <CityContext.Provider
      value={{
        city,
        isLoading,
        setUserCity,
        clearCity,
        fetchUserCity: async () => {}, // opcional / futuro
      }}
    >
      {children}
    </CityContext.Provider>
  )
}
