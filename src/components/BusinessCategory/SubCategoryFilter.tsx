import { Pressable, Text } from 'native-base'

type Props = {
  title: string
  isActive?: boolean
  onPress: () => void
}

export function SubCategoryFilter({ title, isActive = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      px={4}
      py={2}
      bg={isActive ? 'blue.500' : 'gray.200'}
      rounded="full"
      _pressed={{ opacity: 0.7 }}
    >
      <Text color={isActive ? 'white' : 'gray.800'} fontWeight="medium">
        {title}
      </Text>
    </Pressable>
  )
}
