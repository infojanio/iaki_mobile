import { Feather } from '@expo/vector-icons'
import { Platform, TouchableOpacity } from 'react-native'
import { HStack, Image, Text, VStack, Icon } from 'native-base'
import { formatCurrency } from '@utils/format'

type Props = {
  data: {
    productId: string
    name: string
    image: string
    price: number
    quantity: number
  }
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

export function ItemCartCard({
  data,
  onIncrement,
  onDecrement,
  onRemove,
}: Props) {
  return (
    <HStack
      w="full"
      bg="white"
      rounded="md"
      alignItems="center"
      px={3}
      py={1}
      mb={2}
    >
      <Image
        w={16}
        h={16}
        source={{ uri: data.image }}
        alt={data.name}
        resizeMode={Platform.OS === 'android' ? 'contain' : 'cover'}
      />

      <VStack flex={1} ml={3}>
        <Text bold>{data.name}</Text>
        <Text color="gray.500">{formatCurrency(data.price)}</Text>

        <HStack mt={2} alignItems="center" space={3}>
          <TouchableOpacity onPress={onDecrement}>
            <Icon as={Feather} name="minus-circle" size={6} />
          </TouchableOpacity>

          <Text>{data.quantity}</Text>

          <TouchableOpacity onPress={onIncrement}>
            <Icon as={Feather} name="plus-circle" size={6} />
          </TouchableOpacity>
        </HStack>
      </VStack>

      <TouchableOpacity onPress={onRemove}>
        <Icon as={Feather} name="trash" size={6} color="red.500" />
      </TouchableOpacity>
    </HStack>
  )
}
