import { HStack, Icon, Text } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'

type Props = {
  rating?: number
  count?: number
}

export function RatingStars({ rating = 0, count = 0 }: Props) {
  if (!rating) return null

  return (
    <HStack alignItems="center" space={1}>
      <Icon as={MaterialIcons} name="star" color="yellow.400" size="sm" />
      <Text fontSize="sm" color="gray.700">
        {rating.toFixed(1)}
      </Text>

      {count > 0 && (
        <Text fontSize="xs" color="gray.500">
          ({count})
        </Text>
      )}
    </HStack>
  )
}
