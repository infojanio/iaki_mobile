import React, { memo, useMemo, useState } from 'react'

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ActivityIndicator,
} from 'react-native'

import { Feather } from '@expo/vector-icons'

import { ProductDTO } from '@dtos/ProductDTO'

export type ProductCardProps = TouchableOpacityProps & {
  product: ProductDTO
  cartQuantity?: number
  isUpdating?: boolean
  onIncrement: () => void
  onDecrement: () => void
}

const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/300'

function ProductCardComponent({
  product,
  cartQuantity = 0,
  isUpdating = false,
  onIncrement,
  onDecrement,
  ...rest
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  /* ==============================
     DADOS SEGUROS
  ============================== */

  const price = useMemo(() => {
    const value = Number(product?.price)

    return Number.isFinite(value) ? Math.max(0, value) : 0
  }, [product?.price])

  const discountPercent = useMemo(() => {
    const value = Number(product?.cashbackPercentage ?? 0)

    if (!Number.isFinite(value)) {
      return 0
    }

    return Math.min(100, Math.max(0, value))
  }, [product?.cashbackPercentage])

  const stockQuantity = useMemo(() => {
    const value = Number(product?.quantity ?? 0)

    return Number.isFinite(value) ? Math.max(0, value) : 0
  }, [product?.quantity])

  const safeCartQuantity = useMemo(() => {
    const value = Number(cartQuantity)

    return Number.isFinite(value) ? Math.max(0, value) : 0
  }, [cartQuantity])

  const originalPrice = useMemo(() => {
    if (discountPercent <= 0 || discountPercent >= 100) {
      return price
    }

    return price / (1 - discountPercent / 100)
  }, [discountPercent, price])

  const imageUri = useMemo(() => {
    if (imageError) {
      return DEFAULT_PRODUCT_IMAGE
    }

    if (typeof product?.image !== 'string' || !product.image.trim()) {
      return DEFAULT_PRODUCT_IMAGE
    }

    return product.image.trim()
  }, [imageError, product?.image])

  const productName =
    typeof product?.name === 'string' && product.name.trim()
      ? product.name.trim()
      : 'Produto'

  const storeName =
    typeof product?.store?.name === 'string' ? product.store.name : ''

  const hasStock = stockQuantity > 0

  const reachedStockLimit = hasStock && safeCartQuantity >= stockQuantity

  /* ==============================
     AÇÕES
  ============================== */

  function handleIncrement() {
    if (!hasStock || reachedStockLimit || isUpdating) {
      return
    }

    onIncrement()
  }

  function handleDecrement() {
    if (safeCartQuantity <= 0 || isUpdating) {
      return
    }

    onDecrement()
  }

  /* ==============================
     TELA
  ============================== */

  return (
    <View style={styles.card}>
      {/* ÁREA DE DETALHES */}

      <TouchableOpacity
        {...rest}
        activeOpacity={0.8}
        style={[styles.productArea, rest.style]}
      >
        {/* LOJA */}

        {!!storeName && (
          <View style={styles.storeContainer}>
            <Text style={styles.storeName} numberOfLines={1}>
              {storeName}
            </Text>
          </View>
        )}

        {/* IMAGEM */}

        <Image
          source={{
            uri: imageUri,
          }}
          style={styles.productImage}
          resizeMode="contain"
          /*
           * Importante no Android:
           * reduz a imagem antes de
           * mantê-la na memória.
           */
          resizeMethod="resize"
          /*
           * Evita animação de fade
           * em dezenas de imagens.
           */
          fadeDuration={0}
          onError={() => {
            if (imageUri !== DEFAULT_PRODUCT_IMAGE) {
              setImageError(true)
            }
          }}
          accessibilityLabel={`Imagem do produto ${productName}`}
        />

        {/* NOME */}

        <Text style={styles.productName} numberOfLines={1}>
          {productName}
        </Text>

        {/* PREÇO */}

        {discountPercent > 0 ? (
          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>
              R$ {originalPrice.toFixed(2)}
            </Text>

            <Text style={styles.discountPrice}>R$ {price.toFixed(2)}</Text>
          </View>
        ) : (
          <Text style={styles.price}>R$ {price.toFixed(2)}</Text>
        )}
      </TouchableOpacity>

      {/* ESTOQUE */}

      <View style={styles.stockArea}>
        <View
          style={[
            styles.stockBadge,

            hasStock ? styles.stockAvailable : styles.stockUnavailable,
          ]}
        >
          <Text style={styles.stockText} numberOfLines={1}>
            {hasStock ? `${stockQuantity} unidades` : 'Produto esgotado'}
          </Text>
        </View>
      </View>

      {/* CONTROLES */}

      <View style={styles.controlsContainer}>
        {isUpdating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        ) : safeCartQuantity === 0 ? (
          /* PRIMEIRO + */

          <View style={styles.center}>
            <TouchableOpacity
              onPress={handleIncrement}
              disabled={!hasStock}
              activeOpacity={hasStock ? 0.7 : 1}
              accessibilityLabel={`Adicionar ${productName}`}
            >
              <View
                style={[
                  styles.initialAddButton,

                  hasStock ? styles.addButtonActive : styles.addButtonDisabled,
                ]}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          /* - QTD + */

          <View style={styles.quantityControls}>
            {/* MENOS */}

            <TouchableOpacity
              onPress={handleDecrement}
              activeOpacity={0.7}
              accessibilityLabel={`Remover uma unidade de ${productName}`}
            >
              <View style={styles.minusButton}>
                <Feather name="minus" size={18} color="#374151" />
              </View>
            </TouchableOpacity>

            {/* QUANTIDADE */}

            <View style={styles.quantityContainer}>
              <Text style={styles.quantityText} numberOfLines={1}>
                {safeCartQuantity}
              </Text>
            </View>

            {/* MAIS */}

            <TouchableOpacity
              onPress={handleIncrement}
              disabled={reachedStockLimit}
              activeOpacity={reachedStockLimit ? 1 : 0.7}
              accessibilityLabel={`Adicionar mais uma unidade de ${productName}`}
            >
              <View
                style={[
                  styles.plusButton,

                  reachedStockLimit
                    ? styles.addButtonDisabled
                    : styles.addButtonActive,
                ]}
              >
                <Feather name="plus" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* LIMITE */}

        {reachedStockLimit && safeCartQuantity > 0 && hasStock && (
          <Text style={styles.stockLimitText} numberOfLines={1}>
            Limite de estoque
          </Text>
        )}
      </View>
    </View>
  )
}

export const ProductCard = memo(ProductCardComponent)

const styles = StyleSheet.create({
  card: {
    width: 120,
    minHeight: 230,

    marginRight: -4,
    marginLeft: -4,
    marginTop: 4,
    marginBottom: 4,

    backgroundColor: '#FFFFFF',

    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',

    overflow: 'hidden',
  },

  productArea: {
    width: '100%',
    alignItems: 'center',
  },

  storeContainer: {
    maxWidth: '100%',
    paddingHorizontal: 8,

    borderBottomWidth: 2,
    borderBottomColor: '#22C55E',
  },

  storeName: {
    maxWidth: 105,

    fontSize: 10,
    lineHeight: 14,

    textAlign: 'center',

    color: '#111827',
  },

  productImage: {
    width: 100,
    height: 70,

    marginTop: 8,

    borderRadius: 8,

    backgroundColor: '#FFFFFF',
  },

  productName: {
    width: '100%',

    minHeight: 24,

    marginTop: 4,

    paddingHorizontal: 8,

    fontSize: 14,
    lineHeight: 20,

    fontWeight: '600',

    textAlign: 'center',

    color: '#000000',
  },

  priceContainer: {
    alignItems: 'center',
  },

  originalPrice: {
    fontSize: 12,

    color: '#9CA3AF',

    textDecorationLine: 'line-through',
  },

  discountPrice: {
    fontSize: 18,

    fontWeight: '700',

    color: '#DC2626',
  },

  price: {
    fontSize: 18,

    fontWeight: '700',

    color: '#1F2937',
  },

  stockArea: {
    marginTop: 4,

    paddingHorizontal: 8,

    alignItems: 'center',
  },

  stockBadge: {
    maxWidth: '100%',

    paddingHorizontal: 8,
    paddingVertical: 2,

    borderRadius: 6,
  },

  stockAvailable: {
    backgroundColor: '#EF4444',
  },

  stockUnavailable: {
    backgroundColor: '#9CA3AF',
  },

  stockText: {
    fontSize: 12,

    color: '#FFFFFF',

    textAlign: 'center',
  },

  controlsContainer: {
    flex: 1,

    width: '100%',

    paddingHorizontal: 8,

    marginTop: 8,
    marginBottom: 8,

    justifyContent: 'center',
  },

  center: {
    width: '100%',

    alignItems: 'center',

    justifyContent: 'center',
  },

  loadingContainer: {
    height: 32,

    alignItems: 'center',

    justifyContent: 'center',
  },

  initialAddButton: {
    width: 48,
    height: 32,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 8,
  },

  addButtonActive: {
    backgroundColor: '#2563EB',
  },

  addButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },

  quantityControls: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  minusButton: {
    width: 32,
    height: 32,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 16,

    backgroundColor: '#E5E7EB',
  },

  plusButton: {
    width: 32,
    height: 32,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 16,
  },

  quantityContainer: {
    width: 24,
    height: 32,

    alignItems: 'center',

    justifyContent: 'center',
  },

  quantityText: {
    fontSize: 16,

    fontWeight: '700',

    textAlign: 'center',

    color: '#1F2937',
  },

  stockLimitText: {
    marginTop: 4,

    paddingHorizontal: 4,

    fontSize: 10,

    textAlign: 'center',

    color: '#EF4444',
  },
})
