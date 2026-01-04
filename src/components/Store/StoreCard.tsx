import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { Box, Text, VStack } from 'native-base'
import { StoreDTO } from '@dtos/StoreDTO'

type Props = TouchableOpacityProps & {
  store: StoreDTO
}

export function StoreCard({ store, ...rest }: Props) {
  return (
    <TouchableOpacity {...rest}>
      <Box bg="gray.800" borderRadius="md" p={4} mb={3}>
        <VStack>
          <Text color="white" fontSize="md" fontWeight="bold">
            {store.name}
          </Text>

          {store.phone && (
            <Text color="gray.400" fontSize="sm">
              {store.phone}
            </Text>
          )}
        </VStack>
      </Box>
    </TouchableOpacity>
  )
}
