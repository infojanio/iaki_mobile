// screens/RewardDetails.tsx

import React, { useState } from 'react'
import { Box, Button, Text, useToast, VStack } from 'native-base'

import { useNavigation, useRoute } from '@react-navigation/native'
import { redeemReward } from '@services/rewardService'

export function RewardDetails() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const toast = useToast()

  const { reward } = route.params

  const [loading, setLoading] = useState(false)

  async function handleRedeem() {
    try {
      setLoading(true)

      const data = await redeemReward(reward.id)

      navigation.navigate('RewardQRCode', {
        redemptionId: data.redemptionId,
      })
    } catch (err: any) {
      toast.show({
        title: err.response?.data?.message || 'Erro ao resgatar.',
        placement: 'top',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box flex={1} p={5}>
      <VStack space={4}>
        <Text fontSize="xl" bold>
          {reward.title}
        </Text>

        <Text>{reward.description}</Text>

        <Button isLoading={loading} onPress={handleRedeem} colorScheme="green">
          Resgatar por {reward.pointsCost} pontos
        </Button>
      </VStack>
    </Box>
  )
}
