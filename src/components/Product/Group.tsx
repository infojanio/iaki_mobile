import { Text, Pressable, IPressableProps, Box } from 'native-base'

type Props = IPressableProps & {
  name: string
  subcategory: string
  isActive: boolean
}

export function Group({ name, subcategory, isActive, ...rest }: Props) {
  return (
    <Box flex="1" bg={'gray.100'} borderBottomWidth="0.2">
      <Pressable
        mr={1}
        ml={1}
        mt={2}
        mb={2}
        w={32}
        h={10}
        bg={'gray.300'}
        borderWidth="0.3"
        rounded="md"
        justifyContent="center"
        alignItems="center"
        overflow="hidden"
        isPressed={isActive}
        _pressed={{
          fontWeight: 'bold',
          bgColor: 'green.600',
          borderColor: 'green.500',
          borderWidth: 2,
        }}
        {...rest}
      >
        <Text
          color={isActive ? 'gray.100' : 'gray.700'}
          textTransform="uppercase"
          fontSize="12"
          fontWeight={'bold'}
        >
          {name}
        </Text>
      </Pressable>
    </Box>
  )
}
