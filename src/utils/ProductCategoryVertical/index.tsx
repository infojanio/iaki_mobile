import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import {
  Heading,
  HStack,
  Image,
  VStack,
  Text,
  Icon,
  Center,
  Box,
} from 'native-base'
import { Entypo } from '@expo/vector-icons'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { useNavigation } from '@react-navigation/native'
import { Button } from '@components/Button'

type Props = TouchableOpacityProps & {}

export function ProductCategoryVertical({ ...rest }: Props) {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  //abrir detalhes do produto
  function handleOpenProductDetails() {
    navigation.navigate('productDetails')
  }

  return (
    <HStack flex="1" ml={1} mb={1} bg="gray.50" borderWidth={0.17}>
      <VStack
        bg="gray.100"
        mt={2}
        ml={2}
        rounded="md"
        mb="2"
        borderWidth={0.17}
      >
        <Center>
          <Image
            source={{
              uri:
                'https://appmercados.com.br/inc/timthumb.php?w=800&h=800&zc=2&src=%2Fuploads%2Fa7dfd128a12ae1a9986401df2cd1659a.png',
            }}
            alt="imagem de carnes"
            w={24}
            h={24}
            rounded="md"
            mt={4}
            mr={2}
            ml={2}
            resizeMode="cover"
          />

          <HStack mb="1">
            <Text>R$</Text>
            <Heading ml={2} mr={2} mb={1} fontSize="16" color="red.700">
              39,90
            </Heading>
            <Box bg="red.500" rounded="md" pl="1" pr="1" mb={2}>
              <Text fontSize="12" color="gray.100" numberOfLines={1}>
                Kg
              </Text>
            </Box>
          </HStack>

          <Box flex={1} h={10} w={24}>
            <Text fontSize="13" numberOfLines={2}>
              Carne Paleta Bovina Congelada
            </Text>
          </Box>

          <Center px={2} mb={4} mt={2}>
            <Button
              title="Adicionar"
              h={9}
              w={24}
              onPress={handleOpenProductDetails}
            />
          </Center>
        </Center>
      </VStack>
    </HStack>
  )
}
