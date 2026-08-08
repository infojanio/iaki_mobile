import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { api } from '@services/api'
import { cartService } from '@services/cartService'

import { useAuth } from '@hooks/useAuth'
import { useCity } from '@hooks/useCity'

/* ==============================
   TIPOS
============================== */

export type CartItem = {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  cashbackPercentage: number
  storeId: string
  stock: number
}

type AddToCartProduct = {
  id: string
  name: string
  image?: string | null
  price: number
  cashbackPercentage?: number | null

  /*
   * Quantidade disponível em estoque.
   */
  quantity: number
}

export type AddToCartInput = {
  productId: string
  storeId: string
  quantity: number

  /*
   * Opcional para manter compatibilidade com as chamadas atuais.
   *
   * Quando enviado, permite adicionar o produto ao estado local
   * imediatamente, sem buscar novamente o carrinho.
   */
  product?: AddToCartProduct
}

type ConfirmStoreChangeState = {
  visible: boolean
  onConfirm: (() => void) | null
  onCancel: (() => void) | null
}

type CartContextData = {
  cartItems: CartItem[]
  activeStoreId: string | null
  activeStoreName: string | null
  cartBadgeCount: number

  syncCartBadge: () => Promise<void>
  ensureStoreContext: (storeId: string) => Promise<boolean>

  addProductCart: (data: AddToCartInput) => Promise<void>
  incrementProduct: (productId: string) => Promise<void>
  decrementProduct: (productId: string) => Promise<void>
  removeProductCart: (productId: string) => Promise<void>

  fetchCart: (storeId: string) => Promise<void>
  checkout: () => Promise<void>
  resetCartContext: () => void
  syncOpenCart: () => Promise<string | undefined>

  confirmStoreChange: ConfirmStoreChangeState
}

export const CartContext = createContext({} as CartContextData)

const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/150'

/* ==============================
   PROVIDER
============================== */

