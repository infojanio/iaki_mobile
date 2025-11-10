import React, { useEffect, useState } from 'react'
import {
  VStack,
  Text,
  FlatList,
  useToast,
  Box,
  HStack,
  Select,
  CheckIcon,
  Spinner,
} from 'native-base'
import { useNavigation } from '@react-navigation/native'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { MaterialIcons } from '@expo/vector-icons'
import { ProductDTO } from '@dtos/ProductDTO'
import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { ProductCard } from '@components/Product/ProductCard'
import { TouchableOpacity } from 'react-native'
import { HomeScreen } from '@components/HomeScreen'

export function AllProductsQuantity() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [quantityFilter, setQuantityFilter] = useState<string>('all')

  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const toast = useToast()

  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', { productId })
  }

  function handleViewAllCashbacks() {
    navigation.navigate('allProductsQuantity')
  }

  const applyQuantityFilter = (productsList: ProductDTO[], filter: string) => {
    let filtered = [...productsList]
    switch (filter) {
      case '5':
        filtered = productsList.filter((product) => product.quantity < 5)
        break
      case '10':
        filtered = productsList.filter((product) => product.quantity < 10)
        break
      case '15':
        filtered = productsList.filter((product) => product.quantity < 15)
        break
      default:
        filtered = productsList
    }
    setFilteredProducts(filtered)
  }

  const handleQuantityFilterChange = (value: string) => {
    setQuantityFilter(value)
    applyQuantityFilter(products, value)
  }

  async function fetchProductByQuantity() {
    try {
      setIsLoading(true)
      const response = await api.get('/products/quantity')
      setProducts(response.data)
      applyQuantityFilter(response.data, quantityFilter)
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
    <VStack flex={1} bg={'gray.100'} alignItems={'initial'} h={300}>
      <HomeScreen title="Esgotando" />

      <Box px={4} py={2} bg="primary.100" mx={4} my={2} borderRadius="md">
        <HStack alignItems="center" space={1}>
          <MaterialIcons name="local-offer" size={18} color="#00875F" />
          <Text color="#00875F" fontWeight="bold">
            Todos os produtos oferecem cashback!
          </Text>
        </HStack>
      </Box>

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
            <TouchableOpacity onPress={handleViewAllCashbacks}>
              <Box
                mr={6}
                borderBottomWidth={'3.5'}
                borderColor={'yellow.300'}
                borderRadius={'md'}
              ></Box>
            </TouchableOpacity>
          </HStack>
          <Box ml={2} width={20} height={1} bg={'yellow.300'}>
            {''}
          </Box>
        </VStack>

        {/* Filtro por quantidade */}
        <Box px={4} mb={2}>
          <Select
            selectedValue={quantityFilter}
            minWidth="200"
            accessibilityLabel="Filtrar por quantidade"
            placeholder="Filtrar por quantidade"
            _selectedItem={{
              bg: 'yellow.100',
              endIcon: <CheckIcon size="5" />,
            }}
            mt={1}
            onValueChange={handleQuantityFilterChange}
          >
            <Select.Item label="Todos os produtos" value="all" />
            <Select.Item label="Quantidade < 5" value="5" />
            <Select.Item label="Quantidade < 10" value="10" />
            <Select.Item label="Quantidade < 15" value="15" />
          </Select>
        </Box>

        {isLoading ? (
          <Spinner color="yellow.500" size="lg" />
        ) : (
          <FlatList
            data={filteredProducts}
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
            ListEmptyComponent={
              <Text textAlign="center" mt={4} color="gray.500">
                Nenhum produto encontrado com esse filtro.
              </Text>
            }
          />
        )}
      </VStack>
    </VStack>
  )
}
