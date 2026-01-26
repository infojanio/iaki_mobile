import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { Box, HStack, Text, VStack, Image, useTheme, Icon } from 'native-base'
import { StoreDTO } from '@dtos/StoreDTO'
import { MaterialIcons } from '@expo/vector-icons'
import { RatingStars } from '@components/RatingStars'

type Props = TouchableOpacityProps & {
  store: StoreDTO
  onRate?: () => void
}

export function StoreCard({ store, ...rest }: Props) {
  const { colors, sizes } = useTheme()

  return (
    <TouchableOpacity {...rest}>
      <Box
        bg="white"
        borderRadius="lg"
        shadow={2}
        mb={4}
        overflow="hidden"
        p={2}
      >
        <HStack space={3} alignItems="center">
          <Image
            source={{ uri: store.avatar }}
            alt={store.name}
            w={70}
            h={70}
            borderRadius="md"
            resizeMode="cover"
          />

          <VStack flex={1}>
            <HStack mb={2}>
              <Box>
                <Icon
                  as={MaterialIcons}
                  name="location-on"
                  size={sizes[1.5]}
                  color={colors.red[600]}
                />
              </Box>
              <Text fontSize="md"> {store.name}</Text>
            </HStack>
            <HStack>
              <Box ml={4}>
                <RatingStars rating={store.rating} count={store.ratingCount} />
              </Box>
              <Box ml={2}>
                <Text>Avaliações</Text>
              </Box>
            </HStack>
          </VStack>
        </HStack>
      </Box>
    </TouchableOpacity>
  )
}
