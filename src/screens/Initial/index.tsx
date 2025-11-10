import { VStack, Image, Center, Text, Box, useDisclose } from 'native-base'

import { AuthNavigatorRoutesProps } from '@routes/auth.routes'

import { Button } from '@components/Button'
import LogoPng from '@assets/logoInitial.png'

import { useNavigation } from '@react-navigation/native'
import { TouchableOpacity } from 'react-native'
import { CitySelect } from '@utils/CitySelect'

export function Initial() {
  const navigation = useNavigation<AuthNavigatorRoutesProps>()

  return (
    <VStack bg={'gray.100'} flex={1}>
      <Box alignItems={'center'} bg={'gray.50'}>
        <Image alt="logo" h={300} w={360} source={LogoPng} />
      </Box>

      <Box
        pb={2}
        ml={4}
        mr={4}
        alignItems={'center'}
        justifyContent={'center'}
        marginTop={2}
      >
        <Text color={'blue.700'} fontWeight={'bold'} fontSize={'24'}>
          @iCompras
        </Text>

        <Text color={'blue.700'} fontSize={'16'}>
          Compre no aplicativo e receba em sua casa
        </Text>
      </Box>

      <VStack
        bg={'gray.200'}
        borderRadius={4}
        borderWidth={'0.2'}
        marginTop={2}
        ml={2}
        mr={2}
        padding={4}
        pb={2}
      >
        <CitySelect />

        <Box mt={4}>
          <Button
            title="Entrar como visitante"
            onPress={() => navigation.navigate('cityselect')}
          />{' '}
        </Box>
      </VStack>

      <Center mb={2}>
        <TouchableOpacity onPress={() => navigation.navigate('signin')}>
          <Center h={'50'} w={'340'} borderRadius={4} borderWidth={0.2}>
            <Text color="blue.700" fontSize="md" fontFamily="body">
              Possui cadastro? Faça Login
            </Text>
          </Center>
        </TouchableOpacity>
      </Center>
    </VStack>
  )
}
