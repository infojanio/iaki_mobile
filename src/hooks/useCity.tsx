import { useContext } from 'react'
import { CityContext, CityContextData } from '@contexts/CityContext'

export function useCity(): CityContextData {
  const context = useContext(CityContext)

  return context
}
