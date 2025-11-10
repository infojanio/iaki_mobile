import { HomeScreen } from '@components/HomeScreen'

import { Platform } from 'react-native'
import { useCallback, useEffect, useState } from 'react'
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native'
import {
  Heading,
  Image,
  ScrollView,
  Text,
  VStack,
  useToast,
  HStack,
  Center,
  Box,
} from 'native-base'

import { useCart } from '../../hooks/useCart'

import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import { AppError } from '@utils/AppError'

import { api } from '@services/api'
import { ProductDTO } from '@dtos/ProductDTO'
import { Loading } from '@components/Loading'

type RouteParamsProps = {
  productId: string
}

export function ProductDetails() {
  const [isLoading, setIsLoading] = useState(true)
  const [size, setSize] = useState('35')
  const [quantity, setQuantity] = useState('1')
  const [product, setProduct] = useState<ProductDTO>({} as ProductDTO)

  const [productSelected, setProductSelected] = useState(product.id)

  const toast = useToast()
  const { navigate } = useNavigation()
  const { addProductCart } = useCart()

  const route = useRoute()
  const { productId } = route.params as RouteParamsProps
  console.log('ID =>', productId)

  //listar as subcategories no select
  async function fetchProductDetails() {
    try {
      setIsLoading(true)

      const response = await api.get(`/products/${productId}`)
      setProduct(response.data)
      console.log(response.data)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível carregar os detalhes do produto'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddProductToCart() {
    try {
      await addProductCart({
        id: product.id,
        name: product.name,
        image: product.image,
        quantity: Number(product.quantity),
        price: Number(product.price),
        //size: product.size,
      })

      toast.show({
        title: 'Produto adicionado no carrinho',
        placement: 'top',
        bgColor: 'green.500',
      })

      navigate('cart')
    } catch (error) {
      toast.show({
        title: 'Não foi possível adicionar o produto no carrinho',
        placement: 'top',
        bgColor: 'reed.500',
      })
    }
  }

  useEffect(() => {
    fetchProductDetails()
  }, [productId])

  return (
    <VStack flex={1}>
      <HomeScreen title="Detalhes do produto" />

      {isLoading ? (
        <Loading />
      ) : (
        <ScrollView>
          <Center mt={4}>
            <Heading color="green.700" fontFamily="body" fontSize="18" mb={2}>
              {product.name}
            </Heading>
          </Center>
          <Box alignItems={'center'} rounded="lg" mb={2} overflow={'hidden'}>
            <Image
              key={String(new Date().getTime())}
              source={{
                uri: product.image, //busca a URL da imagem
                //uri: `${api.defaults.baseURL}/images/thumb/${data.image}`, //busca o arquivo salvo no banco
              }}
              w={48}
              h={48}
              resizeMode={Platform.OS === 'android' ? 'contain' : 'cover'}
              alt="Imagem do produto"
              rounded={'lg'}
            />
          </Box>

          <VStack ml={4} mr={4}>
            <VStack w="full" justifyContent="space-between" alignItems="center">
              <VStack padding={4}>
                <Text
                  color="red.500"
                  fontSize="18"
                  fontFamily="heading"
                  fontWeight={'bold'}
                >
                  R$ {product.price}
                </Text>
              </VStack>

              <VStack alignItems="flex-end">
                <Text color="gray.700" fontSize="16" textAlign="justify" pt={2}>
                  Quantidade
                </Text>

                <Input
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  textAlign="center"
                  value={quantity}
                  w={24}
                />
              </VStack>
            </VStack>

            <Text
              color="gray.700"
              fontSize="md"
              textAlign="justify"
              pt={2}
              mb={2}
            >
              {productSelected /*product.available*/}
            </Text>

            {/*  colocar condição: se if(categoria === sapato)

          <Sizes onSelect={setSize} selected={size} />
          
          */}
            <Button
              title="Adicionar ao carrinho"
              onPress={handleAddProductToCart}
            />
          </VStack>
        </ScrollView>
      )}
    </VStack>
  )
}
