import { FlatList } from 'react-native'
import { Box, Text, Pressable, HStack } from 'native-base'
import { MaterialIcons } from '@expo/vector-icons'

export type StoreCategoryItem = {
  id: string
  name: string
  icon?: string
}

type Props = {
  data: StoreCategoryItem[]
  onPress: (item: StoreCategoryItem) => void
  emptyText?: string
}

export function StoreCategoryList({
  data,
  onPress,
  emptyText = 'Nenhuma categoria encontrada',
}: Props) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: 16 }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onPress(item)}
          mx={4}
          mb={3}
          p={4}
          bg="white"
          borderRadius="lg"
          shadow={1}
        >
          <HStack alignItems="center" space={3}>
            <Box
              w={10}
              h={10}
              bg="primary.100"
              borderRadius="full"
              alignItems="center"
              justifyContent="center"
            >
              <MaterialIcons
                name={(item.icon as any) || 'category'}
                size={20}
                color="#00875F"
              />
            </Box>

            <Text fontSize="md" fontWeight="semibold">
              {item.name}
            </Text>
          </HStack>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text textAlign="center" mt={10}>
          {emptyText}
        </Text>
      }
    />
  )
}
