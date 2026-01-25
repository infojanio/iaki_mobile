import { Modal } from 'react-native'
import { useState } from 'react'
import { Box, VStack, Text, HStack, IconButton, Button } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'

type Props = {
  isOpen: boolean
  storeName: string
  onClose: () => void
}

export function StoreRatingModal({ isOpen, storeName, onClose }: Props) {
  const [rating, setRating] = useState(0)

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

  function handleSubmit() {
    if (rating === 0) return

    // 🔜 backend depois
    console.log('Enviar avaliação:', rating)

    onClose()
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
              <Button flex={1} variant="outline" onPress={onClose}>
                Cancelar
              </Button>

              <Button
                flex={1}
                colorScheme="green"
                isDisabled={rating === 0}
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
