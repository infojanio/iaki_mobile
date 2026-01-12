import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { Box, HStack, Text, VStack, Image, useTheme, Icon } from 'native-base'
import { StoreDTO } from '@dtos/StoreDTO'
import { MaterialIcons } from '@expo/vector-icons'
import { RatingStars } from '@components/RatingStars'

type Props = TouchableOpacityProps & {
  store: StoreDTO
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
              <Box>
                <Icon
                  as={MaterialIcons}
                  name="phone"
                  size={sizes[1.5]}
                  color={colors.green[600]}
                />
              </Box>
              <Text color="gray.600"> {store.phone}</Text>
            </HStack>
          </VStack>
          <Box marginRight={2}>
            <Text>Avaliação</Text>
            <RatingStars rating={store.rating} count={store.ratingCount} />
          </Box>
        </HStack>
      </Box>
    </TouchableOpacity>
  )
}
