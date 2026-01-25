import { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions } from 'react-native'
import { Box, HStack, ScrollView, Text, VStack, useToast } from 'native-base'
import { useNavigation, useRoute } from '@react-navigation/native'

import { api } from '@services/api'
import { AppError } from '@utils/AppError'
import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { SubCategoryDTO } from '@dtos/SubCategoryDTO'
import { ProductDTO } from '@dtos/ProductDTO'

import { SubCategoryFilter } from '@components/Category/SubCategoryFilter'
import { ProductCard } from '@components/Product/ProductCard'
import { Loading } from '@components/Loading'
import { HomeScreen } from '@components/HomeScreen'

/* ==============================
   📐 LAYOUT (CARROSSEL)
============================== */
const { width } = Dimensions.get('window')

const CARD_WIDTH = 160
const CARD_SPACING = 4
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING
const SIDE_PADDING = (width - CARD_WIDTH) / 2

/* ==============================
   🧾 ROTAS
============================== */
type RouteParams = {
  categoryId: string
  storeId: string
  screenkey: string
  subcategoryId?: string
  storeName?: string
}

type FetchProductsParams = {
  subcategoryId: string
  storeId: string
}

export function ProductsBySubCategory() {
  const toast = useToast()
  const navigation = useNavigation<AppNavigatorRoutesProps>()
  const route = useRoute()

  const {
    storeId,
    categoryId,
    screenkey,
    subcategoryId: initialSubcategoryId,
    storeName,
  } = route.params as RouteParams

  /* ==============================
     🧠 ESTADOS
  ============================== */
  const [subCategories, setSubCategories] = useState<SubCategoryDTO[]>([])
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  )
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const scrollX = useRef(new Animated.Value(0)).current

  /* ==============================
     🔗 ABRIR PRODUTO
  ============================== */
  function handleOpenProductDetails(productId: string) {
    navigation.navigate('productDetails', { productId })
  }

  /* ==============================
     📦 SUBCATEGORIAS
  ============================== */
  async function fetchSubCategories() {
    try {
      const { data } = await api.get<SubCategoryDTO[]>(
        '/subcategories/category',
        { params: { categoryId } },
      )

      setSubCategories(data)

      const existsFromRoute = initialSubcategoryId
        ? data.some((s) => s.id === initialSubcategoryId)
        : false

      const nextSelected = existsFromRoute
        ? initialSubcategoryId!
        : data.length > 0
        ? data[0].id
        : null

      setSelectedSubCategory(nextSelected)
    } catch {
      toast.show({
        title: 'Erro ao carregar subcategorias.',
        placement: 'top',
        bgColor: 'red.500',
      })
    }
  }

  /* ==============================
     🛒 PRODUTOS
  ============================== */
  async function fetchProductsBySubCategory({
    subcategoryId,
    storeId,
  }: FetchProductsParams) {
    try {
      setIsLoading(true)

      const { data } = await api.get<ProductDTO[]>('/products/subcategory', {
        params: { subcategoryId, storeId },
      })

      setProducts(data)
    } catch (error) {
      const title =
        error instanceof AppError ? error.message : 'Erro ao buscar produtos.'

      toast.show({
        title,
        placement: 'top',
        bgColor: 'red.500',
      })
    } finally {
      setIsLoading(false)
    }
  }

  /* ==============================
     🔄 EFEITOS
  ============================== */
  useEffect(() => {
    setSubCategories([])
    setProducts([])
    setSelectedSubCategory(null)

    fetchSubCategories()
  }, [categoryId, storeId, screenkey])

  useEffect(() => {
    if (!selectedSubCategory) return

    fetchProductsBySubCategory({
      subcategoryId: selectedSubCategory,
      storeId,
    })
  }, [selectedSubCategory, storeId])

  /* ==============================
     🖥️ RENDER
  ============================== */
  return (
    <VStack flex={1} bg="white">
      <HomeScreen title="Produtos" />

      {/* 🔒 HEADER FIXO — NOME DA LOJA */}
      {storeName && (
        <Box
          bg="white"
          px={4}
          py={2}
          borderBottomWidth={1}
          borderColor="coolGray.100"
        >
          <Text fontSize="sm" fontWeight="bold" color="coolGray.600">
            Loja
          </Text>
          <Text fontSize="md" fontWeight="700">
            {storeName}
          </Text>
        </Box>
      )}

      {/* 🔍 SUBCATEGORIAS */}
      <Box px={4} pt={3}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space={3}>
            {subCategories.map((sub) => (
              <SubCategoryFilter
                key={sub.id}
                title={sub.name}
                isActive={sub.id === selectedSubCategory}
                onPress={() => setSelectedSubCategory(sub.id)}
              />
            ))}
          </HStack>
        </ScrollView>
      </Box>

      {/* 📦 PRODUTOS */}
      {isLoading ? (
        <Loading />
      ) : (
        <Animated.FlatList
          data={products}
          keyExtractor={(item) => item.id}
          horizontal
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SIDE_PADDING,
            paddingTop: 16,
            paddingBottom: 32,
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          renderItem={({ item, index }) => {
            const inputRange = [
              (index - 1) * SNAP_INTERVAL,
              index * SNAP_INTERVAL,
              (index + 1) * SNAP_INTERVAL,
            ]

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.9, 1, 0.9],
              extrapolate: 'clamp',
            })

            const shadowOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.15, 0.35, 0.15],
              extrapolate: 'clamp',
            })

            return (
              <Animated.View
                style={{
                  width: CARD_WIDTH,
                  marginRight: CARD_SPACING,
                  transform: [{ scale }],
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowRadius: 10,
                  shadowOpacity,
                  elevation: 6,
                }}
              >
                <ProductCard
                  product={item}
                  onPress={() => handleOpenProductDetails(item.id)}
                />
              </Animated.View>
            )
          }}
          ListEmptyComponent={
            <Text textAlign="center" mt={10}>
              Nenhum produto encontrado para essa subcategoria.
            </Text>
          }
        />
      )}
    </VStack>
  )
}
