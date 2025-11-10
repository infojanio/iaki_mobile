import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'

import { PromotionDTO } from '@dtos/PromotionDTO' // Defina o tipo Promotion como no exemplo acima
import { api } from '@services/api'
import PromotionsCarousel from '@components/PromotionsCarousel'

type Props = {
  promotion: string
  data: PromotionDTO[]
}

const Promotions: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        //       const response = await fetch('https://sua-api.com/promocoes') // Ajuste para sua API
        const response = await api.get(`/promotions`)
        const data = await response.data
        setPromotions(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [])

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />
  }

  return (
    <View>
      <PromotionsCarousel promotions={promotions} />
    </View>
  )
}

export default Promotions
