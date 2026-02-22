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
import { useNavigationHistory } from '@contexts/NavigationHistoryContext'
import { useState } from 'react'
import { StoreRatingModal } from '@components/StoreRatingModal'

type Props = {
  store: StoreDTO
}

export function StoreHeader({ store }: Props) {
  const { colors, sizes } = useTheme()

  // 🔥 NÃO tipar como BottomTabNavigationProp aqui
  const navigation = useNavigation<any>()

  // ✅ usando a pilha (evita ping-pong)
  const { popAndGetBackRoute } = useNavigationHistory()

  const [showRatingModal, setShowRatingModal] = useState(false)
  const [storeData, setStoreData] = useState(store)

  const rating = storeData.rating ?? 0
  const ratingCount = storeData.ratingCount ?? 0

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

  function handleRatingSuccess(newRating: number) {
    setStoreData((prev) => {
      const currentRating = prev.rating ?? 0
      const currentCount = prev.ratingCount ?? 0

      const updatedCount = currentCount + 1
      const updatedRating =
        (currentRating * currentCount + newRating) / updatedCount

      return {
        ...prev,
        rating: updatedRating,
        ratingCount: updatedCount,
      }
    })
  }

  function handleBack() {
    // 1️⃣ tenta voltar pelo Stack pai (melhor cenário)
    const parent = navigation.getParent?.()
    if (parent?.canGoBack?.()) {
      parent.goBack()
      return
    }

    // 2️⃣ evita usar goBack no TAB (normalmente volta pra Home)
    const stateType = navigation.getState?.()?.type
    const isTab = stateType === 'tab'

    if (!isTab && navigation.canGoBack?.()) {
      navigation.goBack()
      return
    }

    // 3️⃣ usa histórico com POP (remove rota atual e retorna a anterior)
    const target = popAndGetBackRoute()
    if (target?.name) {
      navigation.navigate(target.name, target.params)
      return
    }

    // 4️⃣ fallback
    navigation.navigate('home')
  }

  return (
    <>
      <VStack safeArea mb={2} bg="gray.100">
        {/* IMAGEM DA LOJA */}
        <Box position="relative">
          <Image
            source={{ uri: store.avatar }}
            alt={store.name}
            h={180}
            w="100%"
            resizeMode="stretch"
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
            onPress={handleBack}
          />
        </Box>

        {/* CARD DE INFORMAÇÕES */}
        <Box
          bg="white"
          opacity={0.87}
          mx={4}
          mt={-4}
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

            {!!store.phone && (
              <Text fontSize="sm" color="gray.600">
                Telefone: {store.phone}
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
                  <Box bg="green.100" borderRadius="full" px={3} py={1}>
                    <Text fontSize="14" color="gray.700">
                      👉 Avalie o Estabelecimento ✨
                    </Text>
                  </Box>
                )}
              </Pressable>
            </HStack>
          </VStack>
        </Box>
      </VStack>

      <StoreRatingModal
        isOpen={showRatingModal}
        storeId={storeData.id}
        storeName={storeData.name}
        onClose={() => setShowRatingModal(false)}
        onSuccess={handleRatingSuccess}
      />
    </>
  )
}
