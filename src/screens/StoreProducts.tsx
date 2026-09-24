import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import { useNavigation, useRoute } from '@react-navigation/native'

import { api } from '@services/api'

import { StorePromotionHeader } from '@components/Store/StorePromotionHeader'

import { SubcategoryCard } from '@components/Product/SubcategoryCard'

import { ProductCard } from '@components/Product/ProductCard'

import { BackHome } from '@components/BackHome'

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { CartContext } from '@contexts/CartContext'

import { BannerDTO } from '@dtos/BannerDTO'
import { StoreDTO } from '@dtos/StoreDTO'
import { CategoryDTO } from '@dtos/CategoryDTO'
import { SubCategoryDTO } from '@dtos/SubCategoryDTO'
import { ProductDTO } from '@dtos/ProductDTO'
import { HomeScreen } from '@components/HomeScreen'

type RouteParams = {
  storeId: string
}

type CategoryWithImage = CategoryDTO & {
  image?: string | null
  imageUrl?: string | null
  photo?: string | null
  photoUrl?: string | null
}

type CategoryImageProps = {
  image?: string | null
}

/* =====================================
   PRODUTOS
===================================== */

const CARD_WIDTH = 150

/*
 * Espaçamento menor entre
 * os cards horizontais.
 */
const CARD_SPACING = 4

const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING

/* =====================================
   HELPERS
===================================== */

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

function isCanceledRequest(error: any) {
  return (
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.name === 'AbortError' ||
    error?.message === 'canceled'
  )
}

/* =====================================
   URL DA IMAGEM
===================================== */

function getImageUri(image?: string | null) {
  if (!image) {
    return null
  }

  const value = String(image).trim()

  if (!value) {
    return null
  }

  /*
   * URL completa.
   */
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  const baseURL = api.defaults.baseURL?.replace(/\/+$/, '')

  if (!baseURL) {
    return null
  }

  const normalizedImage = value.replace(/^\/+/, '')

  /*
   * Caminho já contendo uploads/.
   */
  if (normalizedImage.startsWith('uploads/')) {
    return `${baseURL}/${normalizedImage}`
  }

  /*
   * Apenas nome do arquivo
   * ou caminho relativo.
   */
  return `${baseURL}/uploads/${normalizedImage}`
}

/* =====================================
   IMAGEM DA CATEGORIA
===================================== */

function CategoryImage({ image }: CategoryImageProps) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [image])

  const uri = useMemo(() => getImageUri(image), [image])

  /*
   * Sem imagem:
   * não colocamos ícone padrão.
   */
  if (!uri || hasError) {
    return null
  }

  return (
    <View style={styles.categoryImageContainer}>
      <Image
        source={{
          uri,
        }}
        style={styles.categoryImage}
        resizeMode="cover"
        resizeMethod="resize"
        fadeDuration={0}
        onError={() => {
          setHasError(true)
        }}
      />
    </View>
  )
}

/* =====================================
   TELA
===================================== */

