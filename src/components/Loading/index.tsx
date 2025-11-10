import { Center, Spinner, Image, Text } from 'native-base'

import SplashImg from '@assets/icon01.png'

export function Loading() {
  return (
    <Center flex={1} bg="gray.100">
      <Image
        size={50}
        source={SplashImg}
        defaultSource={SplashImg}
        alt="loading..."
        resizeMode="contain"
        position="relative"
      />
      <Text fontSize={14}>Carregando... </Text>

      <Spinner color="green.500" />
    </Center>
  )
}
