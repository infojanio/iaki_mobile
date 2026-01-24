import { CartConflictModal } from '@components/CartConflictModal'
import { useCart } from '@hooks/useCart'

export function AppModalRoot() {
  const { confirmStoreChange } = useCart()

  if (!confirmStoreChange.visible) return null

  return (
    <CartConflictModal
      isOpen={confirmStoreChange.visible}
      onConfirm={confirmStoreChange.onConfirm!}
      onCancel={confirmStoreChange.onCancel!}
    />
  )
}
