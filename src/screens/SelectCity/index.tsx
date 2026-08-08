import React, { useCallback, useContext, useEffect, useState } from 'react'

import { FlatList, ImageBackground, ListRenderItemInfo } from 'react-native'

import {
  Box,
  Text,
  Pressable,
  Spinner,
  VStack,
  IconButton,
  useTheme,
  HStack,
  Icon,
} from 'native-base'

import { MaterialIcons } from '@expo/vector-icons'

import MapBackground from '@assets/selectCity.png'

import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { RootStackParamList } from '@routes/types'
import { CityContext } from '@contexts/CityContext'
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
  const { signOut } = useAuth()
  const { colors, sizes } = useTheme()

  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedState, setSelectedState] = useState<State | null>(null)

  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)
  const [selectingCityId, setSelectingCityId] = useState<string | null>(null)

  const loadStates = useCallback(async () => {
    try {
      setLoadingStates(true)

      const data = await stateService.listStates()

      setStates(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('[SelectCity] Erro ao carregar estados:', error)
      setStates([])
    } finally {
      setLoadingStates(false)
    }
  }, [])

  const loadCities = useCallback(
    async (state: State) => {
      if (loadingCities || state.id === selectedState?.id) {
        return
      }

      try {
        setSelectedState(state)
        setCities([])
        setLoadingCities(true)

        const data = await cityService.listCitiesByState(state.id)

        setCities(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('[SelectCity] Erro ao carregar cidades:', error)
        setCities([])
      } finally {
        setLoadingCities(false)
      }
    },
    [loadingCities, selectedState?.id],
  )

  const handleSelectCity = useCallback(
    (city: City) => {
      if (selectingCityId) {
        return
      }

      setSelectingCityId(city.id)

      const selectedCity = {
        id: city.id,
        name: city.name,
        uf: city.uf ?? selectedState?.uf ?? '',
      }

      /*
       * Atualiza a cidade localmente e sincroniza com o backend
       * em segundo plano. A navegação não aguarda a API.
       */
      void setUserCity(selectedCity)

      navigation.reset({
        index: 0,
        routes: [{ name: 'appRoutes' }],
      })
    },
    [navigation, selectedState?.uf, selectingCityId, setUserCity],
  )

  const handleBackToLogin = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('[SelectCity] Erro ao sair:', error)
    }
  }, [signOut])

  const renderState = useCallback(
    ({ item }: ListRenderItemInfo<State>) => {
      const isSelected = selectedState?.id === item.id

      return (
        <Pressable
          onPress={() => loadCities(item)}
          disabled={loadingCities}
          mr={2}
          minW={24}
          h={10}
          px={4}
          alignItems="center"
          justifyContent="center"
          borderRadius="full"
          bg={isSelected ? 'green.600' : 'gray.200'}
          borderWidth={1}
          borderColor={isSelected ? 'green.600' : 'gray.300'}
          opacity={loadingCities && !isSelected ? 0.6 : 1}
        >
          <Text
            fontSize="sm"
            color={isSelected ? 'white' : 'gray.800'}
            fontWeight="bold"
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </Pressable>
      )
    },
    [loadCities, loadingCities, selectedState?.id],
  )

  const renderCity = useCallback(
    ({ item }: ListRenderItemInfo<City>) => {
      const isSelecting = selectingCityId === item.id

      return (
        <Pressable
          onPress={() => handleSelectCity(item)}
          disabled={selectingCityId !== null}
          bg="gray.100"
          borderRadius="md"
          p={3}
          mb={2}
          borderWidth={1}
          borderColor={isSelecting ? 'green.500' : 'gray.300'}
          opacity={selectingCityId !== null && !isSelecting ? 0.6 : 1}
        >
          <HStack alignItems="center" justifyContent="space-between">
            <Text
              flex={1}
              fontSize="md"
              color="gray.700"
              fontWeight="semibold"
              numberOfLines={1}
            >
              {item.name}
            </Text>

            {isSelecting ? (
              <Spinner size="sm" color="green.600" />
            ) : (
              <Text ml={3} fontSize="xs" color="gray.700">
                {item.uf ?? selectedState?.uf ?? ''}
              </Text>
            )}
          </HStack>
        </Pressable>
      )
    },
    [handleSelectCity, selectedState?.uf, selectingCityId],
  )

  useEffect(() => {
    void loadStates()
  }, [loadStates])

  return (
    <ImageBackground
      source={MapBackground}
      style={{ flex: 1 }}
      resizeMode="stretch"
    >
      <Box flex={1} bg="rgba(255,255,255,0.92)">
        <Box flex={1} px={6} pt={10}>
          <HStack alignItems="flex-start" ml={-4}>
            <IconButton
              accessibilityLabel="Voltar para o login"
              icon={
                <MaterialIcons
                  name="arrow-back"
                  size={sizes[6]}
                  color={colors.gray[700]}
                />
              }
              onPress={handleBackToLogin}
            />
          </HStack>

          <VStack flex={1} space={4} mt={4} ml={2}>
            <HStack alignItems="center" space={1}>
              <Icon
                as={MaterialIcons}
                name="location-on"
                size={sizes[6]}
                color={colors.orange[600]}
              />

              <Text fontSize="2xl" fontWeight="bold">
                Onde você está?
              </Text>
            </HStack>

            {loadingStates ? (
              <Box h={14} justifyContent="center">
                <Spinner size="sm" color="green.600" />
              </Box>
            ) : (
              <Box h={20}>
                <FlatList
                  data={states}
                  horizontal
                  renderItem={renderState}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    alignItems: 'center',
                    paddingRight: 16,
                  }}
                  initialNumToRender={6}
                  maxToRenderPerBatch={8}
                  windowSize={3}
                  ListEmptyComponent={
                    <Box h={14} justifyContent="center">
                      <Text color="gray.700">Nenhum estado encontrado.</Text>
                    </Box>
                  }
                />
              </Box>
            )}

            <Text fontSize="lg" fontWeight="bold">
              Selecione sua cidade
            </Text>

            {loadingCities ? (
              <Box flex={1} alignItems="center" pt={6}>
                <Spinner size="lg" color="green.600" />
              </Box>
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
                contentContainerStyle={{
                  paddingBottom: 32,
                  flexGrow: 1,
                }}
                ListEmptyComponent={
                  <Text mt={4} color="gray.700">
                    {selectedState
                      ? 'Nenhuma cidade encontrada.'
                      : 'Selecione um estado acima.'}
                  </Text>
                }
              />
            )}
          </VStack>
        </Box>
      </Box>
    </ImageBackground>
  )
}
