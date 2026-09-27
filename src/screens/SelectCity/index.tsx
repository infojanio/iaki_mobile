import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'

import { MaterialIcons } from '@expo/vector-icons'

import { useNavigation } from '@react-navigation/native'

import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import MapBackground from '@assets/selectCity.png'
import IakiLogo from '@assets/logoiaki.png'

import { CartContext } from '@contexts/CartContext'

import { CityContext } from '@contexts/CityContext'

import { RootStackParamList } from '@routes/types'

import { stateService, State } from '@services/stateService'

import { cityService, City } from '@services/cityService'

import { useAuth } from '@hooks/useAuth'

type NavigationProps = NativeStackNavigationProp<
  RootStackParamList,
  'selectCity'
>

export function SelectCity() {
  const navigation = useNavigation<NavigationProps>()

  const { setUserCity } = useContext(CityContext)

  const { clearCartBadge } = useContext(CartContext)

  const { signOut } = useAuth()

  /* =====================================
     STATES
  ===================================== */

  const [states, setStates] = useState<State[]>([])

  const [cities, setCities] = useState<City[]>([])

  const [selectedState, setSelectedState] = useState<State | null>(null)

  const [loadingStates, setLoadingStates] = useState(true)

  const [loadingCities, setLoadingCities] = useState(false)

  const [selectingCityId, setSelectingCityId] = useState<string | null>(null)

  const [statesError, setStatesError] = useState(false)

  const [citiesError, setCitiesError] = useState(false)

  /* =====================================
     REFS
  ===================================== */

  const isMountedRef = useRef(true)

  const loadingCitiesRef = useRef(false)

  const selectingCityRef = useRef(false)

  const statesRequestIdRef = useRef(0)

  const citiesRequestIdRef = useRef(0)

  /* =====================================
     CONTROLE DE MONTAGEM
  ===================================== */

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      statesRequestIdRef.current += 1

      citiesRequestIdRef.current += 1
    }
  }, [])

  /* =====================================
     CARREGAR ESTADOS
  ===================================== */

  const loadStates = useCallback(async () => {
    const requestId = ++statesRequestIdRef.current

    try {
      setLoadingStates(true)

      setStatesError(false)

      const data = await stateService.listStates()

      if (!isMountedRef.current || requestId !== statesRequestIdRef.current) {
        return
      }

      const normalizedStates = Array.isArray(data)
        ? data.filter((state) => Boolean(state?.id && state?.name))
        : []

      setStates(normalizedStates)
    } catch (error) {
      if (!isMountedRef.current || requestId !== statesRequestIdRef.current) {
        return
      }

      console.error('[SelectCity] Erro ao carregar estados:', error)

      setStates([])

      setStatesError(true)
    } finally {
      if (isMountedRef.current && requestId === statesRequestIdRef.current) {
        setLoadingStates(false)
      }
    }
  }, [])

  /* =====================================
     CARREGAR CIDADES
  ===================================== */

  const loadCities = useCallback(
    async (state: State) => {
      if (!state?.id || loadingCitiesRef.current) {
        return
      }

      if (state.id === selectedState?.id && cities.length > 0) {
        return
      }

      loadingCitiesRef.current = true

      const requestId = ++citiesRequestIdRef.current

      try {
        setSelectedState(state)

        setCities([])

        setCitiesError(false)

        setLoadingCities(true)

        const data = await cityService.listCitiesByState(state.id)

        if (!isMountedRef.current || requestId !== citiesRequestIdRef.current) {
          return
        }

        const normalizedCities = Array.isArray(data)
          ? data.filter((city) => Boolean(city?.id && city?.name))
          : []

        setCities(normalizedCities)
      } catch (error) {
        if (!isMountedRef.current || requestId !== citiesRequestIdRef.current) {
          return
        }

        console.error('[SelectCity] Erro ao carregar cidades:', error)

        setCities([])

        setCitiesError(true)
      } finally {
        if (requestId === citiesRequestIdRef.current) {
          loadingCitiesRef.current = false

          if (isMountedRef.current) {
            setLoadingCities(false)
          }
        }
      }
    },
    [cities.length, selectedState?.id],
  )

  /* =====================================
     SELECIONAR CIDADE
  ===================================== */

  const handleSelectCity = useCallback(
    async (city: City) => {
      if (!city?.id || selectingCityRef.current) {
        return
      }

      selectingCityRef.current = true

      setSelectingCityId(city.id)

      try {
        const selectedCity = {
          id: city.id,

          name: city.name,

          uf: city.uf ?? selectedState?.uf ?? '',
        }

        await setUserCity(selectedCity)

        if (!isMountedRef.current) {
          return
        }

        clearCartBadge()

        navigation.reset({
          index: 0,

          routes: [
            {
              name: 'appRoutes',
            },
          ],
        })
      } catch (error) {
        console.error('[SelectCity] Erro ao selecionar cidade:', error)

        selectingCityRef.current = false

        if (isMountedRef.current) {
          setSelectingCityId(null)
        }
      }
    },
    [clearCartBadge, navigation, selectedState?.uf, setUserCity],
  )

  /* =====================================
     VOLTAR
  ===================================== */

  const handleBackToLogin = useCallback(async () => {
    if (selectingCityRef.current) {
      return
    }

    try {
      await signOut()
    } catch (error) {
      console.error('[SelectCity] Erro ao sair:', error)
    }
  }, [signOut])

  /* =====================================
     RENDER ESTADO
  ===================================== */

  const renderState = useCallback(
    ({ item }: ListRenderItemInfo<State>) => {
      const isSelected = selectedState?.id === item.id

      return (
        <Pressable
          onPress={() => void loadCities(item)}
          disabled={loadingCities}
          accessibilityRole="button"
          accessibilityLabel={`Selecionar estado ${item.name}`}
          style={({ pressed }) => [
            styles.stateButton,

            isSelected ? styles.stateButtonSelected : styles.stateButtonDefault,

            loadingCities && !isSelected ? styles.disabled : null,

            pressed ? styles.pressed : null,
          ]}
        >
          <MaterialIcons
            name="location-on"
            size={17}
            color={isSelected ? '#FFFFFF' : '#6B7280'}
          />

          <Text
            numberOfLines={1}
            style={[
              styles.stateText,

              isSelected ? styles.stateTextSelected : styles.stateTextDefault,
            ]}
          >
            {item.name}
          </Text>
        </Pressable>
      )
    },
    [loadCities, loadingCities, selectedState?.id],
  )

  /* =====================================
     RENDER CIDADE
  ===================================== */

  const renderCity = useCallback(
    ({ item }: ListRenderItemInfo<City>) => {
      const isSelecting = selectingCityId === item.id

      const isDisabled = selectingCityId !== null && !isSelecting

      const uf = item.uf ?? selectedState?.uf ?? ''

      return (
        <Pressable
          onPress={() => void handleSelectCity(item)}
          disabled={selectingCityId !== null}
          accessibilityRole="button"
          accessibilityLabel={`Selecionar cidade ${item.name}`}
          style={({ pressed }) => [
            styles.cityCard,

            isSelecting ? styles.cityCardSelecting : styles.cityCardDefault,

            isDisabled ? styles.disabled : null,

            pressed ? styles.cityCardPressed : null,
          ]}
        >
          <View style={styles.cityIconContainer}>
            <MaterialIcons name="location-on" size={24} color="#16A34A" />
          </View>

          <View style={styles.cityContent}>
            <Text numberOfLines={1} style={styles.cityName}>
              {item.name}
            </Text>

            {uf ? <Text style={styles.citySubtitle}>{uf}</Text> : null}
          </View>

          {isSelecting ? (
            <ActivityIndicator size="small" color="#16A34A" />
          ) : (
            <MaterialIcons name="chevron-right" size={27} color="#9CA3AF" />
          )}
        </Pressable>
      )
    },
    [handleSelectCity, selectedState?.uf, selectingCityId],
  )

  /* =====================================
     PRIMEIRA CARGA
  ===================================== */

  useEffect(() => {
    void loadStates()
  }, [loadStates])

  /* =====================================
     HEADER DA LISTA
  ===================================== */

  const renderHeader = useCallback(
    () => (
      <>
        {/* HERO */}

        <View style={styles.hero}>
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <MaterialIcons name="location-on" size={22} color="#EA580C" />
            </View>

            <Text style={styles.title}>Onde você está?</Text>
          </View>

          <Text style={styles.subtitle}>
            Selecione seu estado e a cidade para encontrar lojas, produtos e
            brindes disponíveis perto de você.
          </Text>
        </View>

        {/* ESTADOS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Estado</Text>
        </View>

        {loadingStates ? (
          <View style={styles.statesLoading}>
            <ActivityIndicator size="small" color="#16A34A" />

            <Text style={styles.loadingSmallText}>Carregando estados...</Text>
          </View>
        ) : statesError ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="cloud-off" size={24} color="#6B7280" />

            <Text style={styles.errorText}>
              Não foi possível carregar os estados.
            </Text>

            <Pressable
              onPress={() => void loadStates()}
              style={({ pressed }) => [
                styles.retryButton,

                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={states}
            horizontal
            renderItem={renderState}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={3}
            contentContainerStyle={styles.statesContent}
            ListEmptyComponent={
              <View style={styles.emptyStates}>
                <Text style={styles.emptyText}>Nenhum estado encontrado.</Text>
              </View>
            }
          />
        )}

        {/* CIDADES */}

        <View style={styles.citiesHeader}>
          <View>
            <Text style={styles.citiesTitle}>Onde deseja comprar?</Text>

            {selectedState ? (
              <Text style={styles.citiesSubtitle}>
                Cidades disponíveis em {selectedState.name}
              </Text>
            ) : (
              <Text style={styles.citiesSubtitle}>
                Primeiro escolha um estado
              </Text>
            )}
          </View>
        </View>

        {loadingCities ? (
          <View style={styles.citiesLoading}>
            <ActivityIndicator size="large" color="#16A34A" />

            <Text style={styles.loadingText}>Buscando cidades...</Text>
          </View>
        ) : citiesError ? (
          <View style={styles.cityErrorBox}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="wifi-off" size={27} color="#6B7280" />
            </View>

            <Text style={styles.emptyTitle}>
              Não foi possível carregar as cidades
            </Text>

            <Text style={styles.emptyDescription}>
              Verifique sua conexão e tente novamente.
            </Text>

            {selectedState && (
              <Pressable
                onPress={() => void loadCities(selectedState)}
                style={({ pressed }) => [
                  styles.retryCityButton,

                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryCityText}>Tentar novamente</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </>
    ),
    [
      citiesError,
      loadCities,
      loadStates,
      loadingCities,
      loadingStates,
      renderState,
      selectedState,
      states,
      statesError,
    ],
  )

  /* =====================================
     EMPTY CIDADES
  ===================================== */

  const renderEmptyCities = useCallback(() => {
    if (loadingCities || citiesError) {
      return null
    }

    if (!selectedState) {
      return (
        <View style={styles.emptyCities}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="touch-app" size={28} color="#16A34A" />
          </View>

          <Text style={styles.emptyTitle}>Selecione um estado</Text>

          <Text style={styles.emptyDescription}>
            As cidades disponíveis aparecerão aqui.
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.emptyCities}>
        <View style={styles.emptyIcon}>
          <MaterialIcons name="location-off" size={28} color="#6B7280" />
        </View>

        <Text style={styles.emptyTitle}>Nenhuma cidade disponível</Text>

        <Text style={styles.emptyDescription}>
          Ainda não encontramos cidades cadastradas neste estado.
        </Text>
      </View>
    )
  }, [citiesError, loadingCities, selectedState])

  /* =====================================
     TELA
  ===================================== */

  return (
    <ImageBackground
      source={MapBackground}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* =================================
              TOP BAR
          ================================= */}

          <View style={styles.topBar}>
            <Pressable
              onPress={() => void handleBackToLogin()}
              disabled={selectingCityId !== null}
              accessibilityRole="button"
              accessibilityLabel="Voltar para o login"
              hitSlop={10}
              style={({ pressed }) => [
                styles.backButton,

                pressed && styles.backButtonPressed,
              ]}
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={20}
                color="#374151"
              />
            </Pressable>

            <View style={styles.topBarSpacer} />
          </View>

          {/* =================================
              LISTA
          ================================= */}

          <FlatList
            data={loadingCities || citiesError ? [] : cities}
            renderItem={renderCity}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={false}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyCities}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.brandRow}>
            <Image
              source={IakiLogo}
              style={styles.logo}
              resizeMode="center"
              fadeDuration={0}
            />
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  /* ==================================
       FUNDO
    ================================== */

  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,

    backgroundColor: 'rgba(248,250,252,0.94)',
  },

  safeArea: {
    flex: 1,
  },

  /* ==================================
       TOP BAR
    ================================== */

  topBar: {
    height: 58,

    paddingHorizontal: 18,

    flexDirection: 'row',

    alignItems: 'center',
  },

  topBarSpacer: {
    flex: 1,
  },

  backButton: {
    width: 44,

    height: 44,

    borderRadius: 22,

    alignItems: 'center',

    justifyContent: 'center',

    paddingLeft: 4,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#F1F5F9',

    shadowColor: '#000000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.08,

    shadowRadius: 6,

    elevation: 3,
  },

  backButtonPressed: {
    transform: [
      {
        scale: 0.96,
      },
    ],

    opacity: 0.8,
  },

  /* ==================================
       LISTA
    ================================== */

  listContent: {
    flexGrow: 1,

    paddingHorizontal: 20,

    paddingBottom: 32,
  },

  /* ==================================
       HERO
    ================================== */

  hero: {
    paddingTop: 4,
    marginTop: 16,
    marginBottom: 16,
    paddingBottom: 18,
  },

  brandRow: {
    height: 80,

    marginBottom: 12,

    justifyContent: 'center',
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  titleRow: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  titleIcon: {
    width: 36,

    height: 36,

    marginRight: 9,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FFF7ED',
  },

  title: {
    flex: 1,

    fontSize: 29,

    lineHeight: 35,

    fontWeight: '800',

    letterSpacing: -0.5,

    color: '#0F172A',
  },

  subtitle: {
    maxWidth: 520,

    marginTop: 10,

    fontSize: 15,

    lineHeight: 22,

    color: '#64748B',
  },

  /* ==================================
       SEÇÕES
    ================================== */

  sectionHeader: {
    marginTop: 4,

    marginBottom: 8,
  },

  sectionLabel: {
    fontSize: 13,

    lineHeight: 18,

    fontWeight: '700',

    textTransform: 'uppercase',

    letterSpacing: 0.7,

    color: '#64748B',
  },

  /* ==================================
       ESTADOS
    ================================== */

  statesContent: {
    paddingRight: 12,

    paddingBottom: 4,
  },

  statesLoading: {
    minHeight: 52,

    flexDirection: 'row',

    alignItems: 'center',
  },

  loadingSmallText: {
    marginLeft: 9,

    fontSize: 13,

    color: '#64748B',
  },

  stateButton: {
    minWidth: 102,

    height: 44,

    marginRight: 9,

    paddingHorizontal: 15,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 22,

    borderWidth: 1,
  },

  stateButtonDefault: {
    backgroundColor: 'rgba(255,255,255,0.96)',

    borderColor: '#E2E8F0',
  },

  stateButtonSelected: {
    backgroundColor: '#16A34A',

    borderColor: '#16A34A',

    shadowColor: '#16A34A',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.2,

    shadowRadius: 6,

    elevation: 3,
  },

  stateText: {
    maxWidth: 150,

    marginLeft: 5,

    fontSize: 14,

    lineHeight: 18,

    fontWeight: '700',
  },

  stateTextDefault: {
    color: '#334155',
  },

  stateTextSelected: {
    color: '#FFFFFF',
  },

  emptyStates: {
    height: 44,

    justifyContent: 'center',
  },

  /* ==================================
       HEADER CIDADES
    ================================== */

  citiesHeader: {
    marginTop: 28,

    marginBottom: 14,
  },

  citiesTitle: {
    fontSize: 20,

    lineHeight: 26,

    fontWeight: '800',

    color: '#0F172A',
  },

  citiesSubtitle: {
    marginTop: 3,

    fontSize: 13,

    lineHeight: 18,

    color: '#64748B',
  },

  /* ==================================
       CARD CIDADE
    ================================== */

  cityCard: {
    minHeight: 76,

    marginBottom: 11,

    paddingHorizontal: 14,

    paddingVertical: 11,

    borderRadius: 18,

    borderWidth: 1,

    flexDirection: 'row',

    alignItems: 'center',

    shadowColor: '#0F172A',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.06,

    shadowRadius: 8,

    elevation: 2,
  },

  cityCardDefault: {
    backgroundColor: 'rgba(255,255,255,0.97)',

    borderColor: '#EEF2F7',
  },

  cityCardSelecting: {
    backgroundColor: '#F0FDF4',

    borderColor: '#22C55E',
  },

  cityCardPressed: {
    transform: [
      {
        scale: 0.987,
      },
    ],

    opacity: 0.9,
  },

  cityIconContainer: {
    width: 48,

    height: 48,

    marginRight: 13,

    borderRadius: 16,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#ECFDF5',
  },

  cityContent: {
    flex: 1,

    minWidth: 0,
  },

  cityName: {
    fontSize: 16,

    lineHeight: 21,

    fontWeight: '700',

    color: '#1E293B',
  },

  citySubtitle: {
    marginTop: 2,

    fontSize: 12,

    lineHeight: 16,

    fontWeight: '600',

    color: '#94A3B8',
  },

  /* ==================================
       LOADING CIDADES
    ================================== */

  citiesLoading: {
    minHeight: 180,

    alignItems: 'center',

    justifyContent: 'center',

    paddingBottom: 24,
  },

  loadingText: {
    marginTop: 12,

    fontSize: 13,

    color: '#64748B',
  },

  /* ==================================
       EMPTY
    ================================== */

  emptyCities: {
    minHeight: 220,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 28,

    paddingBottom: 30,
  },

  emptyIcon: {
    width: 60,

    height: 60,

    marginBottom: 14,

    borderRadius: 20,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#F0FDF4',
  },

  emptyTitle: {
    fontSize: 16,

    lineHeight: 22,

    fontWeight: '700',

    textAlign: 'center',

    color: '#334155',
  },

  emptyDescription: {
    maxWidth: 300,

    marginTop: 5,

    fontSize: 13,

    lineHeight: 19,

    textAlign: 'center',

    color: '#64748B',
  },

  emptyText: {
    fontSize: 14,

    color: '#64748B',
  },

  /* ==================================
       ERROS
    ================================== */

  errorBox: {
    minHeight: 82,

    paddingHorizontal: 14,

    paddingVertical: 12,

    borderRadius: 16,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.95)',

    borderWidth: 1,

    borderColor: '#E2E8F0',
  },

  errorText: {
    flex: 1,

    marginHorizontal: 9,

    fontSize: 13,

    lineHeight: 18,

    color: '#64748B',
  },

  retryButton: {
    minHeight: 34,

    paddingHorizontal: 10,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: '#F0FDF4',
  },

  retryText: {
    fontSize: 12,

    fontWeight: '700',

    color: '#16A34A',
  },

  cityErrorBox: {
    minHeight: 220,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 28,

    paddingBottom: 30,
  },

  retryCityButton: {
    minHeight: 42,

    marginTop: 16,

    paddingHorizontal: 18,

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 12,

    backgroundColor: '#16A34A',
  },

  retryCityText: {
    fontSize: 13,

    fontWeight: '700',

    color: '#FFFFFF',
  },

  /* ==================================
       ESTADOS GENÉRICOS
    ================================== */

  disabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.7,
  },
})
