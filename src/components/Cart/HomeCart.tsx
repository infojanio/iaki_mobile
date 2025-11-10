import React from 'react'

import { TouchableOpacity } from 'react-native'
import { Center, HStack, Icon, useTheme, Text, VStack, Box } from 'native-base'

import { MaterialIcons } from '@expo/vector-icons'
import { Input } from '@components/Input'
import { ButtonBack } from '@components/ButtonBack'
import { Double } from 'react-native/Libraries/Types/CodegenTypes'

type Props = {
  price: number
  quantity: number
  title: string
}

export function HomeCart({ title, price, quantity }: Props) {
  //definição do tamanho dos ícones
  const { sizes, colors } = useTheme()
  const iconSize = sizes[10]

  return (
    <VStack>
      <HStack
        bg="gray.200"
        paddingTop={2}
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth={0.2}
      >
        <ButtonBack />

        <HStack mr={16} alignContent="space-between">
          <Text
            ml={10}
            fontWeight={'semibold'}
            fontStyle={'oblique'}
            fontSize={18}
            color="black"
            flexShrink={1}
          >
            {title}
          </Text>
          <Text
            ml={16}
            fontWeight={'semibold'}
            fontStyle={'oblique'}
            fontSize={18}
            color="black"
          >
            R$ {price}
          </Text>
        </HStack>

        <VStack mr={2} alignItems={'center'} justifyContent={'center'}>
          <Center mr={1} bg={'red.500'} borderRadius="full" padding={1}>
            <Text fontSize={12} fontWeight={'bold'} color="white">
              {quantity}
            </Text>
          </Center>
          <Box mt={-2} mr={4}>
            <Icon
              as={<MaterialIcons name="shopping-cart" />}
              size={7}
              _light={{
                color: 'green.700',
              }}
              _dark={{
                color: 'green.700',
              }}
            />
          </Box>
        </VStack>
      </HStack>
    </VStack>
  )
}
