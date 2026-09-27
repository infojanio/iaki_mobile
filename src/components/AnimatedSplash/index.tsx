import React, { useEffect, useRef } from 'react'

import { Animated, Image, StyleSheet, Text, View } from 'react-native'

import IakiLogo from '@assets/logoiaki.png'

type Props = {
  onFinish: () => void
}

export function AnimatedSplash({ onFinish }: Props) {
  /* =====================================
     CONTAINER
  ===================================== */

  const screenOpacity = useRef(new Animated.Value(1)).current

  /* =====================================
     LOGO
  ===================================== */

  const logoOpacity = useRef(new Animated.Value(0)).current

  const logoScale = useRef(new Animated.Value(0.75)).current

  const logoTranslateY = useRef(new Animated.Value(20)).current

  /* =====================================
     PONTOS
  ===================================== */

  const blueDotScale = useRef(new Animated.Value(0)).current

  const yellowDotScale = useRef(new Animated.Value(0)).current

  const redDotScale = useRef(new Animated.Value(0)).current

  /* =====================================
     SLOGAN
  ===================================== */

  const sloganOpacity = useRef(new Animated.Value(0)).current

  const sloganTranslateY = useRef(new Animated.Value(14)).current

  /* =====================================
     ANIMAÇÃO
  ===================================== */

  useEffect(() => {
    Animated.sequence([
      /* ===============================
         LOGO
      =============================== */

      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,

          duration: 450,

          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,

          friction: 6,

          tension: 55,

          useNativeDriver: true,
        }),

        Animated.timing(logoTranslateY, {
          toValue: 0,

          duration: 450,

          useNativeDriver: true,
        }),
      ]),

      /* ===============================
         PONTOS
      =============================== */

      Animated.stagger(110, [
        Animated.spring(blueDotScale, {
          toValue: 1,

          friction: 4,

          tension: 90,

          useNativeDriver: true,
        }),

        Animated.spring(yellowDotScale, {
          toValue: 1,

          friction: 4,

          tension: 90,

          useNativeDriver: true,
        }),

        Animated.spring(redDotScale, {
          toValue: 1,

          friction: 4,

          tension: 90,

          useNativeDriver: true,
        }),
      ]),

      /* ===============================
         SLOGAN
      =============================== */

      Animated.parallel([
        Animated.timing(sloganOpacity, {
          toValue: 1,

          duration: 350,

          useNativeDriver: true,
        }),

        Animated.timing(sloganTranslateY, {
          toValue: 0,

          duration: 350,

          useNativeDriver: true,
        }),
      ]),

      /* ===============================
         TEMPO NA TELA
      =============================== */

      Animated.delay(650),

      /* ===============================
         SAÍDA
      =============================== */

      Animated.timing(screenOpacity, {
        toValue: 0,

        duration: 400,

        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onFinish()
      }
    })
  }, [
    blueDotScale,
    logoOpacity,
    logoScale,
    logoTranslateY,
    onFinish,
    redDotScale,
    screenOpacity,
    sloganOpacity,
    sloganTranslateY,
    yellowDotScale,
  ])

  /* =====================================
     TELA
  ===================================== */

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,

        {
          opacity: screenOpacity,
        },
      ]}
    >
      {/* DECORAÇÃO SUPERIOR */}

      <View style={styles.decorationOne} />

      <View style={styles.decorationTwo} />

      {/* =================================
          LOGO
      ================================= */}

      <Animated.View
        style={[
          styles.logoContainer,

          {
            opacity: logoOpacity,

            transform: [
              {
                translateY: logoTranslateY,
              },

              {
                scale: logoScale,
              },
            ],
          },
        ]}
      >
        <Image
          source={IakiLogo}
          style={styles.logo}
          resizeMode="contain"
          fadeDuration={0}
        />
      </Animated.View>

      {/* =================================
          PONTOS
      ================================= */}

      <View style={styles.dotsContainer}>
        <Animated.View
          style={[
            styles.dot,

            styles.blueDot,

            {
              transform: [
                {
                  scale: blueDotScale,
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.dot,

            styles.yellowDot,

            {
              transform: [
                {
                  scale: yellowDotScale,
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.dot,

            styles.redDot,

            {
              transform: [
                {
                  scale: redDotScale,
                },
              ],
            },
          ]}
        />
      </View>

      {/* =================================
          SLOGAN
      ================================= */}

      <Animated.View
        style={[
          styles.sloganContainer,

          {
            opacity: sloganOpacity,

            transform: [
              {
                translateY: sloganTranslateY,
              },
            ],
          },
        ]}
      >
        <Text style={styles.sloganFirstLine}>Acumule pontos,</Text>

        <Text style={styles.sloganSecondLine}>
          <Text style={styles.highlight}>troque</Text>

          {' por brindes'}
        </Text>
      </Animated.View>

      {/* =================================
          RODAPÉ
      ================================= */}

      <Animated.View
        style={[
          styles.footer,

          {
            opacity: sloganOpacity,
          },
        ]}
      >
        <Text style={styles.footerText}>Clube de vantagens</Text>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,

    zIndex: 99999,

    elevation: 99999,

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',

    backgroundColor: '#FFFFFF',
  },

  /* ==================================
       DECORAÇÃO
    ================================== */

  decorationOne: {
    position: 'absolute',

    width: 300,

    height: 300,

    top: -180,

    right: -120,

    borderRadius: 150,

    backgroundColor: '#EFF6FF',
  },

  decorationTwo: {
    position: 'absolute',

    width: 260,

    height: 260,

    bottom: -170,

    left: -120,

    borderRadius: 130,

    backgroundColor: '#F0FDF4',
  },

  /* ==================================
       LOGO
    ================================== */

  logoContainer: {
    width: 210,

    height: 150,

    alignItems: 'center',

    justifyContent: 'center',
  },

  logo: {
    width: '100%',

    height: '100%',
  },

  /* ==================================
       PONTOS
    ================================== */

  dotsContainer: {
    height: 40,

    marginTop: 2,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  dot: {
    width: 18,

    height: 18,

    marginHorizontal: 7,

    borderRadius: 9,

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,

      height: 2,
    },

    shadowOpacity: 0.12,

    shadowRadius: 3,

    elevation: 2,
  },

  blueDot: {
    backgroundColor: '#22C1D6',
  },

  yellowDot: {
    backgroundColor: '#FFC533',
  },

  redDot: {
    backgroundColor: '#FF4A57',
  },

  /* ==================================
       SLOGAN
    ================================== */

  sloganContainer: {
    marginTop: 16,

    alignItems: 'center',
  },

  sloganFirstLine: {
    fontSize: 21,

    lineHeight: 27,

    fontWeight: '700',

    color: '#1E2F50',

    textAlign: 'center',
  },

  sloganSecondLine: {
    marginTop: 2,

    fontSize: 21,

    lineHeight: 27,

    fontWeight: '700',

    color: '#1E2F50',

    textAlign: 'center',
  },

  highlight: {
    color: '#FF4A57',
  },

  /* ==================================
       RODAPÉ
    ================================== */

  footer: {
    position: 'absolute',

    bottom: 46,
  },

  footerText: {
    fontSize: 12,

    fontWeight: '600',

    letterSpacing: 1,

    textTransform: 'uppercase',

    color: '#9CA3AF',
  },
})
