import { Box, Button, Center, Heading, Text } from 'native-base'

import { CheckCircle2 } from 'lucide-react-native'

import { AuthNavigatorRoutesProps } from '@routes/auth.routes'
import { useNavigation } from '@react-navigation/native'

export function PasswordResetSuccess() {
  const navigation = useNavigation<AuthNavigatorRoutesProps>()

  function handleSignIn() {
    navigation.reset({
      index: 0,

      routes: [
        {
          name: 'signin',
        },
      ],
    })
  }

  return (
    <Box flex={1} bg="white" px={6} safeArea>
      <Center flex={1}>
        <Box
          w={24}
          h={24}
          borderRadius={48}
          bg="green.100"
          alignItems="center"
          justifyContent="center"
          mb={7}
        >
          <CheckCircle2 size={48} color="#16A34A" />
        </Box>

        <Heading textAlign="center" fontSize="2xl" color="gray.800">
          Senha alterada!
        </Heading>

        <Text
          mt={4}
          textAlign="center"
          color="gray.500"
          fontSize="md"
          lineHeight="lg"
        >
          Sua senha foi redefinida com sucesso. Você já pode acessar o Clube
          IAki usando sua nova senha.
        </Text>
      </Center>

      <Button
        mb={6}
        h={12}
        borderRadius="xl"
        bg="purple.600"
        _pressed={{
          bg: 'purple.700',
        }}
        onPress={handleSignIn}
      >
        Entrar no Clube IAki
      </Button>
    </Box>
  )
}
