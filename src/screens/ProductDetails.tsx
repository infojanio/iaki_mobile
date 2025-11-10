// src/screens/ProductDetailsScreen.tsx

import { useRoute, useNavigation } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import {
  VStack,
  ScrollView,
  Image,
  Text,
  Heading,
  Box,
  Center,
  useToast,
  HStack,
  Divider,
} from 'native-base'

import { Button } from '@components/Button'
import { Loading } from '@components/Loading'
import { useCart } from '@hooks/useCart'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { HomeScreen } from '@components/HomeScreen'

type RouteParams = {
  productId: string
}

type Product = {
  id: string
  name: string
  description: string
  price: number
  image: string
  cashback_percentage: number
  store: {
    id: string
    name: string
  }
}

export function ProductDetails() {
  const route = useRoute()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const { productId } = route.params as RouteParams
  const { addProductCart } = useCart()
  const toast = useToast()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  //voltar a tela anterior
  function handleGoBack() {
    navigation.goBack()
  }

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await api.get(`/products/${productId}`)
        const data = res.data

        setProduct({
          ...data,
          price: Number(data.price),
          cashback_percentage: Number(data.cashback_percentage),
        })
      } catch (error) {
        const title =
          error instanceof AppError
            ? error.message
            : 'Erro ao carregar os detalhes do produto'

        toast.show({
          title,
          placement: 'top',
          bgColor: 'red.500',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  function handleAddToCart() {
    if (!product) return

    addProductCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1,
      cashback_percentage: product.cashback_percentage,
      storeId: product.store.id,
    })

    toast.show({
      title: 'Produto adicionado ao carrinho!',
      placement: 'top',
      bgColor: 'green.500',
    })

    navigation.navigate('cart') // se desejar ir direto ao carrinho
  }

  if (loading || !product) return <Loading />

  return (
    <VStack flex={1} bg="white">
      <HomeScreen title={' Detalhes do produto'} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Box bg="white" borderRadius="3xl" shadow={5} mt={4} ml={4} mr={4}>
          <Image
            source={{ uri: product.image }}
            alt="Imagem do produto"
            w="full"
            h={200}
            resizeMode="contain"
          />
        </Box>

        <VStack px={6} mt={4} space={4}>
          <Box bg="white" p={4} borderRadius="2xl" shadow={2}>
            <Heading fontSize="xl" color="gray.800" mb={1}>
              {product.name}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Vendido por {product.store?.name}
            </Text>

            <Divider my={3} />

            <HStack justifyContent="space-between" alignItems="center" mb={2}>
              <Text fontSize="20" fontWeight="bold" color="red.600">
                R$ {product.price.toFixed(2)}
              </Text>
              <Text fontSize="16" color="green.600" fontWeight="medium">
                {product.cashback_percentage}% de cashback
              </Text>
            </HStack>

            <Text fontSize="md" color="gray.700" lineHeight="lg">
              {product.description}
            </Text>
          </Box>

          <Button title="Adicionar ao Carrinho" onPress={handleAddToCart} />
        </VStack>
      </ScrollView>
    </VStack>
  )
}
