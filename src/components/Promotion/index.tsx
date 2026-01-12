import React, { useEffect, useRef, useState } from 'react'
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Linking,
} from 'react-native'
import { Box, View, Image, useToast } from 'native-base'
import { FlatList } from 'react-native'
import type { FlatList as RNFlatList } from 'react-native'

import { BannerDTO } from '@dtos/BannerDTO'

type PromoBanner = {
  id: string
  imageUrl: string
  position: number
  storeId?: string
  link?: string | null
}

type Props = {
  banners: BannerDTO[]
}

const { width } = Dimensions.get('window')

// Card quase tela cheia (padrão iFood / Uber Eats)
const CARD_W = Math.min(320, width - 24)
const CARD_H = 120
const CARD_GAP = 14

export function Promotion({ banners: bannersFromProps }: Props) {
  const toast = useToast()
  const listRef = useRef<RNFlatList<PromoBanner>>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // 🔹 Normaliza banners recebidos
  const banners: PromoBanner[] = (bannersFromProps ?? []).map((b) => ({
    id: b.id,
    imageUrl: b.imageUrl,
    position: b.position,
    storeId: b.storeId,
    link: b.link ?? undefined,
  }))

  // 🔹 Autoplay (mantido)
  useEffect(() => {
    if (banners.length <= 1) return

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length
        listRef.current?.scrollToIndex({
          index: next,
          animated: true,
        })
        return next
      })
    }, 5000)

    return () => clearInterval(timer)
  }, [banners.length])

  function handlePress(link?: string | null) {
    if (!link) return

    let formattedLink = link.trim()

    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`
    }

    Linking.openURL(formattedLink).catch(() =>
      toast.show({
        title: 'Link inválido.',
        placement: 'top',
      }),
    )
  }

  if (!banners.length) return null

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={listRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => item.id ?? `banner-${index}`}
        style={{ maxHeight: CARD_H + 12 }}
        getItemLayout={(_, index) => ({
          length: CARD_W + CARD_GAP,
          offset: (CARD_W + CARD_GAP) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            })
          }, 250)
        }}
        onMomentumScrollEnd={(event) => {
          const x = event.nativeEvent.contentOffset.x
          const idx = Math.round(x / (CARD_W + CARD_GAP))
          setActiveIndex(idx)
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item.link)}
            style={{ marginLeft: 12, marginRight: 2 }}
          >
            <Image
              source={{ uri: item.imageUrl }}
              alt="Banner promocional"
              w={CARD_W}
              h={CARD_H}
              borderRadius="xl"
              resizeMode="cover"
            />
          </Pressable>
        )}
      />

      {banners.length > 1 && (
        <Box flexDirection="row" justifyContent="center" mt={2}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { opacity: i === activeIndex ? 1 : 0.35 }]}
            />
          ))}
        </Box>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 2,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    backgroundColor: 'blue',
  },
})
