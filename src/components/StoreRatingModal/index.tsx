import { Modal } from 'react-native'
import { useState } from 'react'
import {
  Box,
  VStack,
  Text,
  HStack,
  IconButton,
  Button,
  useToast,
} from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'

type Props = {
  isOpen: boolean
  storeId: string
  storeName: string
  onClose: () => void
  onSuccess: (rating: number) => void
}

export function StoreRatingModal({
  isOpen,
  storeId,
  storeName,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast()
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function renderStars(value: number) {
    return (
      <HStack space={1} justifyContent="center">
        {[1, 2, 3, 4, 5].map((i) => (
          <IconButton
            key={i}
            icon={
              <MaterialIcons
                name={i <= value ? 'star' : 'star-border'}
                size={28}
                color="#FBBF24"
              />
            }
            onPress={() => setRating(i)}
            variant="ghost"
          />
        ))}
      </HStack>
    )
  }

  async function handleSubmit() {
    if (rating === 0) return

    try {
      setIsSubmitting(true)

      await api.post(`/stores/${storeId}/evaluations`, {
        rating,
      })

      onSuccess(rating)

      toast.show({
        title: 'Avaliação enviada!',
        description: 'Obrigado por avaliar esta loja 😊',
        placement: 'top',
        bgColor: 'green.500',
      })

      onClose()
      setRating(0)
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : 'Não foi possível enviar sua avaliação'

      toast.show({
        title: message,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <Box
        flex={1}
        bg="rgba(0,0,0,0.4)"
        justifyContent="center"
        alignItems="center"
        px={4}
      >
        <Box bg="white" p={6} borderRadius="xl" width="100%" maxWidth={400}>
          <VStack space={4} alignItems="center">
            <Text fontSize="lg" fontWeight="bold">
              Avaliar loja
            </Text>

            <Text fontSize="sm" color="gray.500" textAlign="center">
              Como foi sua experiência com{'\n'}
              <Text fontWeight="bold">{storeName}</Text>?
            </Text>

            {renderStars(rating)}

            <HStack space={3} mt={4} width="100%">
              <Button
                flex={1}
                variant="outline"
                onPress={onClose}
                isDisabled={isSubmitting}
              >
                Cancelar
              </Button>

              <Button
                flex={1}
                colorScheme="green"
                isDisabled={rating === 0}
                isLoading={isSubmitting}
                onPress={handleSubmit}
              >
                Enviar
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>
    </Modal>
  )
}
