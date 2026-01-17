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
  setCurrentStoreId: (storeId: string) => void
  fetchCart: (storeId?: string) => Promise<void>
  addProductCart: (data: AddToCartInput) => Promise<void>
  incrementProduct: (productId: string) => Promise<void>
  decrementProduct: (productId: string) => Promise<void>
  removeProductCart: (productId: string) => Promise<void>
  checkout: () => Promise<void>
}

export const CartContext = createContext({} as CartContextData)

export function CartProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null)

  async function fetchCart(storeIdParam?: string) {
    const storeId = storeIdParam ?? currentStoreId
    if (!storeId) return

    const cart = await cartService.getCartFromBackend(storeId)

    const baseURL = api.defaults.baseURL

    const normalizedItems: CartItem[] = cart.items.map((item: any) => {
      const rawImage = item.product?.image

      const image =
        rawImage && rawImage.startsWith('http')
          ? rawImage
          : rawImage
          ? `${baseURL}/uploads/${rawImage}`
          : 'https://via.placeholder.com/150'

      return {
        productId: item.product.id,
        name: item.product.name,
        image,
        price: Number(item.priceSnapshot),
        quantity: item.quantity,
        cashback_percentage: Number(item.cashbackSnapshot),
        storeId,
      }
    })

    setCartItems(normalizedItems)
  }

  async function addProductCart({
    productId,
    storeId,
    quantity,
  }: AddToCartInput) {
    // 🔒 define loja antes de qualquer coisa
    setCurrentStoreId(storeId)

    await cartService.addToCart({
      storeId,
      productId,
      quantity,
    })

    await fetchCart(storeId)
  }

  async function incrementProduct(productId: string) {
    if (!currentStoreId) return

    await cartService.incrementItem({
      storeId: currentStoreId,
      productId,
    })

    await fetchCart()
  }

  async function decrementProduct(productId: string) {
    if (!currentStoreId) return

    await cartService.decrementItem({
      storeId: currentStoreId,
      productId,
    })

    await fetchCart()
  }

  async function removeProductCart(productId: string) {
    if (!currentStoreId) return

    await cartService.removeFromCart(currentStoreId, productId)

    await fetchCart()
  }

  async function checkout() {
    if (!currentStoreId) return

    await cartService.checkoutCart(currentStoreId)
    setCartItems([])
  }

  useEffect(() => {
    if (userId && currentStoreId) {
      fetchCart()
    }
  }, [userId, currentStoreId])

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
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