export function CartProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const { city } = useCity()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
  const [activeStoreName, setActiveStoreName] = useState<string | null>(null)
  const [cartBadgeCount, setCartBadgeCount] = useState(0)

  const [confirmStoreChange, setConfirmStoreChange] =
    useState<ConfirmStoreChangeState>({
      visible: false,
      onConfirm: null,
      onCancel: null,
    })

  /*
   * Impede duas requisições simultâneas para o mesmo produto.
   *
   * O useRef é usado porque não precisamos renderizar o Provider
   * sempre que um produto entra ou sai da fila.
   */
  const pendingProductsRef = useRef<Set<string>>(new Set())

  /*
   * Evita que uma resposta antiga de fetchCart sobrescreva
   * uma resposta mais recente.
   */
  const fetchRequestIdRef = useRef(0)

  /*
   * Mantém acesso aos itens mais recentes dentro de callbacks
   * assíncronos, evitando closures desatualizadas.
   */
  const cartItemsRef = useRef<CartItem[]>([])

  useEffect(() => {
    cartItemsRef.current = cartItems
  }, [cartItems])

  /* ==============================
     FUNÇÕES AUXILIARES
  ============================== */

  const normalizeImage = useCallback((rawImage?: string | null) => {
    if (!rawImage) {
      return DEFAULT_PRODUCT_IMAGE
    }

    if (rawImage.startsWith('http')) {
      return rawImage
    }

    const baseURL = api.defaults.baseURL?.replace(/\/+$/, '')

    if (!baseURL) {
      return DEFAULT_PRODUCT_IMAGE
    }

    const normalizedImage = rawImage.replace(/^\/+/, '')

    if (normalizedImage.startsWith('uploads/')) {
      return `${baseURL}/${normalizedImage}`
    }

    return `${baseURL}/uploads/${normalizedImage}`
  }, [])

  const updateCartItems = useCallback(
    (updater: (currentItems: CartItem[]) => CartItem[], badgeVariation = 0) => {
      setCartItems((currentItems) => {
        const updatedItems = updater(currentItems)
        cartItemsRef.current = updatedItems

        return updatedItems
      })

      if (badgeVariation !== 0) {
        setCartBadgeCount((current) => Math.max(0, current + badgeVariation))
      }
    },
    [],
  )

  const acquireProductLock = useCallback((productId: string) => {
    if (pendingProductsRef.current.has(productId)) {
      return false
    }

    pendingProductsRef.current.add(productId)

    return true
  }, [])

  const releaseProductLock = useCallback((productId: string) => {
    pendingProductsRef.current.delete(productId)
  }, [])

  /* ==============================
     FETCH CART
  ============================== */

  const fetchCart = useCallback(
    async (storeId: string) => {
      if (!storeId) return

      const requestId = ++fetchRequestIdRef.current

      try {
        const cart = await cartService.getCartFromBackend(storeId)

        /*
         * Ignora a resposta se outra requisição foi iniciada depois.
         */
        if (requestId !== fetchRequestIdRef.current) {
          return
        }

        const normalizedItems: CartItem[] = (cart?.items ?? [])
          .map((item: any): CartItem | null => {
            const product = item?.product

            if (!product?.id) {
              return null
            }

            return {
              productId: product.id,
              name: product.name ?? 'Produto',
              image: normalizeImage(product.image),
              price: Number(item.priceSnapshot ?? product.price ?? 0),
              quantity: Number(item.quantity ?? 0),
              cashbackPercentage: Number(
                item.cashbackSnapshot ?? product.cashbackPercentage ?? 0,
              ),
              storeId,
              stock: Number(product.quantity ?? 0),
            }
          })
          .filter((item: CartItem | null): item is CartItem => Boolean(item))

        cartItemsRef.current = normalizedItems

        setCartItems(normalizedItems)
        setActiveStoreId(storeId)
        setActiveStoreName(cart?.storeName ?? cart?.store?.name ?? null)

        setCartBadgeCount(
          normalizedItems.reduce((total, item) => total + item.quantity, 0),
        )
      } catch (error) {
        console.error('[CartContext] fetchCart error:', error)
        throw error
      }
    },
    [normalizeImage],
  )

  /* ==============================
     SINCRONIZAÇÃO DO BADGE
  ============================== */

  const syncCartBadge = useCallback(async () => {
    try {
      const openCart = await cartService.getOpenCart()

      if (!openCart) {
        setCartBadgeCount(0)
        return
      }

      setCartBadgeCount(Number(openCart.itemsCount ?? 0))
    } catch (error) {
      /*
       * Não zera o badge em uma falha de rede, pois o valor
       * local ainda pode estar correto.
       */
      console.error('[CartContext] syncCartBadge error:', error)
    }
  }, [])

  /* ==============================
     CONTEXTO DA LOJA
  ============================== */

  const ensureStoreContext = useCallback(
    async (storeId: string): Promise<boolean> => {
      if (!storeId) {
        return false
      }

      if (!activeStoreId) {
        setActiveStoreId(storeId)
        setActiveStoreName(null)

        return true
      }

      if (activeStoreId === storeId) {
        return true
      }

      if (cartItemsRef.current.length === 0) {
        setActiveStoreId(storeId)
        setActiveStoreName(null)

        return true
      }

      return new Promise<boolean>((resolve) => {
        setConfirmStoreChange({
          visible: true,

          onConfirm: () => {
            /*
             * Invalida qualquer fetch anterior.
             */
            fetchRequestIdRef.current += 1

            cartItemsRef.current = []

            setCartItems([])
            setCartBadgeCount(0)
            setActiveStoreId(storeId)
            setActiveStoreName(null)

            setConfirmStoreChange({
              visible: false,
              onConfirm: null,
              onCancel: null,
            })

            resolve(true)
          },

          onCancel: () => {
            setConfirmStoreChange({
              visible: false,
              onConfirm: null,
              onCancel: null,
            })

            resolve(false)
          },
        })
      })
    },
    [activeStoreId],
  )

  /* ==============================
     ADICIONAR PRODUTO
  ============================== */

  const addProductCart = useCallback(
    async ({ productId, storeId, quantity, product }: AddToCartInput) => {
      if (!productId || !storeId || quantity <= 0) {
        return
      }

      const canProceed = await ensureStoreContext(storeId)

      if (!canProceed) {
        return
      }

      if (!acquireProductLock(productId)) {
        return
      }

      const previousItems = cartItemsRef.current
      const previousBadge = cartBadgeCount

      /*
       * Se o produto completo foi informado, adiciona imediatamente
       * ao estado local e dispensa o fetchCart depois da requisição.
       */
      if (product) {
        const existingItem = previousItems.find(
          (item) => item.productId === productId,
        )

        if (existingItem) {
          const availableQuantity = Math.max(
            0,
            existingItem.stock - existingItem.quantity,
          )

          const quantityToAdd = Math.min(quantity, availableQuantity)

          if (quantityToAdd <= 0) {
            releaseProductLock(productId)
            return
          }

          updateCartItems(
            (items) =>
              items.map((item) =>
                item.productId === productId
                  ? {
                      ...item,
                      quantity: item.quantity + quantityToAdd,
                    }
                  : item,
              ),
            quantityToAdd,
          )
        } else {
          const quantityToAdd = Math.min(
            quantity,
            Number(product.quantity ?? quantity),
          )

          if (quantityToAdd <= 0) {
            releaseProductLock(productId)
            return
          }

          const newItem: CartItem = {
            productId: product.id,
            name: product.name,
            image: normalizeImage(product.image),
            price: Number(product.price ?? 0),
            quantity: quantityToAdd,
            cashbackPercentage: Number(product.cashbackPercentage ?? 0),
            storeId,
            stock: Number(product.quantity ?? 0),
          }

          updateCartItems((items) => [...items, newItem], quantityToAdd)
        }
      } else {
        /*
         * Melhora imediatamente a percepção de velocidade mesmo
         * quando os dados completos do produto não foram enviados.
         */
        setCartBadgeCount((current) => current + quantity)
      }

      try {
        await cartService.addToCart({
          productId,
          storeId,
          quantity,
        })

        /*
         * Compatibilidade com chamadas antigas.
         *
         * Quando product não é enviado, precisamos buscar os dados
         * completos para preencher cartItems.
         */
        if (!product) {
          await fetchCart(storeId)
        }
      } catch (error) {
        console.error('[CartContext] addProductCart error:', error)

        cartItemsRef.current = previousItems
        setCartItems(previousItems)
        setCartBadgeCount(previousBadge)

        throw error
      } finally {
        releaseProductLock(productId)
      }
    },
    [
      acquireProductLock,
      cartBadgeCount,
      ensureStoreContext,
      fetchCart,
      normalizeImage,
      releaseProductLock,
      updateCartItems,
    ],
  )

  /* ==============================
     INCREMENTAR PRODUTO
  ============================== */

  const incrementProduct = useCallback(
    async (productId: string) => {
      const storeId = activeStoreId

      if (!storeId || !productId) {
        return
      }

      if (!acquireProductLock(productId)) {
        return
      }

      const currentItem = cartItemsRef.current.find(
        (item) => item.productId === productId,
      )

      if (!currentItem || currentItem.quantity >= currentItem.stock) {
        releaseProductLock(productId)
        return
      }

      const previousItems = cartItemsRef.current
      const previousBadge = cartBadgeCount

      updateCartItems(
        (items) =>
          items.map((item) =>
            item.productId === productId
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item,
          ),
        1,
      )

      try {
        await cartService.incrementItem({
          storeId,
          productId,
        })
      } catch (error) {
        console.error('[CartContext] incrementProduct error:', error)

        cartItemsRef.current = previousItems
        setCartItems(previousItems)
        setCartBadgeCount(previousBadge)

        throw error
      } finally {
        releaseProductLock(productId)
      }
    },
    [
      activeStoreId,
      acquireProductLock,
      cartBadgeCount,
      releaseProductLock,
      updateCartItems,
    ],
  )

  /* ==============================
     DECREMENTAR PRODUTO
  ============================== */

  const decrementProduct = useCallback(
    async (productId: string) => {
      const storeId = activeStoreId

      if (!storeId || !productId) {
        return
      }

      if (!acquireProductLock(productId)) {
        return
      }

      const currentItem = cartItemsRef.current.find(
        (item) => item.productId === productId,
      )

      if (!currentItem) {
        releaseProductLock(productId)
        return
      }

      const previousItems = cartItemsRef.current
      const previousBadge = cartBadgeCount

      updateCartItems((items) => {
        if (currentItem.quantity <= 1) {
          return items.filter((item) => item.productId !== productId)
        }

        return items.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
      }, -1)

      try {
        await cartService.decrementItem({
          storeId,
          productId,
        })
      } catch (error) {
        console.error('[CartContext] decrementProduct error:', error)

        cartItemsRef.current = previousItems
        setCartItems(previousItems)
        setCartBadgeCount(previousBadge)

        throw error
      } finally {
        releaseProductLock(productId)
      }
    },
    [
      activeStoreId,
      acquireProductLock,
      cartBadgeCount,
      releaseProductLock,
      updateCartItems,
    ],
  )

  /* ==============================
     REMOVER PRODUTO
  ============================== */

  const removeProductCart = useCallback(
    async (productId: string) => {
      const storeId = activeStoreId

      if (!storeId || !productId) {
        return
      }

      if (!acquireProductLock(productId)) {
        return
      }

      const currentItem = cartItemsRef.current.find(
        (item) => item.productId === productId,
      )

      if (!currentItem) {
        releaseProductLock(productId)
        return
      }

      const previousItems = cartItemsRef.current
      const previousBadge = cartBadgeCount

      updateCartItems(
        (items) => items.filter((item) => item.productId !== productId),
        -currentItem.quantity,
      )

      try {
        await cartService.removeFromCart(storeId, productId)
      } catch (error) {
        console.error('[CartContext] removeProductCart error:', error)

        cartItemsRef.current = previousItems
        setCartItems(previousItems)
        setCartBadgeCount(previousBadge)

        throw error
      } finally {
        releaseProductLock(productId)
      }
    },
    [
      activeStoreId,
      acquireProductLock,
      cartBadgeCount,
      releaseProductLock,
      updateCartItems,
    ],
  )

  /* ==============================
     RESET
  ============================== */

  const resetCartContext = useCallback(() => {
    /*
     * Invalida requisições de fetch que ainda estejam em andamento.
     */
    fetchRequestIdRef.current += 1
    pendingProductsRef.current.clear()
    cartItemsRef.current = []

    setCartItems([])
    setActiveStoreId(null)
    setActiveStoreName(null)
    setCartBadgeCount(0)

    setConfirmStoreChange({
      visible: false,
      onConfirm: null,
      onCancel: null,
    })
  }, [])

  /* ==============================
     SINCRONIZAR CARRINHO ABERTO
  ============================== */

  const syncOpenCart = useCallback(async () => {
    if (!city?.id) {
      return undefined
    }

    try {
      const openCart = await cartService.getOpenCart()

      if (!openCart) {
        resetCartContext()
        return undefined
      }

      setActiveStoreId(openCart.storeId)
      setActiveStoreName(openCart.storeName ?? null)

      await fetchCart(openCart.storeId)

      return openCart.storeId
    } catch (error) {
      console.error('[CartContext] syncOpenCart error:', error)

      throw error
    }
  }, [city?.id, fetchCart, resetCartContext])

  /* ==============================
     CHECKOUT
  ============================== */

  const checkout = useCallback(async () => {
    const storeId = activeStoreId

    if (!storeId) {
      return
    }

    await cartService.checkoutCart(storeId)

    /*
     * O backend acabou de fechar o carrinho. Não é necessário
     * chamar syncOpenCart e syncCartBadge em sequência.
     */
    resetCartContext()
  }, [activeStoreId, resetCartContext])

  /* ==============================
     LOGOUT / TROCA DE CIDADE
  ============================== */

  useEffect(() => {
    resetCartContext()
  }, [userId, city?.id, resetCartContext])

  /* ==============================
     CONTEXT
  ============================== */

  return (
    <CartContext.Provider
      value={{
        cartItems,
        activeStoreId,
        activeStoreName,
        cartBadgeCount,

        syncCartBadge,
        ensureStoreContext,

        addProductCart,
        incrementProduct,
        decrementProduct,
        removeProductCart,

        fetchCart,
        checkout,
        resetCartContext,
        syncOpenCart,

        confirmStoreChange,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
