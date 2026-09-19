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
  ImageBackground,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'

import { MaterialIcons } from '@expo/vector-icons'

import MapBackground from '@assets/selectCity.png'

import { CartContext } from '@contexts/CartContext'

import { CityContext } from '@contexts/CityContext'

import { useNavigation } from '@react-navigation/native'

import { NativeStackNavigationProp } from '@react-navigation/native-stack'

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

  const [states, setStates] = useState<State[]>([])

  const [cities, setCities] = useState<City[]>([])

  const [selectedState, setSelectedState] = useState<State | null>(null)

  const [loadingStates, setLoadingStates] = useState(true)

  const [loadingCities, setLoadingCities] = useState(false)

  const [selectingCityId, setSelectingCityId] = useState<string | null>(null)

  /*
   * Impede atualizações de estado depois
   * que a tela for desmontada.
   */
  const isMountedRef = useRef(true)

  /*
   * Bloqueia vários cliques rápidos
   * enquanto uma lista de cidades carrega.
   */
  const loadingCitiesRef = useRef(false)

  /*
   * Evita selecionar duas cidades
   * antes que o React atualize o estado.
   */
  const selectingCityRef = useRef(false)

  /*
   * Identifica a requisição mais recente.
   *
   * Se uma resposta antiga chegar depois,
   * ela será ignorada.
   */
  const statesRequestIdRef = useRef(0)

  const citiesRequestIdRef = useRef(0)

  /* ==============================
     CONTROLE DE MONTAGEM
  ============================== */

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      /*
       * Invalida qualquer resposta
       * assíncrona pendente.
       */
      statesRequestIdRef.current += 1
      citiesRequestIdRef.current += 1
    }
  }, [])

  /* ==============================
     CARREGAR ESTADOS
  ============================== */

  const loadStates = useCallback(async () => {
    const requestId = ++statesRequestIdRef.current

    try {
      setLoadingStates(true)

      const data = await stateService.listStates()

      if (!isMountedRef.current || requestId !== statesRequestIdRef.current) {
        return
      }

      setStates(
        Array.isArray(data)
          ? data.filter((state) => Boolean(state?.id && state?.name))
          : [],
      )
    } catch (error) {
      if (!isMountedRef.current || requestId !== statesRequestIdRef.current) {
        return
      }

      console.error('[SelectCity] Erro ao carregar estados:', error)

      setStates([])
    } finally {
      if (isMountedRef.current && requestId === statesRequestIdRef.current) {
        setLoadingStates(false)
      }
    }
  }, [])

  /* ==============================
     CARREGAR CIDADES
  ============================== */

  const loadCities = useCallback(
    async (state: State) => {
      if (!state?.id || loadingCitiesRef.current) {
        return
      }

      /*
       * Permite tocar novamente no mesmo
       * estado se a primeira requisição
       * tiver falhado.
       */
      if (state.id === selectedState?.id && cities.length > 0) {
        return
      }

      loadingCitiesRef.current = true

      const requestId = ++citiesRequestIdRef.current

      try {
        setSelectedState(state)

        setCities([])

        setLoadingCities(true)

        const data = await cityService.listCitiesByState(state.id)

        if (!isMountedRef.current || requestId !== citiesRequestIdRef.current) {
          return
        }

        setCities(
          Array.isArray(data)
            ? data.filter((city) => Boolean(city?.id && city?.name))
            : [],
        )
      } catch (error) {
        if (!isMountedRef.current || requestId !== citiesRequestIdRef.current) {
          return
        }

        console.error('[SelectCity] Erro ao carregar cidades:', error)

        setCities([])
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

  /* ==============================
     SELECIONAR CIDADE
  ============================== */

  const handleSelectCity = useCallback(
    async (city: City) => {
      if (!city?.id || selectingCityRef.current) {
        return
      }

      /*
       * useRef bloqueia imediatamente.
       * Não depende do próximo render.
       */
      selectingCityRef.current = true

      setSelectingCityId(city.id)

      try {
        const selectedCity = {
          id: city.id,

          name: city.name,

          uf: city.uf ?? selectedState?.uf ?? '',
        }

        /*
         * Aguarda confirmação da cidade
         * antes de navegar.
         */
        await setUserCity(selectedCity)

        if (!isMountedRef.current) {
          return
        }

        /*
         * Limpa somente o badge visual
         * do carrinho.
         */
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

  /* ==============================
     VOLTAR PARA LOGIN
  ============================== */

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

  /* ==============================
     RENDER ESTADO
  ============================== */

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

  /* ==============================
     RENDER CIDADE
  ============================== */

  const renderCity = useCallback(
    ({ item }: ListRenderItemInfo<City>) => {
      const isSelecting = selectingCityId === item.id

      const isDisabled = selectingCityId !== null && !isSelecting

      return (
        <Pressable
          onPress={() => void handleSelectCity(item)}
          disabled={selectingCityId !== null}
          accessibilityRole="button"
          accessibilityLabel={`Selecionar cidade ${item.name}`}
          style={({ pressed }) => [
            styles.cityButton,

            isSelecting ? styles.cityButtonSelecting : styles.cityButtonDefault,

            isDisabled ? styles.disabled : null,

            pressed ? styles.pressed : null,
          ]}
        >
          <View style={styles.cityRow}>
            <Text numberOfLines={1} style={styles.cityName}>
              {item.name}
            </Text>

            {isSelecting ? (
              <ActivityIndicator size="small" color="#16A34A" />
            ) : (
              <Text style={styles.cityUf}>
                {item.uf ?? selectedState?.uf ?? ''}
              </Text>
            )}
          </View>
        </Pressable>
      )
    },
    [handleSelectCity, selectedState?.uf, selectingCityId],
  )

  /* ==============================
     PRIMEIRA CARGA
  ============================== */

  useEffect(() => {
    void loadStates()
  }, [loadStates])

  /* ==============================
     TELA
  ============================== */

  return (
    <ImageBackground
      source={MapBackground}
      style={styles.background}
      resizeMode="stretch"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* VOLTAR */}

          <Pressable
            onPress={() => void handleBackToLogin()}
            disabled={selectingCityId !== null}
            accessibilityRole="button"
            accessibilityLabel="Voltar para o login"
            hitSlop={12}
            style={({ pressed }) => [
              styles.backButton,

              pressed ? styles.pressed : null,
            ]}
          >
            <MaterialIcons name="arrow-back" size={26} color="#374151" />
          </Pressable>

          <View style={styles.content}>
            {/* TÍTULO */}

            <View style={styles.titleRow}>
              <MaterialIcons name="location-on" size={27} color="#EA580C" />

              <Text style={styles.title}>Onde você está?</Text>
            </View>

            {/* ESTADOS */}

            {loadingStates ? (
              <View style={styles.statesLoading}>
                <ActivityIndicator size="small" color="#16A34A" />
              </View>
            ) : (
              <View style={styles.statesContainer}>
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
                      <Text style={styles.emptyText}>
                        Nenhum estado encontrado.
                      </Text>
                    </View>
                  }
                />
              </View>
            )}

            {/* CIDADES */}

            <Text style={styles.sectionTitle}>Onde deseja comprar?</Text>

            {loadingCities ? (
              <View style={styles.citiesLoading}>
                <ActivityIndicator size="large" color="#16A34A" />

                <Text style={styles.loadingText}>Carregando cidades...</Text>
              </View>
            ) : (
              <FlatList
                data={cities}
                renderItem={renderCity}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={5}
                removeClippedSubviews={false}
                contentContainerStyle={styles.citiesContent}
                ListEmptyComponent={
                  <View style={styles.emptyCities}>
                    <Text style={styles.emptyText}>
                      {selectedState
                        ? 'Nenhuma cidade encontrada.'
                        : 'Selecione o estado.'}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },

  safeArea: {
    flex: 1,
  },

  backButton: {
    width: 44,
    height: 44,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    marginLeft: 4,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: '#111827',
  },

  statesContainer: {
    height: 64,
  },

  statesLoading: {
    height: 64,
    justifyContent: 'center',
  },

  statesContent: {
    alignItems: 'center',
    paddingRight: 16,
  },

  stateButton: {
    minWidth: 96,
    height: 40,
    marginRight: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },

  stateButtonDefault: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },

  stateButtonSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },

  stateText: {
    fontSize: 14,
    fontWeight: '700',
  },

  stateTextDefault: {
    color: '#1F2937',
  },

  stateTextSelected: {
    color: '#FFFFFF',
  },

  sectionTitle: {
    marginTop: 12,
    marginBottom: 12,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#111827',
  },

  cityButton: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },

  cityButtonDefault: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },

  cityButtonSelecting: {
    backgroundColor: '#F3F4F6',
    borderColor: '#22C55E',
  },

  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cityName: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#374151',
  },

  cityUf: {
    marginLeft: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#4B5563',
  },

  citiesContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },

  citiesLoading: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
  },

  emptyStates: {
    height: 56,
    justifyContent: 'center',
  },

  emptyCities: {
    paddingTop: 16,
  },

  emptyText: {
    fontSize: 14,
    color: '#4B5563',
  },

  disabled: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.7,
  },
})
