import React from 'react'

import { TouchableOpacity } from 'react-native'
import { Center, HStack, Icon, useTheme, Text, VStack } from 'native-base'

import { MaterialIcons } from '@expo/vector-icons'

import { Input } from '@components/Input'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { useNavigation } from '@react-navigation/native'
import { ProductDTO } from '@dtos/ProductDTO'

type Props = {
  data: ProductDTO[]
}

export function HomeProduct() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  //definição do tamanho dos ícones
  const { sizes, colors } = useTheme()
  const iconSize = sizes[10]

  function OpenLogo() {
    console.log('Abrir janela da logoMarca')
  }

  //voltar a tela anterior
  function handleGoBack() {
    navigation.goBack()
  }

  return (
    <VStack>
      <HStack
        bg="gray.200"
        paddingBottom={4}
        paddingTop={4}
        justifyContent="space-between"
        alignItems="center"
      >
        <TouchableOpacity onPress={handleGoBack}>
          <Icon
            as={<MaterialIcons name="arrow-back" />}
            size={6}
            mr={1}
            ml={4}
            _light={{
              color: 'gray.600',
            }}
            _dark={{
              color: 'gray.700',
            }}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('signUp')}>
          <Text fontSize={16}>Categoria</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Icon
            as={<MaterialIcons name="keyboard-arrow-down" />}
            size={6}
            mr={6}
            _light={{
              color: 'gray.700',
            }}
            _dark={{
              color: 'gray.700',
            }}
          />
        </TouchableOpacity>
      </HStack>

      <Center pr={4} ml="2" mr="2" mt="2" flexDirection="row">
        <Input
          borderRadius="md"
          borderBottomWidth={1}
          size="xl"
          placeholder="Buscar produtos"
          _light={{
            placeholderTextColor: 'blueGray.500',
          }}
          _dark={{
            placeholderTextColor: 'blueGray.100',
          }}
        />{' '}
      </Center>
    </VStack>
  )
}
