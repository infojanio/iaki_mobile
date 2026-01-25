import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  IconButton,
  useTheme,
  Pressable,
} from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { StoreDTO } from '@dtos/StoreDTO'
import { useNavigation } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { useState } from 'react'
import { StoreRatingModal } from '@components/StoreRatingModal'

type Props = {
  store: StoreDTO
}

export function StoreHeader({ store }: Props) {
  const { colors, sizes } = useTheme()
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const [showRatingModal, setShowRatingModal] = useState(false)

  const rating = store.rating ?? 0
  const ratingCount = store.ratingCount ?? 0

  function renderStars() {
    const stars = []

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialIcons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-border'}
          size={16}
          color="#FBBF24"
        />,
      )
    }

    return stars
  }

  return (
    <>
      <VStack safeArea mb={2}>
        {/* IMAGEM DA LOJA */}
        <Box position="relative">
          <Image
            source={{ uri: store.avatar }}
            alt={store.name}
            h={180}
            w="100%"
          />

          {/* BOTÃO VOLTAR */}
          <IconButton
            position="absolute"
            top={4}
            left={2}
            bg="white"
            borderRadius="full"
            opacity={0.85}
            shadow={3}
            icon={
              <MaterialIcons
                name="arrow-back"
                size={sizes[6]}
                color={colors.gray[700]}
              />
            }
            onPress={() => navigation.goBack()}
          />
        </Box>

        {/* CARD DE INFORMAÇÕES */}
        <Box
          bg="white"
          opacity={0.97}
          mx={4}
          mt={-10}
          p={4}
          borderRadius="xl"
          shadow={4}
        >
          <VStack space={2}>
            <Text fontSize="md" color="gray.800" fontWeight="bold">
              {store.name}
            </Text>

            {!!store.city && (
              <Text fontSize="sm" color="gray.600">
                {store.city.name} · {store.city.uf}
              </Text>
            )}

            {!!store.street && (
              <Text fontSize="sm" color="gray.600">
                {store.street}
              </Text>
            )}

            {/* ⭐ AVALIAÇÃO */}
            <HStack alignItems="center" justifyContent="space-between" mt={2}>
              <Pressable onPress={() => setShowRatingModal(true)}>
                {ratingCount > 0 ? (
                  <HStack alignItems="center" space={1}>
                    {renderStars()}
                    <Text fontSize="sm" fontWeight="bold">
                      {rating.toFixed(1)}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      ({ratingCount} avaliações)
                    </Text>
                  </HStack>
                ) : (
                  <Box bg="yellow.50" borderRadius="full" px={3} py={1}>
                    <Text fontSize="sm" color="gray.700">
                      Avaliar loja
                    </Text>
                  </Box>
                )}
              </Pressable>

              {/* STATUS */}
              <Text
                fontSize="sm"
                fontWeight="bold"
                color={store.isActive ? 'green.600' : 'red.500'}
              >
                {store.isActive ? 'Loja disponível' : 'Loja indisponível'}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </VStack>

      {/* ⭐ MODAL DE AVALIAÇÃO */}
      <StoreRatingModal
        isOpen={showRatingModal}
        storeName={store.name}
        onClose={() => setShowRatingModal(false)}
      />
    </>
  )
}
