import React from 'react'

import { TouchableOpacity, TouchableOpacityProps } from 'react-native'

import { Image, Text, Box, HStack, Icon, VStack, Center } from 'native-base'

import { CategoryDTO } from '@dtos/CategoryDTO'

export type Props = TouchableOpacityProps & {
  data: CategoryDTO
  isSelected?: boolean
}

export function CategoryCard({ data, isSelected = false, ...rest }: Props) {
  return (
    <VStack flex={1} borderBottomWidth={isSelected ? 'green.100' : 'gray.500'}>
      <TouchableOpacity {...rest}>
        <Box
          bg="gray.200"
          size={20}
          marginBottom={1}
          backgroundColor="gray.100"
          alignItems="center"
          marginTop={1}
          marginLeft={1}
          marginRight={1}
          borderWidth={0.8}
          borderColor={'gray.300'}
          pb={1}
          pt={1}
          borderRadius={12}
          minH={'16'}
        >
          <Image
            marginTop={2}
            w={16}
            h={12}
            source={{
              uri: data.image, //busca a URL da imagem
              //uri: `${api.defaults.baseURL}/images/thumb/${data.image}`, //busca o arquivo salvo no banco
            }}
            alt="Imagem"
            resizeMode="center"
          />

          <HStack flex={1}>
            <Center>
              <Text
                textAlign={'center'}
                justifyContent={'center'}
                fontSize={12}
                numberOfLines={2}
                color={isSelected ? 'red' : 'gray.700'}
                fontWeight={isSelected ? 'bold' : 'normal'}
              >
                {data.name}
              </Text>
            </Center>
          </HStack>
        </Box>
      </TouchableOpacity>
    </VStack>
  )
}
