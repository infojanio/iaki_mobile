// CartTabIcon.tsx
import React, { useContext } from 'react'
import { View, Text } from 'react-native'
import { CartContext } from '@contexts/CartContext'

import CartSvg from '@assets/cart.svg'

export function CartTabIcon({ color }: { color: string }) {
  const { cartItems } = useContext(CartContext)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <View style={{ position: 'relative' }}>
      <CartSvg fill={color} width={24} height={24} />
      {totalItems > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            backgroundColor: '#EF4444',
            borderRadius: 10,
            width: 18,
            height: 18,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 10,
              fontWeight: 'bold',
            }}
          >
            {totalItems}
          </Text>
        </View>
      )}
    </View>
  )
}
