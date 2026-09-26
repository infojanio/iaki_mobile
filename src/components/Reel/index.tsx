import React, { useEffect, useMemo, useRef, useState } from 'react'

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'

import type { FlatList as RNFlatList } from 'react-native'

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

/* =====================================
   CONFIGURAÇÕES
===================================== */

const CARD_H = 330

const CARD_GAP = 8

const HORIZONTAL_PADDING = 12

const AUTOPLAY_TIME = 5000

export function Reel({ reels: reelsFromProps = [], isLoading = false }: Props) {
  const { width } = useWindowDimensions()

  const listRef = useRef<RNFlatList<PromoReel>>(null)

  /*
   * Guarda o índice atual sem depender
   * da atualização assíncrona do state.
   */
  const activeIndexRef = useRef(0)

  const [activeIndex, setActiveIndex] = useState(0)

  /* =====================================
     TAMANHO RESPONSIVO
  ===================================== */

  const cardWidth = Math.min(180, width - HORIZONTAL_PADDING * 2)

  /*
   * Distância exata entre o início
   * de um card e o início do próximo.
   */
  const snapInterval = cardWidth + CARD_GAP

  /*
   * MUITO IMPORTANTE:
   *
   * cria espaço depois do último card
   * para que ele possa chegar até a
   * mesma posição horizontal dos demais.
   *
   * Sem isso, em telas largas o último
   * Reel pode não conseguir alinhar
   * totalmente e o FlatList aparenta
   * parar no penúltimo.
   */
  const endPadding = Math.max(
    HORIZONTAL_PADDING,

    width - HORIZONTAL_PADDING - cardWidth,
  )

  /* =====================================
     NORMALIZAR REELS
  ===================================== */

  const reels = useMemo<PromoReel[]>(() => {
    return reelsFromProps
      .filter((reel) => Boolean(reel?.id && reel?.imageUrl))
      .map((reel) => ({
        id: reel.id,

        title: reel.title ?? 'Reel promocional',

        imageUrl: reel.imageUrl,

        link: reel.link ?? null,

        storeId: reel.storeId ?? null,
      }))
      .slice(0, 8)
  }, [reelsFromProps])

  /* =====================================
     ATUALIZAR ÍNDICE
  ===================================== */

  function updateActiveIndex(index: number) {
    activeIndexRef.current = index

    setActiveIndex(index)
  }

  /* =====================================
     VOLTAR AO PRIMEIRO REEL
  ===================================== */

  useEffect(() => {
    updateActiveIndex(0)

    if (reels.length === 0) {
      return
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: 0,

        animated: false,
      })
    })
  }, [reels])

  /* =====================================
     AUTOPLAY
  ===================================== */

  useEffect(() => {
    if (reels.length <= 1) {
      return
    }

    const timer = setInterval(() => {
      const currentIndex = activeIndexRef.current

      /*
       * Exemplo com 4 reels:
       *
       * 0 → 1
       * 1 → 2
       * 2 → 3
       * 3 → 0
       */
      const nextIndex = (currentIndex + 1) % reels.length

      /*
       * Usamos offset em vez de
       * scrollToIndex.
       *
       * É mais previsível para
       * carrossel horizontal com
       * cards menores que a tela.
       */
      listRef.current?.scrollToOffset({
        offset: nextIndex * snapInterval,

        animated: true,
      })

      updateActiveIndex(nextIndex)
    }, AUTOPLAY_TIME)

    return () => {
      clearInterval(timer)
    }
  }, [reels.length, snapInterval])

  /* =====================================
     ABRIR LINK
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
     LOADING
  ===================================== */

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#1D4ED8" />
      </View>
    )
  }

  /* =====================================
     SEM REELS
  ===================================== */

  if (reels.length === 0) {
    return null
  }

  /* =====================================
     COMPONENTE
  ===================================== */

  return (
    <View style={styles.container}>
      {/* TÍTULO */}

      <Text style={styles.title}>🟡 Vitrine</Text>

      {/* CARROSSEL */}

      <FlatList
        ref={listRef}
        data={reels}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        /*
         * Cada rolagem para exatamente
         * no início do próximo card.
         */
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        /*
         * Não utilizar pagingEnabled.
         *
         * pagingEnabled trabalha com
         * a largura da tela, enquanto
         * nossos cards possuem ~180px.
         */

        /*
         * O paddingRight maior é o que
         * permite posicionar corretamente
         * o último Reel.
         */
        contentContainerStyle={{
          paddingLeft: HORIZONTAL_PADDING,

          paddingRight: endPadding,
        }}
        /*
         * Melhora o cálculo de posição
         * da lista.
         */
        getItemLayout={(_, index) => ({
          length: snapInterval,

          offset: snapInterval * index,

          index,
        })}
        /*
         * Quando o usuário arrastar
         * manualmente, atualizamos o
         * índice real em que ele parou.
         */
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x

          const calculatedIndex = Math.round(offsetX / snapInterval)

          const safeIndex = Math.min(
            Math.max(calculatedIndex, 0),

            reels.length - 1,
          )

          updateActiveIndex(safeIndex)
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => void handlePress(item.link)}
            style={({ pressed }) => [
              styles.card,

              {
                width: cardWidth,

                height: CARD_H,

                /*
                 * TODOS os cards possuem
                 * o mesmo marginRight.
                 *
                 * Isso mantém o cálculo
                 * do snapInterval correto
                 * até no último.
                 */
                marginRight: CARD_GAP,
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

      {/* =================================
          INDICADORES
      ================================= */}

      {reels.length > 1 && (
        <View style={styles.dotsContainer}>
          {reels.map((reel, index) => (
            <View
              key={reel.id}
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

/* =====================================
   ESTILOS
===================================== */

const styles = StyleSheet.create({
  container: {
    width: '100%',

    marginTop: 0,

    marginBottom: 2,

    paddingTop: 0,
  },

  /* ==================================
       TÍTULO
    ================================== */

  title: {
    marginTop: 0,

    marginLeft: HORIZONTAL_PADDING,

    marginBottom: 5,

    fontSize: 16,

    lineHeight: 20,

    fontWeight: '700',

    color: '#1F2937',
  },

  /* ==================================
       CARD
    ================================== */

  card: {
    flexShrink: 0,

    overflow: 'hidden',

    borderRadius: 16,

    backgroundColor: '#F3F4F6',
  },

  /* ==================================
       IMAGEM
    ================================== */

  image: {
    width: '100%',

    height: '100%',

    backgroundColor: '#F3F4F6',
  },

  /* ==================================
       INDICADORES
    ================================== */

  dotsContainer: {
    height: 18,

    marginTop: 5,

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

    opacity: 0.28,
  },

  /* ==================================
       LOADING
    ================================== */

  loading: {
    height: CARD_H,

    alignItems: 'center',

    justifyContent: 'center',
  },

  /* ==================================
       PRESS
    ================================== */

  pressed: {
    opacity: 0.9,
  },
})
