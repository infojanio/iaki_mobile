import { Button as ButtonNativeBase, IButtonProps, Text } from 'native-base'

type Props = IButtonProps & {
  title: string
  variant?: 'solid' | 'outline'
}

export function Button({ title, variant = 'solid', ...rest }: Props) {
  return (
    <ButtonNativeBase
      w="full"
      h={12}
      mb="2"
      bg={variant === 'outline' ? 'transparent' : 'green.600'}
      borderWidth={variant === 'outline' ? 1.5 : 0}
      borderColor="green.500"
      rounded="md"
      _pressed={{
        bg: variant === 'outline' ? 'green.100' : 'green.200',
      }}
      {...rest}
    >
      <Text
        color={variant === 'outline' ? 'gray.500' : 'white'}
        fontFamily="body"
        fontSize="16"
      >
        {title}
      </Text>
    </ButtonNativeBase>
  )
}
