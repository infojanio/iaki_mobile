import { useEffect, useState } from 'react'
import { VStack, Text, FlatList, useToast, Box, HStack } from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { ProductDTO } from '@dtos/ProductDTO'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { ProductCard } from '@components/Product/ProductCard'
import { TouchableOpacity } from 'react-native'

export function ProductQuantity() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const toast = useToast()

  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', { productId })
  }

  function handleViewAllByQuantity() {
    // Aqui você pode redirecionar para uma tela de "todos os produtos com cashback", se quiser
    navigation.navigate('allProductsQuantity')
  }

  //listar as subcategories no select
  async function fetchProductByQuantity() {
    try {
      setIsLoading(true)

      const response = await api.get('/products/quantity')
      setProducts(response.data)
    } catch (error) {
      const isAppError = error instanceof AppError
      const title = isAppError
        ? error.message
        : 'Não foi possível carregar os produtos que estão esgotando!'

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
    fetchProductByQuantity()
  }, [])

  return (
    <VStack flex={1} bg={'gray.100'} alignItems={'initial'} h={240}>
      <VStack>
        <VStack justifyContent={'space-between'} ml={1} mb={1}>
          <HStack justifyContent={'space-between'} mr={2}>
            <Text
              fontSize={'md'}
              color={'black.200'}
              fontWeight={'semibold'}
              ml={'2'}
            >
              Tá acabando
            </Text>
            <TouchableOpacity onPress={handleViewAllByQuantity}>
              <Box
                mr={6}
                borderBottomWidth={'3.5'}
                borderColor={'yellow.300'}
                borderRadius={'md'}
              >
                <Text
                  fontSize={'sm'}
                  color={'green.700'}
                  fontWeight={'semibold'}
                  ml={'2'}
                >
                  Ver todos
                </Text>
              </Box>
            </TouchableOpacity>
          </HStack>
          <Box ml={2} width={20} height={1} bg={'yellow.300'}>
            {''}
          </Box>
        </VStack>

        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleOpenProductDetails(item.id)}
            />
          )}
          numColumns={1}
          _contentContainerStyle={{
            marginLeft: 3,
            paddingBottom: 32,
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </VStack>
    </VStack>
  )
}
