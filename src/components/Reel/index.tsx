import React, { useEffect, useMemo, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  Dimensions,
  Pressable,
  Text,
  StyleSheet,
  Linking,
  FlatList,
} from 'react-native'

import type { FlatList as RNFlatList } from 'react-native'

import { Box, View, Image, Spinner, useToast } from 'native-base'

import { ReelDTO } from '@dtos/ReelDTO'

type PromoReel = {
  id: string
  title: string
  imageUrl: string
  link?: string | null
  storeId?: string | null
}

type Props = {
  reels?: ReelDTO[]
  isLoading?: boolean
}

const { width } = Dimensions.get('window')

const CARD_W = Math.min(180, width - 24)

const CARD_H = 330
const CARD_GAP = 14

const SNAP_INTERVAL = CARD_W + CARD_GAP

export function Reel({ reels: reelsFromProps = [], isLoading = false }: Props) {
  const toast = useToast()

  const listRef = useRef<RNFlatList<PromoReel>>(null)

  const [activeIndex, setActiveIndex] = useState(0)

  /*
   * A Home já buscou somente reels
   * de lojas PREMIUM.
   *
   * Este componente apenas normaliza
   * e exibe os dados recebidos.
   */
  const reels = useMemo<PromoReel[]>(() => {
    return reelsFromProps
      .filter((reel) => Boolean(reel.id && reel.imageUrl))
      .map((reel) => ({
        id: reel.id,
        title: reel.title ?? 'Reel promocional',
        imageUrl: reel.imageUrl,
        link: reel.link ?? null,
        storeId: reel.storeId ?? null,
      }))
      .slice(0, 8)
  }, [reelsFromProps])

  /*
   * Quando a cidade mudar e a Home
   * fornecer novos reels, volta para
   * o primeiro item.
   */
  useEffect(() => {
    setActiveIndex(0)

    if (reels.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({
          offset: 0,
          animated: false,
        })
      })
    }
  }, [reels])

  /*
   * Autoplay circular.
   */
  useEffect(() => {
    if (reels.length <= 1) {
      return
    }

    const timer = setInterval(() => {
      setActiveIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % reels.length

        listRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        })

        return nextIndex
      })
    }, 5000)

    return () => clearInterval(timer)
  }, [reels.length])

  function handlePress(link?: string | null) {
    if (!link?.trim()) {
      return
    }

    let formattedLink = link.trim()

    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`
    }

    Linking.openURL(formattedLink).catch(() => {
      toast.show({
        title: 'Não foi possível abrir o link.',
        placement: 'top',
      })
    })
  }

  if (isLoading) {
    return (
      <Box alignItems="center" justifyContent="center" h={CARD_H}>
        <Spinner accessibilityLabel="Carregando reels" />
      </Box>
    )
  }

  if (reels.length === 0) {
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🟡 Vitrine</Text>

      <FlatList
        ref={listRef}
        data={reels}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{
          paddingRight: 12,
        }}
        style={{
          maxHeight: CARD_H + 12,
        }}
        getItemLayout={(_, index) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: SNAP_INTERVAL * info.index,
            animated: true,
          })

          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            })
          }, 250)
        }}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x

          const calculatedIndex = Math.round(offsetX / SNAP_INTERVAL)

          const safeIndex = Math.min(
            Math.max(calculatedIndex, 0),
            reels.length - 1,
          )

          setActiveIndex(safeIndex)
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item.link)}
            style={{
              width: CARD_W,
              marginLeft: 12,
              marginRight: 2,
            }}
          >
            <Image
              source={{
                uri: item.imageUrl,
              }}
              alt={item.title || 'Reel promocional'}
              w={CARD_W}
              h={CARD_H}
              borderRadius="xl"
              resizeMode="stretch"
            />
          </Pressable>
        )}
      />

      {reels.length > 1 && (
        <Box flexDirection="row" justifyContent="center" mt={2}>
          {reels.map((reel, index) => (
            <View
              key={reel.id}
              style={[
                styles.dot,
                {
                  opacity: index === activeIndex ? 1 : 0.35,
                },
              ]}
            />
          ))}
        </Box>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 2,
    marginBottom: 4,
  },

  title: {
    marginTop: 2,
    marginLeft: 10,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    backgroundColor: 'blue',
  },
})
