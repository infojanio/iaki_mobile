import { useContext } from 'react'
import { CityContext, CityContextDataProps } from '@contexts/CityContext'

export function useCity(): CityContextDataProps {
  const context = useContext(CityContext)

  return context
}
