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

import { AppNavigatorRoutesProps } from '@routes/app.routes'

import { CartContext } from '@contexts/CartContext'

import { BannerDTO } from '@dtos/BannerDTO'
import { StoreDTO } from '@dtos/StoreDTO'
import { CategoryDTO } from '@dtos/CategoryDTO'
import { SubCategoryDTO } from '@dtos/SubCategoryDTO'
import { ProductDTO } from '@dtos/ProductDTO'

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

const CARD_WIDTH = 150
const CARD_SPACING = 8

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
   MONTAR URL DA IMAGEM
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
   * Já veio como:
   *
   * uploads/arquivo.jpg
   */
  if (normalizedImage.startsWith('uploads/')) {
    return `${baseURL}/${normalizedImage}`
  }

  /*
   * Somente nome do arquivo
   * ou outro caminho relativo.
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
   * Se não houver imagem,
   * simplesmente não exibe ícone.
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
     ESPAÇAMENTO DA LISTA HORIZONTAL
  ===================================== */

  const sidePadding = useMemo(() => {
    return Math.max(16, (width - CARD_WIDTH) / 2)
  }, [width])

  /* =====================================
     ABRIR DETALHES
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
      /*
       * Esta tela possui somente
       * produtos da loja atual.
       */
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
     ADICIONAR / INCREMENTAR
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
     CARREGAR LOJA / CATEGORIAS / BANNERS
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

      /*
       * Limpa dados da loja anterior.
       */
      setStore(null)
      setCategories([])
      setBanners([])

      setCategorySelected(null)

      setSubCategories([])

      setSubCategorySelected(null)

      setProducts([])

      /*
       * Banner é opcional.
       *
       * Se der problema, a loja
       * continua funcionando.
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
     CARREGAR SUBCATEGORIAS
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
     CARREGAR PRODUTOS
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
     SELECIONAR CATEGORIA
  ===================================== */

  const handleCategoryPress = useCallback((categoryId: string) => {
    setCategorySelected((current) =>
      current === categoryId ? null : categoryId,
    )
  }, [])

  /* =====================================
     SELECIONAR SUBCATEGORIA
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
     EXTRA DATA PRODUTOS
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
     CARD DE PRODUTO
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
     LOADING INICIAL
  ===================================== */

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#00875F" />

        <Text style={styles.loadingTitle}>Carregando loja...</Text>

        <Text style={styles.loadingDescription}>
          Estamos preparando os produtos para você.
        </Text>
      </View>
    )
  }

  /* =====================================
     ERRO DA LOJA
  ===================================== */

  if (!store) {
    return (
      <View style={styles.errorScreen}>
        <MaterialIcons name="storefront" size={58} color="#9CA3AF" />

        <Text style={styles.errorTitle}>Não foi possível abrir esta loja</Text>

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

    /*
     * Tenta os nomes mais comuns.
     *
     * Se seu DTO usa "image",
     * esse será o primeiro.
     */
    const categoryImage =
      categoryData.image ??
      categoryData.imageUrl ??
      categoryData.photo ??
      categoryData.photoUrl ??
      null

    return (
      <View style={styles.categoryContainer}>
        {/* =========================
              CATEGORIA
          ========================= */}

        <Pressable
          onPress={() => handleCategoryPress(category.id)}
          style={({ pressed }) => [
            styles.categoryRow,

            pressed && styles.categoryPressed,
          ]}
        >
          {/* IMAGEM REAL */}

          <CategoryImage image={categoryImage} />

          {/* NOME */}

          <View style={styles.categoryTextContainer}>
            <Text numberOfLines={1} style={styles.categoryName}>
              {category.name}
            </Text>

            <Text style={styles.categoryHint}>
              {selected ? 'Ocultar produtos' : 'Ver produtos'}
            </Text>
          </View>

          {/* SETA */}

          <View style={styles.categoryArrow}>
            <MaterialIcons
              name={selected ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={27}
              color={selected ? '#00875F' : '#6B7280'}
            />
          </View>
        </Pressable>

        {/* =========================
              CONTEÚDO ABERTO
          ========================= */}

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

                    paddingTop: 5,

                    paddingBottom: 12,
                  }}
                />
              </>
            ) : subCategorySelected ? (
              <View style={styles.emptyProducts}>
                <MaterialIcons name="inventory-2" size={34} color="#9CA3AF" />

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
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      ListHeaderComponent={
        <>
          {/* BANNERS / LOJA */}

          <StorePromotionHeader store={store} banners={banners} />

          {/* TÍTULO DAS CATEGORIAS */}

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
          <MaterialIcons name="category" size={50} color="#9CA3AF" />

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
  )
}

/* =====================================
   ESTILOS
===================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#F7F8FA',
  },

  contentContainer: {
    paddingBottom: 24,
  },

  /* ==================================
       CABEÇALHO CATEGORIAS
    ================================== */

  sectionHeader: {
    flexDirection: 'row',

    alignItems: 'flex-end',

    justifyContent: 'space-between',

    paddingHorizontal: 16,

    /*
     * Espaço reduzido entre
     * banner e categorias.
     */
    paddingTop: 5,

    paddingBottom: 4,

    backgroundColor: '#F7F8FA',
  },

  sectionTitleContainer: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 19,

    fontWeight: '700',

    color: '#111827',
  },

  sectionAccent: {
    width: 42,

    height: 3,

    marginTop: 4,

    borderRadius: 3,

    backgroundColor: '#FACC15',
  },

  sectionSubtitle: {
    marginLeft: 12,

    marginBottom: 1,

    fontSize: 11,

    color: '#9CA3AF',
  },

  /* ==================================
       CATEGORIA
    ================================== */

  categoryContainer: {
    /*
     * Sem card externo.
     *
     * Sem fundo.
     * Sem borderRadius.
     * Sem elevation.
     */
    marginHorizontal: 10,

    marginBottom: 0,

    backgroundColor: 'transparent',
  },

  categoryRow: {
    minHeight: 68,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 8,

    paddingVertical: 6,

    backgroundColor: 'transparent',
  },

  categoryPressed: {
    opacity: 0.65,
  },

  /* ==================================
       IMAGEM CATEGORIA
    ================================== */

  categoryImageContainer: {
    width: 54,

    height: 54,

    marginRight: 12,

    borderRadius: 13,

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
    fontSize: 16,

    fontWeight: '700',

    color: '#1F2937',
  },

  categoryHint: {
    marginTop: 2,

    fontSize: 11,

    color: '#9CA3AF',
  },

  categoryArrow: {
    width: 38,

    height: 38,

    marginLeft: 6,

    alignItems: 'center',

    justifyContent: 'center',
  },

  /* ==================================
       EXPANSÃO
    ================================== */

  expandedContent: {
    paddingTop: 0,

    paddingBottom: 4,

    /*
     * Sem caixa adicional.
     */
    backgroundColor: 'transparent',
  },

  /* ==================================
       SUBCATEGORIAS
    ================================== */

  subCategoryHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 10,

    paddingTop: 2,

    paddingBottom: 3,
  },

  subCategoryTitle: {
    fontSize: 12,

    fontWeight: '600',

    color: '#6B7280',
  },

  subCategoryList: {
    paddingHorizontal: 6,

    paddingVertical: 3,
  },

  inlineLoading: {
    minHeight: 62,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  inlineLoadingText: {
    marginLeft: 8,

    fontSize: 12,

    color: '#6B7280',
  },

  emptySubCategory: {
    minHeight: 65,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 20,
  },

  emptySubCategoryText: {
    fontSize: 12,

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

    paddingHorizontal: 12,

    paddingTop: 8,

    paddingBottom: 2,
  },

  productsTitle: {
    fontSize: 15,

    fontWeight: '700',

    color: '#111827',
  },

  productsCount: {
    fontSize: 11,

    color: '#9CA3AF',
  },

  productItem: {
    width: CARD_WIDTH,

    marginRight: CARD_SPACING,

    alignItems: 'center',

    justifyContent: 'flex-start',
  },

  productsLoading: {
    minHeight: 170,

    alignItems: 'center',

    justifyContent: 'center',
  },

  productsLoadingText: {
    marginTop: 8,

    fontSize: 12,

    color: '#6B7280',
  },

  emptyProducts: {
    minHeight: 130,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,

    paddingBottom: 8,
  },

  emptyProductsTitle: {
    marginTop: 8,

    fontSize: 14,

    fontWeight: '600',

    color: '#4B5563',
  },

  emptyProductsDescription: {
    marginTop: 3,

    fontSize: 12,

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

    backgroundColor: '#FFFFFF',
  },

  loadingTitle: {
    marginTop: 14,

    fontSize: 16,

    fontWeight: '600',

    color: '#374151',
  },

  loadingDescription: {
    marginTop: 5,

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

    backgroundColor: '#FFFFFF',
  },

  errorTitle: {
    marginTop: 14,

    fontSize: 18,

    fontWeight: '700',

    color: '#374151',

    textAlign: 'center',
  },

  errorDescription: {
    marginTop: 7,

    fontSize: 14,

    lineHeight: 20,

    color: '#6B7280',

    textAlign: 'center',
  },

  retryButton: {
    minHeight: 46,

    marginTop: 22,

    paddingHorizontal: 24,

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
       CATEGORIAS VAZIAS
    ================================== */

  emptyCategories: {
    paddingHorizontal: 30,

    paddingVertical: 50,

    alignItems: 'center',
  },

  emptyCategoriesTitle: {
    marginTop: 12,

    fontSize: 16,

    fontWeight: '700',

    color: '#4B5563',

    textAlign: 'center',
  },

  emptyCategoriesDescription: {
    marginTop: 6,

    fontSize: 13,

    lineHeight: 19,

    color: '#9CA3AF',

    textAlign: 'center',
  },

  footerSpace: {
    height: 20,
  },

  pressed: {
    opacity: 0.7,
  },
})
