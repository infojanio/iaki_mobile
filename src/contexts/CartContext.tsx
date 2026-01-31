import {
  createContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
} from 'react'

import { cartService } from '@services/cartService'
import { api } from '@services/api'
import { useAuth } from '@hooks/useAuth'
import { useCity } from '@hooks/useCity'

/* ==============================
   🧱 TIPOS
============================== */

type CartItem = {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  cashback_percentage: number
  storeId: string
  stock: number
}

type AddToCartInput = {
  productId: string
  storeId: string
  quantity: number
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

  // ⚠️ mantém se você ainda usa em algum lugar, mas NÃO chame automaticamente na Home
  syncOpenCart: () => Promise<void>

  confirmStoreChange: ConfirmStoreChangeState
}

export const CartContext = createContext({} as CartContextData)

/* ==============================
   🛒 PROVIDER
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

  /* ==============================
     🔄 FETCH CART
  ============================== */
  const fetchCart = useCallback(async (storeId: string) => {
    if (!storeId) return

    setActiveStoreId(storeId) // 🔥 GARANTE CONTEXTO

    const cart = await cartService.getCartFromBackend(storeId)
    const baseURL = api.defaults.baseURL

    const normalizedItems: CartItem[] = (cart?.items ?? [])
      .map((item: any) => {
        const product = item.product
        if (!product) return null

        const rawImage = product.image
        const image =
          typeof rawImage === 'string'
            ? rawImage.startsWith('http')
              ? rawImage
              : `${baseURL}/uploads/${rawImage}`
            : 'https://via.placeholder.com/150'

        return {
          productId: product.id,
          name: product.name,
          image,
          price: Number(item.priceSnapshot ?? product.price ?? 0),
          quantity: item.quantity,
          cashback_percentage: Number(
            item.cashbackSnapshot ?? product.cashback_percentage ?? 0,
          ),
          storeId,
          stock: Number(product.quantity ?? 0),
        }
      })
      .filter(Boolean)

    setCartItems(normalizedItems)
    setCartBadgeCount(normalizedItems.reduce((sum, i) => sum + i.quantity, 0))
  }, [])

  /* ==============================
     🔔 BADGE (SÓ META)
  ============================== */
  const syncCartBadge = useCallback(async () => {
    try {
      const openCart = await cartService.getOpenCart()

      if (!openCart) {
        setCartBadgeCount(0)
        return
      }

      // backend já garante se o carrinho é válido ou não
      setCartBadgeCount(openCart.itemsCount ?? 0)
    } catch (error) {
      console.error('[CartContext] syncCartBadge error:', error)
      setCartBadgeCount(0)
    }
  }, [])

  /* ==============================
     🔑 FUNÇÃO CENTRAL
  ============================== */
  const ensureStoreContext = useCallback(
    async (storeId: string): Promise<boolean> => {
      // 1️⃣ Nenhuma loja ativa
      if (!activeStoreId) {
        setActiveStoreId(storeId)
        return true
      }

      // 2️⃣ Mesma loja
      if (activeStoreId === storeId) {
        return true
      }

      // 3️⃣ Loja diferente, mas carrinho vazio → troca silenciosa
      if (cartItems.length === 0) {
        setActiveStoreId(storeId)
        return true
      }

      // 4️⃣ Loja diferente + carrinho com itens → confirmar
      return new Promise((resolve) => {
        setConfirmStoreChange({
          visible: true,
          onConfirm: () => {
            setConfirmStoreChange({
              visible: false,
              onConfirm: null,
              onCancel: null,
            })

            // ✅ fecha carrinho visual e troca loja ativa
            setCartItems([])
            setCartBadgeCount(0)
            setActiveStoreId(storeId)

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
    [activeStoreId, cartItems.length],
  )

  /* ==============================
     ➕ ADD PRODUCT
  ============================== */
  async function addProductCart({
    productId,
    storeId,
    quantity,
  }: AddToCartInput) {
    const canProceed = await ensureStoreContext(storeId)
    if (!canProceed) return

    await cartService.addToCart({ productId, storeId, quantity })
    await fetchCart(storeId)
    // ✅ atualiza badge “passivo” também (caso backend calcule diferente)
    await syncCartBadge()
  }

  /* ==============================
     ➕➖ CONTROLES
  ============================== */
  async function incrementProduct(productId: string) {
    if (!activeStoreId) return
    await cartService.incrementItem({
      storeId: activeStoreId,
      productId,
    })
    await fetchCart(activeStoreId)
    await syncCartBadge()
  }

  async function decrementProduct(productId: string) {
    if (!activeStoreId) return
    await cartService.decrementItem({
      storeId: activeStoreId,
      productId,
    })
    await fetchCart(activeStoreId)
    await syncCartBadge()
  }

  async function removeProductCart(productId: string) {
    if (!activeStoreId) return
    await cartService.removeFromCart(activeStoreId, productId)
    await fetchCart(activeStoreId)
    await syncCartBadge()
  }

  /* ==============================
     ✅ CHECKOUT
  ============================== */
  async function checkout() {
    if (!activeStoreId) return

    // 1️⃣ Backend fecha o carrinho
    await cartService.checkoutCart(activeStoreId)

    // 2️⃣ Limpa estado local imediatamente (UX)
    resetCartContext()

    // 3️⃣ 🔥 Sincroniza com a verdade do backend
    await syncOpenCart()

    // 4️⃣ 🔔 Atualiza badge final
    await syncCartBadge()
  }

  /* ==============================
     🔄 SYNC OPEN CART (EVITAR NA HOME)
  ============================== */
  async function syncOpenCart() {
    if (!city?.id) return

    const openCart = await cartService.getOpenCart()

    if (!openCart) {
      // 🔥 LIMPA TUDO
      setCartItems([])
      setActiveStoreId(null)
      setActiveStoreName(null)
      setCartBadgeCount(0) // 🔥 GARANTE BADGE ZERADO
      return
    }

    setActiveStoreId(openCart.storeId)
    setActiveStoreName(openCart.storeName) // ✅ AQUI ESTAVA O BUG

    await fetchCart(openCart.storeId)

    return openCart.storeId
  }

  /* ==============================
     🧹 RESET
  ============================== */
  function resetCartContext() {
    setCartItems([])
    setActiveStoreId(null)
    setCartBadgeCount(0)
  }

  /* ==============================
     🔐 LOGOUT / TROCA DE CIDADE
     ✅ regra: trocar cidade SEMPRE limpa visual
     ✅ e também zera badge local
  ============================== */
  useEffect(() => {
    resetCartContext()
  }, [userId, city?.id])

  /* ==============================
     📦 CONTEXT
  ============================== */
  return (
    <CartContext.Provider
      value={{
        cartItems,
        activeStoreId,
        cartBadgeCount,
        activeStoreName,
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
