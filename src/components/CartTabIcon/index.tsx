// CartTabIcon.tsx

import React from 'react'
import { View, Text } from 'react-native'

import CartSvg from '@assets/cart.svg'

type Props = {
  color: string
  badgeCount?: number
  size?: number
}

export function CartTabIcon({ color, badgeCount = 0, size = 20 }: Props) {
  const displayCount = badgeCount > 99 ? '99+' : badgeCount

  return (
    <View
      style={{
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <CartSvg fill={color} width={size} height={size} />

      {badgeCount > 0 && (
        <View
          style={{
            position: 'absolute',

            top: 0,
            right: 0,

            backgroundColor: '#EF4444',

            borderRadius: 8,

            minWidth: 14,
            height: 14,

            paddingHorizontal: 3,

            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: '#fff',

              fontSize: 8,
              lineHeight: 10,

              fontWeight: '700',

              textAlign: 'center',
            }}
          >
            {displayCount}
          </Text>
        </View>
      )}
    </View>
  )
}
