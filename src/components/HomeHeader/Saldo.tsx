import React, { useEffect, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'

import {
  HStack,
  Text,
  IconButton,
  Icon,
  VStack,
  Skeleton,
  useToast,
} from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'

export function Saldo() {
  const [showBalance, setShowBalance] = useState(true)
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const toast = useToast()

  async function fetchBalance() {
    try {
      setIsLoading(true)
      const response = await api.get('/users/balance')
      setBalance(response.data.balance)
    } catch (error) {
      const isAppError = error instanceof AppError
      const errorMessage = isAppError
        ? error.message
        : 'Não foi possível carregar o saldo. Tente novamente mais tarde.'

      toast.show({
        title: errorMessage,
        placement: 'top',
        bgColor: 'red.500',
      })

      setBalance(null)
    } finally {
      setIsLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchBalance()
      }
    }, [user]),
  )

  // Formatação monetária mais robusta
  const formatBalance = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <VStack mt={2} px={1}>
      <Text fontSize="14" color="white" fontWeight="normal" mb={1}>
        Saldo disponível
      </Text>

      <HStack alignItems="center" space={2}>
        {isLoading ? (
          <Skeleton h="8" w="32" rounded="md" />
        ) : (
          <Text fontSize="18" fontWeight="bold" color="white">
            {showBalance
              ? balance !== null
                ? formatBalance(balance)
                : 'R$ 0,00'
              : '•••••••••'}
          </Text>
        )}

        <IconButton
          icon={
            <Icon
              as={MaterialIcons}
              name={showBalance ? 'visibility-off' : 'visibility'}
              color="white"
              size={5}
            />
          }
          onPress={() => setShowBalance((prev) => !prev)}
          _pressed={{ bg: 'rgba(255,255,255,0.1)' }}
          rounded="full"
          isDisabled={isLoading}
        />
      </HStack>
    </VStack>
  )
}
