import React, { useEffect } from 'react'
import { Box, Center, Text, VStack, Button, HStack } from 'native-base'
import QRCode from 'react-native-qrcode-svg'
import { useRoute, useNavigation } from '@react-navigation/native'
import { useStorePoints } from '@contexts/StorePointsContext'
import { ButtonBack } from '@components/ButtonBack'

export function RewardQRCodeScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const { redemptionId, storeId } = route.params

  const { fetchWallet } = useStorePoints()

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      fetchWallet(storeId)
    })

    return unsubscribe
  }, [navigation])

  return (
    <Center flex={1} bg="white">
      <HStack mb={24} mr={64}>
        <ButtonBack />
      </HStack>
      <VStack space={6} alignItems="center">
        <Text fontSize="lg" bold>
          Mostre este QR na loja
        </Text>

        <QRCode value={redemptionId} size={220} />

        <Text fontSize="sm" color="gray.500" textAlign="center">
          O brinde será confirmado após validação.
        </Text>
      </VStack>
    </Center>
  )
}
