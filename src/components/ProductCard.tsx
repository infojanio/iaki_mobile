import React, { memo, useMemo, useState } from 'react'

import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { Feather } from '@expo/vector-icons'

import { ProductDTO } from '@dtos/ProductDTO'

type Props = {
  data: ProductDTO

  cartQuantity?: number

  isUpdating?: boolean

  onPress: () => void

  onIncrement: () => void

  onDecrement: () => void
}

function DiscountProductCardComponent({
  data,
  cartQuantity = 0,
  isUpdating = false,
  onPress,
  onIncrement,
  onDecrement,
}: Props) {
  const [imageError, setImageError] = useState(false)

  /* ==============================
     DADOS SEGUROS
  ============================== */

  const price = useMemo(() => {
    const value = Number(data?.price)

    if (!Number.isFinite(value)) {
      return 0
    }

    return Math.max(0, value)
  }, [data?.price])

  /*
   * Apesar do campo ainda se chamar
   * cashbackPercentage, nesta tela
   * ele representa percentual de desconto.
   */
  const discountPercent = useMemo(() => {
    const value = Number(data?.cashbackPercentage ?? 0)

    if (!Number.isFinite(value)) {
      return 0
    }

    return Math.min(100, Math.max(0, value))
  }, [data?.cashbackPercentage])

  const stockQuantity = useMemo(() => {
    const value = Number(data?.quantity ?? 0)

    if (!Number.isFinite(value)) {
      return 0
    }

    return Math.max(0, value)
  }, [data?.quantity])

  const safeCartQuantity = useMemo(() => {
    const value = Number(cartQuantity)

    if (!Number.isFinite(value)) {
      return 0
    }

    return Math.max(0, value)
  }, [cartQuantity])

  /*
   * Evita divisão por zero
   * quando desconto chegar a 100%.
   */
  const originalPrice = useMemo(() => {
    if (discountPercent <= 0 || discountPercent >= 100) {
      return price
    }

    return price / (1 - discountPercent / 100)
  }, [discountPercent, price])

  const productName = useMemo(() => {
    if (typeof data?.name === 'string' && data.name.trim()) {
      return data.name.trim()
    }

    return 'Produto'
  }, [data?.name])

  const storeName = useMemo(() => {
    if (typeof data?.store?.name === 'string' && data.store.name.trim()) {
      return data.store.name.trim()
    }

    return ''
  }, [data?.store?.name])

  const imageUri = useMemo(() => {
    if (imageError) {
      return null
    }

    if (typeof data?.image !== 'string' || !data.image.trim()) {
      return null
    }

    return data.image.trim()
  }, [data?.image, imageError])

  const hasStock = stockQuantity > 0

  const reachedStockLimit = hasStock && safeCartQuantity >= stockQuantity

  /* ==============================
     AÇÕES
  ============================== */

  function handleIncrement() {
    if (!hasStock || reachedStockLimit || isUpdating) {
      return
    }

    if (typeof onIncrement !== 'function') {
      console.error('[DiscountProductCard] onIncrement não informado', {
        productId: data?.id,

        productName,
      })

      return
    }

    onIncrement()
  }

  function handleDecrement() {
    if (safeCartQuantity <= 0 || isUpdating) {
      return
    }

    if (typeof onDecrement !== 'function') {
      console.error('[DiscountProductCard] onDecrement não informado', {
        productId: data?.id,

        productName,
      })

      return
    }

    onDecrement()
  }

  /* ==============================
     TELA
  ============================== */

  return (
    <View style={styles.card}>
      {/* DESCONTO */}

      {discountPercent > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountBadgeText}>-{discountPercent}%</Text>
        </View>
      )}

      {/* ÁREA DO PRODUTO */}

      <Pressable
        onPress={onPress}
        disabled={isUpdating}
        accessibilityRole="button"
        accessibilityLabel={`Abrir detalhes de ${productName}`}
        style={({ pressed }) => [
          styles.productArea,

          pressed ? styles.pressed : null,
        ]}
      >
        {/* IMAGEM */}

        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{
                uri: imageUri,
              }}
              style={styles.productImage}
              resizeMode="contain"
              /*
               * Importante para imagens
               * grandes no Android.
               */
              resizeMethod="resize"
              /*
               * Evita animação de fade
               * em vários cards simultâneos.
               */
              fadeDuration={0}
              onError={() => {
                setImageError(true)
              }}
              accessibilityLabel={`Imagem de ${productName}`}
            />
          ) : (
            /*
             * Placeholder local, sem outra
             * requisição HTTP.
             */
            <View style={styles.imagePlaceholder}>
              <Feather name="image" size={28} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* NOME */}

        <View style={styles.infoContainer}>
          <Text style={styles.productName} numberOfLines={1}>
            {productName}
          </Text>

          {/* PREÇO COM DESCONTO */}

          {discountPercent > 0 ? (
            <View style={styles.priceContainer}>
              {!!storeName && (
                <Text style={styles.storeName} numberOfLines={1}>
                  {storeName}
                </Text>
              )}

              <Text style={styles.originalPrice} numberOfLines={1}>
                R$ {originalPrice.toFixed(2)}
              </Text>

              <Text style={styles.discountPrice} numberOfLines={1}>
                R$ {price.toFixed(2)}
              </Text>
            </View>
          ) : (
            <Text style={styles.normalPrice} numberOfLines={1}>
              R$ {price.toFixed(2)}
            </Text>
          )}
        </View>
      </Pressable>

      {/* ESTOQUE */}

      <View style={styles.stockContainer}>
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
        ) : (
          /* - QUANTIDADE + */

          <View style={styles.quantityRow}>
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
          <Text style={styles.stockLimit} numberOfLines={1}>
            Limite de estoque atingido
          </Text>
        )}
      </View>
    </View>
  )
}

