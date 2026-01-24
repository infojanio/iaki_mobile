import { HomeScreen } from '@components/HomeScreen'
import { Platform } from 'react-native'
import { useEffect, useState, useContext } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import {
  Heading,
  Image,
  ScrollView,
  Text,
  VStack,
  useToast,
  Center,
  Box,
} from 'native-base'

import { Input } from '@components/Input'
import { Button } from '@components/Button'
import { Loading } from '@components/Loading'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { ProductDTO } from '@dtos/ProductDTO'

import { CartContext } from '@contexts/CartContext'

type RouteParamsProps = {
  productId: string
}

export function ProductDetails() {
  const route = useRoute()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const { productId } = route.params as RouteParamsProps

  const toast = useToast()
  const { ensureStoreContext, addProductCart } = useContext(CartContext)

  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState('1')
  const [product, setProduct] = useState<ProductDTO>({} as ProductDTO)

  /* ==============================
     📦 FETCH PRODUTO
  ============================== */
  async function fetchProductDetails() {
    try {
      setIsLoading(true)

      const response = await api.get(`/products/${productId}`)
      setProduct(response.data)
    } catch (error) {
      const title =
        error instanceof AppError
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

  useEffect(() => {
    fetchProductDetails()
  }, [productId])

  /* ==============================
     ➕ ADD AO CARRINHO
     (ÚNICO ponto que garante loja)
  ============================== */
  async function handleAddProductToCart() {
    if (!product.id || !product.store_id) {
      toast.show({
        title: 'Produto inválido',
        placement: 'top',
        bgColor: 'red.500',
      })
      return
    }

    const canProceed = await ensureStoreContext(product.store_id)
    if (!canProceed) return

    try {
      await addProductCart({
        productId: product.id,
        storeId: product.store_id,
        quantity: Number(quantity),
      })

      toast.show({
        title: 'Produto adicionado ao carrinho',
        placement: 'top',
        bgColor: 'green.500',
      })

      navigation.navigate('cart')
    } catch (error: any) {
      toast.show({
        title: 'Erro',
        description:
          error?.response?.data?.message ??
          'Não foi possível adicionar o produto ao carrinho',
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  /* ==============================
     🖥️ RENDER
  ============================== */
  return (
    <VStack flex={1}>
      <HomeScreen title="Detalhes do produto" />

      {isLoading ? (
        <Loading />
      ) : (
        <ScrollView>
          <Center mt={4}>
            <Heading color="green.700" fontSize="18" mb={2}>
              {product.name}
            </Heading>
          </Center>

          <Box alignItems="center" rounded="lg" mb={2}>
            <Image
              source={{ uri: product.image }}
              w={48}
              h={48}
              resizeMode={Platform.OS === 'android' ? 'contain' : 'cover'}
              alt="Imagem do produto"
              rounded="lg"
            />
          </Box>

          <VStack mx={4}>
            <VStack alignItems="center">
              <Text color="red.500" fontSize="18" fontWeight="bold" mb={2}>
                R$ {product.price}
              </Text>

              <Text mb={1}>Quantidade</Text>

              <Input
                onChangeText={setQuantity}
                keyboardType="numeric"
                textAlign="center"
                value={quantity}
                placeholder="Quantidade"
              />
            </VStack>

            <Button
              mt={4}
              title="Adicionar ao carrinho"
              onPress={handleAddProductToCart}
            />
          </VStack>
        </ScrollView>
      )}
    </VStack>
  )
}
