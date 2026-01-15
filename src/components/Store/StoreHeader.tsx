import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  IconButton,
  useTheme,
} from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'
import { StoreDTO } from '@dtos/StoreDTO'
import { useNavigation } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { ImageBackground } from 'react-native'

type Props = {
  store: StoreDTO
}

export function StoreHeader({ store }: Props) {
  const { colors, sizes } = useTheme()
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  return (
    <VStack safeArea>
      <Box position="relative">
        {/* Imagem ocupa 100% */}
        <Image
          source={{ uri: store.avatar }}
          alt={store.name}
          h={180}
          w="100%"
        />

        {/* Botão flutuante */}
        <IconButton
          position="absolute"
          top={4}
          left={2}
          bg="white"
          borderRadius="2xl"
          opacity={'0.80'}
          shadow={2}
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

      {/* Card flutuante */}
      <Box
        bg="white"
        opacity={0.96}
        mx={4}
        mt={-10}
        p={4}
        borderRadius="xl"
        shadow={3}
      >
        <VStack space={1}>
          <Text fontSize="md" color="gray.800" fontWeight="bold">
            {store.name}
          </Text>

          {!!store.city && (
            <Text fontSize="sm" color="gray.700">
              {store.city.name} · {store.city.uf}
            </Text>
          )}

          {!!store.street && (
            <Text fontSize="sm" color="gray.700">
              {store.street}
            </Text>
          )}

          {/* Avaliação */}
          {typeof store.rating === 'number' && (
            <HStack alignItems="center" space={1}>
              <HStack flex={1} alignItems={'center'} mt={2}>
                <MaterialIcons name="star" size={16} color="#FBBF24" />
                <Text fontSize="sm" fontWeight="bold">
                  {store.rating.toFixed(1)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  ({store.ratingCount ?? 0}) avaliações
                </Text>
              </HStack>

              {/* Status */}
              <Box flex={1} alignItems="flex-end" mr={4}>
                <Text
                  mt={2}
                  fontSize="sm"
                  fontWeight="bold"
                  color={store.isActive ? 'green.600' : 'red.500'}
                >
                  {store.isActive ? 'Loja disponível' : 'Loja indisponível'}
                </Text>
              </Box>
            </HStack>
          )}
        </VStack>
      </Box>
    </VStack>
  )
}