/* ==============================
   MEMO
============================== */

export const ProductCard = memo(
  DiscountProductCardComponent,
  (previous, next) => {
    return (
      previous.data.id === next.data.id &&
      previous.data.price === next.data.price &&
      previous.data.quantity === next.data.quantity &&
      previous.data.image === next.data.image &&
      previous.data.name === next.data.name &&
      previous.data.cashbackPercentage === next.data.cashbackPercentage &&
      previous.data.store?.name === next.data.store?.name &&
      previous.cartQuantity === next.cartQuantity &&
      previous.isUpdating === next.isUpdating &&
      previous.onPress === next.onPress &&
      previous.onIncrement === next.onIncrement &&
      previous.onDecrement === next.onDecrement
    )
  },
)

/* ==============================
   ESTILOS
============================== */

const styles = StyleSheet.create({
  card: {
    width: 120,
    minHeight: 230,

    marginRight: 4,
    marginLeft: -2,
    marginTop: 4,
    marginBottom: 4,

    backgroundColor: '#FFFFFF',

    borderRadius: 12,

    borderWidth: 2,

    borderColor: '#F3F4F6',

    /*
     * Evitei shadow aqui.
     * Em listas grandes é mais
     * leve em aparelhos modestos.
     */
  },

  discountBadge: {
    position: 'absolute',

    top: 8,
    right: 8,

    zIndex: 10,

    paddingHorizontal: 8,

    paddingVertical: 3,

    borderRadius: 999,

    backgroundColor: '#2563EB',
  },

  discountBadgeText: {
    color: '#FFFFFF',

    fontSize: 11,

    fontWeight: '700',
  },

  productArea: {
    width: '100%',
  },

  pressed: {
    opacity: 0.8,
  },

  imageContainer: {
    width: '100%',
    height: 76,

    marginTop: 8,

    alignItems: 'center',

    justifyContent: 'center',
  },

  productImage: {
    width: 96,
    height: 64,

    borderRadius: 6,
  },

  imagePlaceholder: {
    width: 96,
    height: 64,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 6,

    backgroundColor: '#F3F4F6',
  },

  infoContainer: {
    paddingHorizontal: 12,

    paddingTop: 6,

    alignItems: 'center',
  },

  productName: {
    width: '100%',

    fontSize: 14,

    lineHeight: 19,

    fontWeight: '700',

    textAlign: 'center',

    color: '#111827',
  },

  priceContainer: {
    width: '100%',

    alignItems: 'center',
  },

  storeName: {
    maxWidth: '100%',

    marginTop: 2,

    fontSize: 10,

    lineHeight: 14,

    textAlign: 'center',

    color: '#EF4444',
  },

  originalPrice: {
    fontSize: 12,

    lineHeight: 16,

    color: '#9CA3AF',

    textDecorationLine: 'line-through',
  },

  discountPrice: {
    fontSize: 18,

    lineHeight: 23,

    fontWeight: '700',

    color: '#2563EB',
  },

  normalPrice: {
    marginTop: 2,

    fontSize: 18,

    lineHeight: 23,

    fontWeight: '700',

    color: '#1F2937',

    textAlign: 'center',
  },

  stockContainer: {
    marginTop: 4,

    alignItems: 'center',

    paddingHorizontal: 6,
  },

  stockBadge: {
    maxWidth: '100%',

    paddingHorizontal: 8,

    paddingVertical: 2,

    borderRadius: 6,
  },

  stockAvailable: {
    backgroundColor: '#3B82F6',
  },

  stockUnavailable: {
    backgroundColor: '#9CA3AF',
  },

  stockText: {
    fontSize: 12,

    lineHeight: 16,

    color: '#FFFFFF',

    textAlign: 'center',
  },

  controlsContainer: {
    flex: 1,

    minHeight: 55,

    marginTop: 8,

    marginBottom: 8,

    paddingHorizontal: 8,

    alignItems: 'center',

    justifyContent: 'center',
  },

  loadingContainer: {
    height: 40,

    alignItems: 'center',

    justifyContent: 'center',
  },

  initialAddButton: {
    width: 48,
    height: 40,

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

  quantityRow: {
    width: '100%',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  minusButton: {
    width: 36,
    height: 36,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 18,

    backgroundColor: '#E5E7EB',
  },

  plusButton: {
    width: 36,
    height: 36,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 18,
  },

  quantityContainer: {
    width: 22,
    height: 36,

    alignItems: 'center',

    justifyContent: 'center',
  },

  quantityText: {
    fontSize: 16,

    lineHeight: 20,

    fontWeight: '700',

    color: '#1F2937',

    textAlign: 'center',
  },

  stockLimit: {
    marginTop: 4,

    maxWidth: '100%',

    paddingHorizontal: 2,

    fontSize: 10,

    lineHeight: 13,

    textAlign: 'center',

    color: '#EF4444',
  },
})
