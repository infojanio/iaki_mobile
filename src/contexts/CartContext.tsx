import { createContext, ReactNode, useEffect, useState } from 'react'
import { cartService } from '@services/cartService'
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'

type CartItem = {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  cashback_percentage: number
  storeId: string
}

type AddToCartInput = {
  productId: string
  storeId: string
  quantity: number
}

type CartContextData = {
  cartItems: CartItem[]
  currentStoreId: string | null
  setCurrentStoreId: (storeId: string | null) => void
  fetchCart: (storeId?: string) => Promise<void>
  addProductCart: (data: AddToCartInput) => Promise<void>
  incrementProduct: (productId: string) => Promise<void>
  decrementProduct: (productId: string) => Promise<void>
  removeProductCart: (productId: string) => Promise<void>
  checkout: () => Promise<void>
  resetCartContext: () => void
  syncOpenCart: () => Promise<void>
  forceAddProductCart(data: AddToCartInput): Promise<void>
}

export const CartContext = createContext({} as CartContextData)

export function CartProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null)

  async function fetchCart(storeIdParam?: string) {
    const storeId = storeIdParam ?? currentStoreId

    if (!storeId) {
      return
    }

    const cart = await cartService.getCartFromBackend(storeId)

    const baseURL = api.defaults.baseURL

    const normalizedItems: CartItem[] = cart.items
      .map((item: any) => {
        const product = item.product

        // 🔐 segurança total
        if (!product && !item.productId) {
          console.warn('[CartContext] item inválido:', item)
          return null
        }

        const rawImage = product?.image

        const image =
          typeof rawImage === 'string'
            ? rawImage.startsWith('http')
              ? rawImage
              : `${baseURL}/uploads/${rawImage}`
            : 'https://via.placeholder.com/150'

        return {
          productId: product?.id ?? item.productId,
          name: product?.name ?? 'Produto',
          image,
          price: Number(item.priceSnapshot ?? product?.price ?? 0),
          quantity: item.quantity,
          cashback_percentage: Number(
            item.cashbackSnapshot ?? product?.cashback_percentage ?? 0,
          ),
          storeId,
        }
      })
      .filter(Boolean) // 🔥 remove nulls
      // 🔥 ORDEM ESTÁVEL — MANTÊM ORDEM DOS PRODUTOS NO CARRINHO
      .sort((a: any, b: any) => a.productId.localeCompare(b.productId))

    setCartItems(normalizedItems)
  }

  async function addProductCart({
    productId,
    storeId,
    quantity,
  }: AddToCartInput) {
    // 1️⃣ define loja
    setCurrentStoreId(storeId)

    // 2️⃣ adiciona
    await cartService.addToCart({
      storeId,
      productId,
      quantity,
    })

    // 3️⃣ busca carrinho EXPLICITAMENTE pela loja
    await fetchCart(storeId)
  }

  async function syncOpenCart() {
    try {
      // 🔎 Busca carrinho OPEN do usuário
      const openCart = await cartService.getOpenCart()

      // 🧼 Não existe carrinho aberto
      if (!openCart) {
        resetCartContext()
        return
      }

      const { storeId } = openCart

      // 🔐 Segurança extra
      if (!storeId) {
        resetCartContext()
        return
      }

      // 🔥 Define a loja atual do carrinho
      setCurrentStoreId(storeId)

      // 🔄 Carrega os itens do carrinho dessa loja
      await fetchCart(storeId)
    } catch (error) {
      console.error('[CartContext] syncOpenCart error:', error)
      resetCartContext()
    }
  }

  async function incrementProduct(productId: string) {
    if (!currentStoreId) return

    await cartService.incrementItem({
      storeId: currentStoreId,
      productId,
    })

    await fetchCart(currentStoreId)
  }

  async function decrementProduct(productId: string) {
    if (!currentStoreId) return

    await cartService.decrementItem({
      storeId: currentStoreId,
      productId,
    })

    await fetchCart(currentStoreId)
  }

  async function removeProductCart(productId: string) {
    if (!currentStoreId) return

    await cartService.removeFromCart(currentStoreId, productId)
    await fetchCart(currentStoreId)
  }

  async function checkout() {
    if (!currentStoreId) return

    await cartService.checkoutCart(currentStoreId)

    // 🔥 após checkout, limpa estado local
    resetCartContext()
  }

  // 🔥 usado pelo CityContext
  function resetCartContext() {
    setCartItems([])
    setCurrentStoreId(null)
  }

  async function forceAddProductCart({
    productId,
    storeId,
    quantity,
  }: AddToCartInput) {
    // limpa carrinho visual + backend
    resetCartContext()

    await cartService.addToCart({
      storeId,
      productId,
      quantity,
    })

    setCurrentStoreId(storeId)
    await fetchCart(storeId)
  }

  //carregar carrinho
  useEffect(() => {
    if (currentStoreId) {
      fetchCart(currentStoreId)
    }
  }, [currentStoreId])

  // 🔐 segurança: logout limpa carrinho visual
  useEffect(() => {
    if (!userId) {
      resetCartContext()
    }
  }, [userId])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        currentStoreId,
        setCurrentStoreId,
        fetchCart,
        addProductCart,
        incrementProduct,
        decrementProduct,
        removeProductCart,
        checkout,
        resetCartContext,
        forceAddProductCart,
        syncOpenCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
