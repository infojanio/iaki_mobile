import React, { useEffect, useMemo, useRef, useState } from 'react'

import {
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'

import type { FlatList as RNFlatList, LayoutChangeEvent } from 'react-native'

import { BannerDTO } from '@dtos/BannerDTO'

type PromoBanner = {
  id: string
  imageUrl: string
  position: number
  storeId?: string
  link?: string | null
}

type Props = {
  banners?: BannerDTO[]
}

/*
 * Padding lateral do carrossel.
 */
const HORIZONTAL_PADDING = 10

/*
 * Espaço entre banners.
 */
const CARD_GAP = 8

/*
 * Proporção recomendada para os banners.
 *
 * Em uma tela de aproximadamente 390px:
 * largura útil ≈ 370
 * altura ≈ 162
 *
 * Fica muito próximo do tamanho que
 * você já utilizava de 160px.
 */
const BANNER_ASPECT_RATIO = 16 / 7

export function Promotion({ banners: bannersFromProps = [] }: Props) {
  const { width: windowWidth } = useWindowDimensions()

  const listRef = useRef<RNFlatList<PromoBanner>>(null)

  const [activeIndex, setActiveIndex] = useState(0)

  /*
   * Usa inicialmente a largura da tela,
   * mas depois substitui pela largura REAL
   * disponível no componente.
   */
  const [containerWidth, setContainerWidth] = useState(windowWidth)

  /* =====================================
     TAMANHO RESPONSIVO
  ===================================== */

  const cardWidth = Math.max(1, containerWidth - HORIZONTAL_PADDING * 2)

  const cardHeight = cardWidth / BANNER_ASPECT_RATIO

  const snapInterval = cardWidth + CARD_GAP

  /* =====================================
     BANNERS
  ===================================== */

  const banners = useMemo<PromoBanner[]>(() => {
    return bannersFromProps
      .filter((banner) => Boolean(banner?.id && banner?.imageUrl))
      .map((banner) => ({
        id: banner.id,

        imageUrl: banner.imageUrl,

        position: banner.position ?? 0,

        storeId: banner.storeId,

        link: banner.link ?? null,
      }))
      .sort(
        (firstBanner, secondBanner) =>
          firstBanner.position - secondBanner.position,
      )
      .slice(0, 8)
  }, [bannersFromProps])

  /* =====================================
     MEDIR CONTAINER
  ===================================== */

  function handleLayout(event: LayoutChangeEvent) {
    const measuredWidth = event.nativeEvent.layout.width

    if (measuredWidth > 0 && Math.abs(measuredWidth - containerWidth) > 1) {
      setContainerWidth(measuredWidth)
    }
  }

  /* =====================================
     VOLTAR AO PRIMEIRO
  ===================================== */

  useEffect(() => {
    setActiveIndex(0)

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      })
    })
  }, [banners, cardWidth])

  /* =====================================
     AUTOPLAY
  ===================================== */

  useEffect(() => {
    if (banners.length <= 1) {
      return
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % banners.length

        listRef.current?.scrollToOffset({
          offset: snapInterval * next,

          animated: true,
        })

        return next
      })
    }, 5000)

    return () => {
      clearInterval(timer)
    }
  }, [banners.length, snapInterval])

  /* =====================================
     LINK
  ===================================== */

  async function handlePress(link?: string | null) {
    if (!link?.trim()) {
      return
    }

    let formattedLink = link.trim()

    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`
    }

    try {
      await Linking.openURL(formattedLink)
    } catch {
      Alert.alert('Link indisponível', 'Não foi possível abrir este link.')
    }
  }

  /* =====================================
     SEM BANNERS
  ===================================== */

  if (banners.length === 0) {
    return null
  }

  /* =====================================
     TELA
  ===================================== */

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <FlatList
        ref={listRef}
        data={banners}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        /*
         * IMPORTANTE:
         * removido pagingEnabled.
         */
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{
          paddingLeft: HORIZONTAL_PADDING,

          paddingRight: HORIZONTAL_PADDING,
        }}
        getItemLayout={(_, index) => ({
          length: snapInterval,

          offset: snapInterval * index,

          index,
        })}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: snapInterval * info.index,

            animated: true,
          })
        }}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x

          const index = Math.round(offsetX / snapInterval)

          const safeIndex = Math.min(
            Math.max(index, 0),

            banners.length - 1,
          )

          setActiveIndex(safeIndex)
        }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => void handlePress(item.link)}
            style={({ pressed }) => [
              styles.card,

              {
                width: cardWidth,

                height: cardHeight,

                marginRight: index === banners.length - 1 ? 0 : CARD_GAP,
              },

              pressed && styles.pressed,
            ]}
          >
            <Image
              source={{
                uri: item.imageUrl,
              }}
              style={styles.image}
              resizeMode="cover"
              resizeMethod="resize"
              fadeDuration={0}
            />
          </Pressable>
        )}
      />

      {/* INDICADORES */}

      {banners.length > 1 && (
        <View style={styles.dotsContainer}>
          {banners.map((banner, index) => (
            <View
              key={banner.id}
              style={[
                styles.dot,

                index === activeIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',

    /*
     * Não usamos:
     *
     * flex: 1
     * SafeAreaView
     * marginBottom negativo
     */
    marginTop: 0,

    marginBottom: 4,

    paddingTop: 0,
  },

  card: {
    overflow: 'hidden',

    borderRadius: 14,

    /*
     * Caso a proporção da imagem
     * seja diferente, a região
     * restante fica praticamente
     * branca/cinza muito claro.
     */
    backgroundColor: '#F9FAFB',
  },

  image: {
    width: '100%',

    height: '100%',
  },

  dotsContainer: {
    height: 18,

    marginTop: 4,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  dot: {
    height: 7,

    borderRadius: 4,

    marginHorizontal: 3,

    backgroundColor: '#1D4ED8',
  },

  activeDot: {
    width: 18,

    opacity: 1,
  },

  inactiveDot: {
    width: 7,

    opacity: 0.3,
  },

  pressed: {
    opacity: 0.92,
  },
})
