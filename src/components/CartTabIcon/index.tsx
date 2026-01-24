// CartTabIcon.tsx
import React from 'react'
import { View, Text } from 'react-native'
import CartSvg from '@assets/cart.svg'

type Props = {
  color: string
  badgeCount?: number
}

export function CartTabIcon({ color, badgeCount = 0 }: Props) {
  return (
    <View style={{ position: 'relative' }}>
      <CartSvg fill={color} width={24} height={24} />

      {badgeCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            backgroundColor: '#EF4444',
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
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
            {badgeCount}
          </Text>
        </View>
      )}
    </View>
  )
}
