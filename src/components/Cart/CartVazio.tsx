import { HomeCart } from '@components/Cart/HomeCart'
import { Box, Center, Text, Image, VStack } from 'native-base'

import CartPng from '@assets/cart.png'
import { Button } from '@components/Button'

export function CartVazio() {
  return (
    <VStack>
      <HomeCart title={'Carrinho'} price={1435.52} quantity={0} />
      <Box h={280} alignItems={'center'} justifyContent={'center'}>
        <Image
          alt="Carrinho Vazio"
          size={140}
          source={CartPng}
          defaultSource={CartPng}
          resizeMode="contain"
          position="relative"
        />
        <Text opacity={0.25} fontSize={18}>
          Não exitem produtos no carrinho!
        </Text>
      </Box>

      <Center padding={4}>
        <Button title="Iniciar as compras" />
      </Center>
    </VStack>
  )
}
