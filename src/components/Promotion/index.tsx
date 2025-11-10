import React, { useEffect, useRef, useState } from 'react'
import {
  Dimensions,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Linking,
} from 'react-native'
import { Box, View, Image, Spinner, useToast } from 'native-base'
import { FlatList } from 'react-native' // ✅ usa o RN puro p/ ref sem dor de cabeça
import type { FlatList as RNFlatList } from 'react-native'
import { api } from '@services/api'

type BannerDTO = {
  id: string
  title: string
  image_url: string
  link?: string | null
}

type PromoBanner = {
  id: string
  imageUrl: string
  link?: string | null
}

const { width } = Dimensions.get('window')
// ✅ Deixe o card ocupar quase a tela inteira (com folga de 24)
const CARD_W = Math.min(320, width - 24)
const CARD_H = 120
const CARD_GAP = 14 // soma das margens laterais (12 + 2) do seu Pressable

export function Promotion() {
  const toast = useToast()
  const listRef = useRef<RNFlatList<PromoBanner>>(null)

  const [banners, setBanners] = useState<PromoBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number>(0)

  async function fetchBanners() {
    try {
      setLoading(true)
      const { data } = await api.get<BannerDTO[]>('/banners')
      const mapped: PromoBanner[] = (data ?? []).map((b) => ({
        id: b.id,
        imageUrl: b.image_url,
        link: b.link ?? undefined,
      }))
      setBanners(mapped)
    } catch {
      toast.show({
        title: 'Não foi possível carregar os banners.',
        placement: 'top',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  // ✅ Autoplay
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length
        listRef.current?.scrollToIndex({ index: next, animated: true })
        return next
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  function handlePress(link?: string | null) {
    if (!link) return

    let formattedLink = link.trim()

    // Se não começa com http:// ou https://, adiciona https://
    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`
    }

    Linking.openURL(formattedLink).catch(() =>
      toast.show({ title: 'Link inválido.', placement: 'top' }),
    )
  }

  if (loading) {
    return (
      <Box alignItems="center" justifyContent="center" h={CARD_H}>
        <Spinner accessibilityLabel="Carregando banners" />
      </Box>
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
        keyExtractor={(item) => String(item.id)}
        style={{ maxHeight: CARD_H + 12 }}
        // ✅ diz ao FlatList exatamente o tamanho de cada item (facilita scrollToIndex)
        getItemLayout={(_, index) => ({
          length: CARD_W + CARD_GAP,
          offset: (CARD_W + CARD_GAP) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          // tenta de novo rapidamente
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            })
          }, 250)
        }}
        // ✅ calcula o índice com base no CARD_W + GAP, não no width da tela
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

      {banners.length > 1 ? (
        <Box flexDirection="row" justifyContent="center" mt={2}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { opacity: i === activeIndex ? 1 : 0.35 }]}
            />
          ))}
        </Box>
      ) : null}
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