export function StoreProducts() {
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const route = useRoute()

  const { width } = useWindowDimensions()

  const params = route.params as RouteParams | undefined

  const storeId = params?.storeId

  const {
    cartItems,
    activeStoreId,
    addProductCart,
    incrementProduct,
    decrementProduct,
  } = useContext(CartContext)

  /* =====================================
     STATES
  ===================================== */

  const [store, setStore] = useState<StoreDTO | null>(null)

  const [banners, setBanners] = useState<BannerDTO[]>([])

  const [categories, setCategories] = useState<CategoryDTO[]>([])

  const [categorySelected, setCategorySelected] = useState<string | null>(null)

  const [subCategories, setSubCategories] = useState<SubCategoryDTO[]>([])

  const [subCategorySelected, setSubCategorySelected] = useState<string | null>(
    null,
  )

  const [products, setProducts] = useState<ProductDTO[]>([])

  const [updatingProductIds, setUpdatingProductIds] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [isLoadingSubCategories, setIsLoadingSubCategories] = useState(false)

  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  /* =====================================
     REQUEST REFS
  ===================================== */

  const initialControllerRef = useRef<AbortController | null>(null)

  const subCategoriesControllerRef = useRef<AbortController | null>(null)

  const productsControllerRef = useRef<AbortController | null>(null)

  const initialRequestIdRef = useRef(0)

  const subCategoryRequestIdRef = useRef(0)

  const productRequestIdRef = useRef(0)

  /* =====================================
     PADDING DOS PRODUTOS
  ===================================== */

  const sidePadding = useMemo(() => {
    return Math.max(12, (width - CARD_WIDTH) / 2)
  }, [width])

  /* =====================================
     ABRIR PRODUTO
  ===================================== */

  const handleOpenProductDetails = useCallback(
    (productId: string) => {
      if (!productId) {
        return
      }

      navigation.navigate('productDetails', {
        productId,
      })
    },
    [navigation],
  )

  /* =====================================
     QUANTIDADE NO CARRINHO
  ===================================== */

  const getCartQuantity = useCallback(
    (productId: string) => {
      if (activeStoreId !== storeId) {
        return 0
      }

      const cartItem = cartItems.find((item) => item.productId === productId)

      return safeNumber(cartItem?.quantity)
    },
    [activeStoreId, cartItems, storeId],
  )

  /* =====================================
     PRODUTO ATUALIZANDO
  ===================================== */

  const isProductUpdating = useCallback(
    (productId: string) => {
      return updatingProductIds.includes(productId)
    },
    [updatingProductIds],
  )

  const setProductUpdating = useCallback(
    (productId: string, updating: boolean) => {
      setUpdatingProductIds((current) => {
        if (updating) {
          if (current.includes(productId)) {
            return current
          }

          return [...current, productId]
        }

        return current.filter((id) => id !== productId)
      })
    },
    [],
  )

  /* =====================================
     INCREMENTAR
  ===================================== */

  const handleIncrementProduct = useCallback(
    async (currentProduct: ProductDTO) => {
      if (
        !storeId ||
        !currentProduct?.id ||
        isProductUpdating(currentProduct.id)
      ) {
        return
      }

      const stockQuantity = safeNumber(currentProduct.quantity)

      const cartQuantity = getCartQuantity(currentProduct.id)

      if (stockQuantity <= 0) {
        Alert.alert(
          'Produto esgotado',
          'Este produto não possui estoque disponível.',
        )

        return
      }

      if (cartQuantity >= stockQuantity) {
        Alert.alert(
          'Estoque insuficiente',
          'Quantidade máxima disponível atingida.',
        )

        return
      }

      try {
        setProductUpdating(currentProduct.id, true)

        if (cartQuantity === 0) {
          await addProductCart({
            productId: currentProduct.id,

            storeId,

            quantity: 1,

            product: {
              id: currentProduct.id,

              name: currentProduct.name ?? 'Produto',

              image: currentProduct.image,

              price: safeNumber(currentProduct.price),

              cashbackPercentage: safeNumber(currentProduct.cashbackPercentage),

              quantity: stockQuantity,
            },
          })
        } else {
          await incrementProduct(currentProduct.id)
        }
      } catch (error: any) {
        console.error('[StoreProducts] Erro ao adicionar:', {
          productId: currentProduct.id,

          message: error?.message,

          code: error?.code,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        Alert.alert(
          'Erro ao adicionar produto',
          error?.response?.data?.message ??
            error?.message ??
            'Não foi possível adicionar o produto.',
        )
      } finally {
        setProductUpdating(currentProduct.id, false)
      }
    },
    [
      addProductCart,
      getCartQuantity,
      incrementProduct,
      isProductUpdating,
      setProductUpdating,
      storeId,
    ],
  )

  /* =====================================
     DIMINUIR
  ===================================== */

  const handleDecrementProduct = useCallback(
    async (currentProduct: ProductDTO) => {
      if (!currentProduct?.id || isProductUpdating(currentProduct.id)) {
        return
      }

      const cartQuantity = getCartQuantity(currentProduct.id)

      if (cartQuantity <= 0) {
        return
      }

      try {
        setProductUpdating(currentProduct.id, true)

        await decrementProduct(currentProduct.id)
      } catch (error: any) {
        console.error('[StoreProducts] Erro ao diminuir:', {
          productId: currentProduct.id,

          message: error?.message,

          code: error?.code,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        Alert.alert(
          'Erro ao atualizar produto',
          error?.response?.data?.message ??
            error?.message ??
            'Não foi possível diminuir a quantidade.',
        )
      } finally {
        setProductUpdating(currentProduct.id, false)
      }
    },
    [decrementProduct, getCartQuantity, isProductUpdating, setProductUpdating],
  )

  /* =====================================
     DADOS INICIAIS
  ===================================== */

  const loadInitialData = useCallback(async () => {
    if (!storeId) {
      return
    }

    initialControllerRef.current?.abort()

    const controller = new AbortController()

    initialControllerRef.current = controller

    const requestId = ++initialRequestIdRef.current

    try {
      setIsLoading(true)

      setStore(null)

      setCategories([])

      setBanners([])

      setCategorySelected(null)

      setSubCategories([])

      setSubCategorySelected(null)

      setProducts([])

      /*
       * Banner continua sendo opcional.
       */
      const bannersPromise = api
        .get(`/stores/${storeId}/banners`, {
          signal: controller.signal,
        })
        .catch((error) => {
          if (!isCanceledRequest(error)) {
            console.warn('[StoreProducts] Falha ao carregar banners')
          }

          return {
            data: {
              banners: [],
            },
          }
        })

      const [storeResponse, categoriesResponse, bannersResponse] =
        await Promise.all([
          api.get(`/stores/${storeId}`, {
            signal: controller.signal,
          }),

          api.get(`/stores/${storeId}/categories`, {
            signal: controller.signal,
          }),

          bannersPromise,
        ])

      if (requestId !== initialRequestIdRef.current) {
        return
      }

      const storeData = storeResponse.data?.store ?? storeResponse.data

      const categoriesData =
        categoriesResponse.data?.categories ?? categoriesResponse.data ?? []

      const bannersData =
        bannersResponse.data?.banners ?? bannersResponse.data ?? []

      if (!storeData) {
        throw new Error('Loja não encontrada')
      }

      setStore(storeData)

      setCategories(Array.isArray(categoriesData) ? categoriesData : [])

      setBanners(Array.isArray(bannersData) ? bannersData.slice(0, 8) : [])
    } catch (error: any) {
      if (isCanceledRequest(error)) {
        return
      }

      console.error('[StoreProducts] Erro inicial:', {
        storeId,

        message: error?.message,

        code: error?.code,

        status: error?.response?.status,

        url: error?.config?.url,

        data: error?.response?.data,
      })

      setStore(null)

      Alert.alert(
        'Erro ao carregar loja',
        error?.response?.data?.message ??
          'Não foi possível carregar os dados da loja.',
      )
    } finally {
      if (requestId === initialRequestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [storeId])

  useEffect(() => {
    void loadInitialData()

    return () => {
      initialControllerRef.current?.abort()

      initialRequestIdRef.current += 1
    }
  }, [loadInitialData])

  /* =====================================
     SUBCATEGORIAS
  ===================================== */

  useEffect(() => {
    subCategoriesControllerRef.current?.abort()

    if (!categorySelected) {
      setSubCategories([])

      setSubCategorySelected(null)

      setProducts([])

      setIsLoadingSubCategories(false)

      return
    }

    const controller = new AbortController()

    subCategoriesControllerRef.current = controller

    const requestId = ++subCategoryRequestIdRef.current

    async function loadSubCategories() {
      try {
        setIsLoadingSubCategories(true)

        setProducts([])

        const response = await api.get('/subcategories/category', {
          signal: controller.signal,

          params: {
            categoryId: categorySelected,
          },
        })

        if (requestId !== subCategoryRequestIdRef.current) {
          return
        }

        const responseData =
          response.data?.subcategories ??
          response.data?.data ??
          response.data ??
          []

        const fetchedSubCategories: SubCategoryDTO[] = Array.isArray(
          responseData,
        )
          ? responseData
          : []

        setSubCategories(fetchedSubCategories)

        setSubCategorySelected(
          fetchedSubCategories.length > 0 ? fetchedSubCategories[0].id : null,
        )
      } catch (error: any) {
        if (isCanceledRequest(error)) {
          return
        }

        console.error('[StoreProducts] Erro nas subcategorias:', {
          message: error?.message,

          code: error?.code,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        setSubCategories([])

        setSubCategorySelected(null)

        setProducts([])

        Alert.alert('Erro', 'Não foi possível carregar as subcategorias.')
      } finally {
        if (requestId === subCategoryRequestIdRef.current) {
          setIsLoadingSubCategories(false)
        }
      }
    }

    void loadSubCategories()

    return () => {
      controller.abort()

      subCategoryRequestIdRef.current += 1
    }
  }, [categorySelected])

  /* =====================================
     PRODUTOS
  ===================================== */

  useEffect(() => {
    productsControllerRef.current?.abort()

    if (!subCategorySelected || !storeId) {
      setProducts([])

      setIsLoadingProducts(false)

      return
    }

    const controller = new AbortController()

    productsControllerRef.current = controller

    const requestId = ++productRequestIdRef.current

    async function loadProducts() {
      try {
        setIsLoadingProducts(true)

        setProducts([])

        const response = await api.get('/products/subcategory', {
          signal: controller.signal,

          params: {
            subcategoryId: subCategorySelected,

            storeId,
          },
        })

        if (requestId !== productRequestIdRef.current) {
          return
        }

        const responseData =
          response.data?.products ?? response.data?.data ?? response.data ?? []

        const fetchedProducts: ProductDTO[] = Array.isArray(responseData)
          ? responseData.filter((product) => Boolean(product?.id))
          : []

        setProducts(fetchedProducts)
      } catch (error: any) {
        if (isCanceledRequest(error)) {
          return
        }

        console.error('[StoreProducts] Erro nos produtos:', {
          message: error?.message,

          code: error?.code,

          status: error?.response?.status,

          data: error?.response?.data,
        })

        setProducts([])

        Alert.alert(
          'Erro',
          error?.response?.data?.message ??
            'Não foi possível carregar os produtos.',
        )
      } finally {
        if (requestId === productRequestIdRef.current) {
          setIsLoadingProducts(false)
        }
      }
    }

    void loadProducts()

    return () => {
      controller.abort()

      productRequestIdRef.current += 1
    }
  }, [storeId, subCategorySelected])

  /* =====================================
     CATEGORIA
  ===================================== */

  const handleCategoryPress = useCallback((categoryId: string) => {
    setCategorySelected((current) =>
      current === categoryId ? null : categoryId,
    )
  }, [])

  /* =====================================
     SUBCATEGORIA
  ===================================== */

  const handleSubCategoryPress = useCallback(
    (subCategoryId: string) => {
      if (subCategorySelected === subCategoryId) {
        return
      }

      setSubCategorySelected(subCategoryId)
    },
    [subCategorySelected],
  )

  /* =====================================
     EXTRA DATA
  ===================================== */

  const productExtraData = useMemo(
    () => ({
      cartItems,
      activeStoreId,
      updatingProductIds,
    }),
    [activeStoreId, cartItems, updatingProductIds],
  )

  /* =====================================
     CARD PRODUTO
  ===================================== */

  const renderProduct = useCallback(
    ({ item }: ListRenderItemInfo<ProductDTO>) => {
      return (
        <View style={styles.productItem}>
          <ProductCard
            product={item}
            cartQuantity={getCartQuantity(item.id)}
            isUpdating={isProductUpdating(item.id)}
            onIncrement={() => void handleIncrementProduct(item)}
            onDecrement={() => void handleDecrementProduct(item)}
            onPress={() => handleOpenProductDetails(item.id)}
          />
        </View>
      )
    },
    [
      getCartQuantity,
      handleDecrementProduct,
      handleIncrementProduct,
      handleOpenProductDetails,
      isProductUpdating,
    ],
  )

  /* =====================================
     LOADING
  ===================================== */

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <BackHome title="Loja" />

        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#00875F" />

          <Text style={styles.loadingTitle}>Carregando loja...</Text>

          <Text style={styles.loadingDescription}>
            Estamos preparando os produtos para você.
          </Text>
        </View>
      </View>
    )
  }

  /* =====================================
     ERRO
  ===================================== */

  if (!store) {
    return (
      <View style={styles.screen}>
        <BackHome title="Loja" />

        <View style={styles.errorScreen}>
          <MaterialIcons name="storefront" size={52} color="#9CA3AF" />

          <Text style={styles.errorTitle}>
            Não foi possível abrir esta loja
          </Text>

          <Text style={styles.errorDescription}>
            Verifique sua conexão e tente novamente.
          </Text>

          <Pressable
            onPress={() => void loadInitialData()}
            style={({ pressed }) => [
              styles.retryButton,

              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  /* =====================================
     RENDER CATEGORIA
  ===================================== */

  const renderCategory = ({
    item: category,
  }: ListRenderItemInfo<CategoryDTO>) => {
    const selected = categorySelected === category.id

    const categoryData = category as CategoryWithImage

    const categoryImage =
      categoryData.image ??
      categoryData.imageUrl ??
      categoryData.photo ??
      categoryData.photoUrl ??
      null

    return (
      <View style={styles.categoryContainer}>
        {/* CATEGORIA */}

        <Pressable
          onPress={() => handleCategoryPress(category.id)}
          style={({ pressed }) => [
            styles.categoryRow,

            pressed && styles.categoryPressed,
          ]}
        >
          <CategoryImage image={categoryImage} />

          <View style={styles.categoryTextContainer}>
            <Text numberOfLines={1} style={styles.categoryName}>
              {category.name}
            </Text>

            <Text style={styles.categoryHint}>
              {selected ? 'Ocultar produtos' : 'Ver produtos'}
            </Text>
          </View>

          <View style={styles.categoryArrow}>
            <MaterialIcons
              name={selected ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={25}
              color={selected ? '#00875F' : '#6B7280'}
            />
          </View>
        </Pressable>

        {/* CONTEÚDO ABERTO */}

        {selected ? (
          <View style={styles.expandedContent}>
            {/* SUBCATEGORIAS */}

            <View style={styles.subCategoryHeader}>
              <Text style={styles.subCategoryTitle}>Escolha uma opção</Text>
            </View>

            {isLoadingSubCategories ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color="#00875F" />

                <Text style={styles.inlineLoadingText}>
                  Carregando opções...
                </Text>
              </View>
            ) : subCategories.length > 0 ? (
              <FlatList
                data={subCategories}
                keyExtractor={(subcategory) => subcategory.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: subcategory }) => (
                  <SubcategoryCard
                    name={subcategory.name}
                    subcategory={subcategory.id}
                    isActive={subCategorySelected === subcategory.id}
                    onPress={() => handleSubCategoryPress(subcategory.id)}
                  />
                )}
                contentContainerStyle={styles.subCategoryList}
              />
            ) : (
              <View style={styles.emptySubCategory}>
                <Text style={styles.emptySubCategoryText}>
                  Nenhuma subcategoria encontrada
                </Text>
              </View>
            )}

            {/* PRODUTOS */}

            {isLoadingProducts ? (
              <View style={styles.productsLoading}>
                <ActivityIndicator size="small" color="#00875F" />

                <Text style={styles.productsLoadingText}>
                  Carregando produtos...
                </Text>
              </View>
            ) : products.length > 0 ? (
              <>
                <View style={styles.productsHeader}>
                  <Text style={styles.productsTitle}>Produtos</Text>

                  <Text style={styles.productsCount}>
                    {products.length}{' '}
                    {products.length === 1 ? 'produto' : 'produtos'}
                  </Text>
                </View>

                <FlatList
                  data={products}
                  extraData={productExtraData}
                  keyExtractor={(product) => product.id}
                  renderItem={renderProduct}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={SNAP_INTERVAL}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  disableIntervalMomentum
                  removeClippedSubviews={false}
                  initialNumToRender={3}
                  maxToRenderPerBatch={3}
                  windowSize={3}
                  contentContainerStyle={{
                    paddingLeft: sidePadding,

                    paddingRight: sidePadding,

                    paddingTop: 2,

                    paddingBottom: 6,
                  }}
                />
              </>
            ) : subCategorySelected ? (
              <View style={styles.emptyProducts}>
                <MaterialIcons name="inventory-2" size={32} color="#9CA3AF" />

                <Text style={styles.emptyProductsTitle}>
                  Nenhum produto encontrado
                </Text>

                <Text style={styles.emptyProductsDescription}>
                  Escolha outra subcategoria.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    )
  }

  /* =====================================
     TELA
  ===================================== */

  return (
    <View style={styles.screen}>
      {/* =================================
          CABEÇALHO FIXO
      ================================= */}

      <HomeScreen title={store.name || 'Loja'} />

      {/* =================================
          SOMENTE ESTE CONTEÚDO ROLA
      ================================= */}

      <FlatList
        data={categories}
        keyExtractor={(category) => category.id}
        renderItem={renderCategory}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        style={styles.list}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={
          <>
            {/* LOJA + BANNERS */}

            <StorePromotionHeader store={store} banners={banners} />

            {/* CATEGORIAS */}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Categorias</Text>

                <View style={styles.sectionAccent} />
              </View>

              <Text style={styles.sectionSubtitle}>Toque para explorar</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyCategories}>
            <MaterialIcons name="category" size={44} color="#9CA3AF" />

            <Text style={styles.emptyCategoriesTitle}>
              Nenhuma categoria encontrada
            </Text>

            <Text style={styles.emptyCategoriesDescription}>
              Esta loja ainda não possui categorias disponíveis.
            </Text>
          </View>
        }
        ListFooterComponent={<View style={styles.footerSpace} />}
      />
    </View>
  )
}

/* =====================================
   ESTILOS
===================================== */

const styles = StyleSheet.create({
  /* ==================================
       ESTRUTURA
    ================================== */

  screen: {
    flex: 1,

    backgroundColor: '#F9FAFB',
  },

  list: {
    flex: 1,

    width: '100%',

    backgroundColor: '#F9FAFB',
  },

  contentContainer: {
    paddingTop: 0,

    paddingBottom: 16,
  },

  /* ==================================
       CABEÇALHO CATEGORIAS
    ================================== */

  sectionHeader: {
    flexDirection: 'row',

    alignItems: 'flex-end',

    justifyContent: 'space-between',

    paddingHorizontal: 14,

    /*
     * Bem próximo dos banners.
     */
    paddingTop: 2,

    paddingBottom: 2,

    backgroundColor: '#F9FAFB',
  },

  sectionTitleContainer: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 18,

    fontWeight: '700',

    color: '#111827',
  },

  sectionAccent: {
    width: 38,

    height: 3,

    marginTop: 2,

    borderRadius: 3,

    backgroundColor: '#FACC15',
  },

  sectionSubtitle: {
    marginLeft: 8,

    marginBottom: 0,

    fontSize: 11,

    color: '#9CA3AF',
  },

  /* ==================================
       CATEGORIA
    ================================== */

  categoryContainer: {
    marginHorizontal: 8,

    marginBottom: 0,

    paddingVertical: 0,

    backgroundColor: 'transparent',
  },

  categoryRow: {
    /*
     * Mais compacto.
     */
    minHeight: 56,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 6,

    paddingVertical: 2,

    backgroundColor: 'transparent',
  },

  categoryPressed: {
    opacity: 0.65,
  },

  /* ==================================
       IMAGEM CATEGORIA
    ================================== */

  categoryImageContainer: {
    width: 46,

    height: 46,

    marginRight: 9,

    borderRadius: 23,

    overflow: 'hidden',

    backgroundColor: '#F3F4F6',
  },

  categoryImage: {
    width: '100%',

    height: '100%',
  },

  categoryTextContainer: {
    flex: 1,

    justifyContent: 'center',
  },

  categoryName: {
    fontSize: 15,

    fontWeight: '700',

    color: '#1F2937',
  },

  categoryHint: {
    marginTop: 1,

    fontSize: 10,

    color: '#9CA3AF',
  },

  categoryArrow: {
    width: 34,

    height: 34,

    marginLeft: 3,

    alignItems: 'center',

    justifyContent: 'center',
  },

  /* ==================================
       EXPANSÃO
    ================================== */

  expandedContent: {
    paddingTop: 0,

    paddingBottom: 2,

    backgroundColor: 'transparent',
  },

  /* ==================================
       SUBCATEGORIAS
    ================================== */

  subCategoryHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 8,

    paddingTop: 0,

    paddingBottom: 2,
  },

  subCategoryTitle: {
    fontSize: 11,

    fontWeight: '600',

    color: '#6B7280',
  },

  subCategoryList: {
    paddingHorizontal: 4,

    paddingVertical: 1,
  },

  inlineLoading: {
    minHeight: 54,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  inlineLoadingText: {
    marginLeft: 7,

    fontSize: 11,

    color: '#6B7280',
  },

  emptySubCategory: {
    minHeight: 56,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 16,
  },

  emptySubCategoryText: {
    fontSize: 11,

    color: '#6B7280',

    textAlign: 'center',
  },

  /* ==================================
       PRODUTOS
    ================================== */

  productsHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 10,

    paddingTop: 4,

    paddingBottom: 0,
  },

  productsTitle: {
    fontSize: 14,

    fontWeight: '700',

    color: '#111827',
  },

  productsCount: {
    fontSize: 10,

    color: '#9CA3AF',
  },

  productItem: {
    width: CARD_WIDTH,

    marginRight: CARD_SPACING,

    alignItems: 'center',

    justifyContent: 'flex-start',
  },

  productsLoading: {
    minHeight: 150,

    alignItems: 'center',

    justifyContent: 'center',
  },

  productsLoadingText: {
    marginTop: 6,

    fontSize: 11,

    color: '#6B7280',
  },

  emptyProducts: {
    minHeight: 110,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 24,

    paddingBottom: 4,
  },

  emptyProductsTitle: {
    marginTop: 6,

    fontSize: 13,

    fontWeight: '600',

    color: '#4B5563',
  },

  emptyProductsDescription: {
    marginTop: 2,

    fontSize: 11,

    color: '#9CA3AF',

    textAlign: 'center',
  },

  /* ==================================
       LOADING
    ================================== */

  loadingScreen: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,

    backgroundColor: '#F9FAFB',
  },

  loadingTitle: {
    marginTop: 12,

    fontSize: 16,

    fontWeight: '600',

    color: '#374151',
  },

  loadingDescription: {
    marginTop: 4,

    fontSize: 13,

    color: '#9CA3AF',

    textAlign: 'center',
  },

  /* ==================================
       ERRO
    ================================== */

  errorScreen: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 32,

    backgroundColor: '#F9FAFB',
  },

  errorTitle: {
    marginTop: 12,

    fontSize: 18,

    fontWeight: '700',

    color: '#374151',

    textAlign: 'center',
  },

  errorDescription: {
    marginTop: 6,

    fontSize: 14,

    lineHeight: 20,

    color: '#6B7280',

    textAlign: 'center',
  },

  retryButton: {
    minHeight: 44,

    marginTop: 18,

    paddingHorizontal: 22,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: '#00875F',
  },

  retryButtonText: {
    fontSize: 14,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  /* ==================================
       SEM CATEGORIAS
    ================================== */

  emptyCategories: {
    paddingHorizontal: 30,

    paddingVertical: 42,

    alignItems: 'center',
  },

  emptyCategoriesTitle: {
    marginTop: 10,

    fontSize: 15,

    fontWeight: '700',

    color: '#4B5563',

    textAlign: 'center',
  },

  emptyCategoriesDescription: {
    marginTop: 5,

    fontSize: 12,

    lineHeight: 18,

    color: '#9CA3AF',

    textAlign: 'center',
  },

  footerSpace: {
    height: 12,
  },

  pressed: {
    opacity: 0.7,
  },
})
