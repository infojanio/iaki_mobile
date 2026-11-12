import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  AppState,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native'
import { useIsFocused, useNavigation } from '@react-navigation/native'

import type { BannerDTO } from '@dtos/BannerDTO'

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

const EMPTY_BANNERS: BannerDTO[] = []

const HORIZONTAL_PADDING = 10
const BANNER_ASPECT_RATIO = 1600 / 700
const AUTOPLAY_DELAY = 5000

export function Promotion({
  banners: bannersFromProps = EMPTY_BANNERS,
}: Props) {
  const navigation = useNavigation<any>()
  const isFocused = useIsFocused()
  const listRef = useRef<FlatList<PromoBanner>>(null)

  const [containerWidth, setContainerWidth] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState === 'active',
  )

  const cardWidth = Math.max(0, containerWidth - HORIZONTAL_PADDING * 2)
  const bannerHeight = cardWidth / BANNER_ASPECT_RATIO

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
      .sort((first, second) => first.position - second.position)
      .slice(0, 8)
  }, [bannersFromProps])

  const bannersKey = JSON.stringify(banners.map((banner) => banner.id))

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setIsAppActive(state === 'active')
    })

    return () => subscription.remove()
  }, [])

  useEffect(() => {
    setActiveIndex(0)
    setIsDragging(false)

    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [bannersKey, containerWidth])

  useEffect(() => {
    if (
      banners.length <= 1 ||
      cardWidth <= 0 ||
      isDragging ||
      !isFocused ||
      !isAppActive
    ) {
      return
    }

    const timer = setTimeout(() => {
      const nextIndex = (activeIndex + 1) % banners.length

      listRef.current?.scrollToOffset({
        offset: nextIndex * containerWidth,
        animated: nextIndex !== 0,
      })

      setActiveIndex(nextIndex)
    }, AUTOPLAY_DELAY)

    return () => clearTimeout(timer)
  }, [
    activeIndex,
    banners.length,
    bannersKey,
    cardWidth,
    containerWidth,
    isDragging,
    isFocused,
    isAppActive,
  ])

  function handleLayout(event: LayoutChangeEvent) {
    setContainerWidth(event.nativeEvent.layout.width)
  }

  function updateActiveIndex(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (containerWidth <= 0 || banners.length === 0) return

    const offset = event.nativeEvent.contentOffset.x
    const index = Math.round(offset / containerWidth)

    setActiveIndex(Math.min(Math.max(index, 0), banners.length - 1))
  }

  async function handlePress(item: PromoBanner) {
    if (item.storeId) {
      navigation.navigate('storeProducts', {
        storeId: item.storeId,
      })

      return
    }

    const link = item.link?.trim()

    if (!link) return

    const formattedLink = /^https?:\/\//i.test(link) ? link : `https://${link}`

    try {
      await Linking.openURL(formattedLink)
    } catch {
      Alert.alert('Link indisponível', 'Não foi possível abrir este link.')
    }
  }

  if (banners.length === 0) return null

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {cardWidth > 0 && (
        <>
          <FlatList
            ref={listRef}
            data={banners}
            horizontal
            pagingEnabled
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            scrollEnabled={banners.length > 1}
            style={{ height: bannerHeight }}
            extraData={containerWidth}
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({
              length: containerWidth,
              offset: containerWidth * index,
              index,
            })}
            onScrollBeginDrag={() => setIsDragging(true)}
            onScrollEndDrag={(event) => {
              updateActiveIndex(event)
              setIsDragging(false)
            }}
            onMomentumScrollEnd={updateActiveIndex}
            renderItem={({ item, index }) => {
              const hasAction = Boolean(item.storeId || item.link?.trim())

              return (
                <View
                  style={[
                    styles.page,
                    { width: containerWidth, height: bannerHeight },
                  ]}
                >
                  <Pressable
                    disabled={!hasAction}
                    accessibilityRole={hasAction ? 'button' : 'image'}
                    accessibilityLabel={
                      hasAction
                        ? `Abrir oferta do banner ${index + 1}`
                        : `Banner promocional ${index + 1}`
                    }
                    onPress={() => void handlePress(item)}
                    style={({ pressed }) => [
                      styles.card,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.image}
                      resizeMode="contain"
                      resizeMethod="resize"
                      fadeDuration={0}
                    />
                  </Pressable>
                </View>
              )
            }}
          />

          {banners.length > 1 && (
            <View
              style={styles.dotsContainer}
              accessible
              accessibilityLabel={`Banner ${activeIndex + 1} de ${banners.length}`}
            >
              {banners.map((banner, index) => (
                <View
                  key={banner.id}
                  style={[
                    styles.dot,
                    index === activeIndex
                      ? styles.activeDot
                      : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 4,
  },

  page: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },

  card: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  dotsContainer: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: '#1D4ED8',
  },

  activeDot: {
    width: 18,
    opacity: 1,
  },

  inactiveDot: {
    width: 6,
    opacity: 0.25,
  },

  pressed: {
    opacity: 0.92,
  },
})
