import React, { useContext, useEffect, useState } from 'react'
import { FlatList } from 'react-native'
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

import { ImageBackground } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import MapBackground from '@assets/selectCity.png'

import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '@routes/types'

import { CityContext } from '@contexts/CityContext'
import { stateService, State } from '@services/stateService'
import { cityService, City } from '@services/cityService'
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'

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
  const [loading, setLoading] = useState(false)
  const [selectingCity, setSelectingCity] = useState(false)

  const ctx = useContext(CityContext)
  console.log('CityContext no SelectCity:', ctx)

  async function loadStates() {
    try {
      const data = await stateService.listStates()
      setStates(data)
    } catch {
      setStates([])
    }
  }

  async function loadCities(state: State) {
    setSelectedState(state)
    setLoading(true)

    try {
      const data = await cityService.listCitiesByState(state.id)
      setCities(data)
    } catch {
      setCities([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectCity(city: City) {
    try {
      setSelectingCity(true)

      await setUserCity({
        id: city.id,
        name: city.name,
        uf: city.uf,
      })

      navigation.reset({
        index: 0,
        routes: [{ name: 'appRoutes' as never }],
      })
    } catch (error) {
      console.error('Erro ao selecionar cidade', error)
    } finally {
      setSelectingCity(false)
    }
  }

  async function handleBackToLogin() {
    await signOut()
  }

  useEffect(() => {
    loadStates()
  }, [])

  return (
    <ImageBackground
      source={MapBackground}
      style={{ flex: 1 }}
      resizeMode="stretch"
    >
      {/* OVERLAY */}
      <Box flex={1} bg="white" opacity={0.92}>
        <Box flex={1} px={6} pt={10}>
          {/* VOLTAR */}
          <HStack alignItems="flex-start" ml={-4}>
            <IconButton
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

          <VStack space={4} mt={4} ml={2}>
            <HStack>
              <Icon
                as={MaterialIcons}
                name="location-on"
                size={sizes[2]}
                color={colors.orange[600]}
              />
              <Text fontSize="2xl" fontWeight="bold">
                Onde você está?
              </Text>
            </HStack>

            {/* ESTADOS */}
            <FlatList
              data={states}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ marginVertical: 16 }}
              renderItem={({ item }) => {
                const active = selectedState?.id === item.id

                return (
                  <Pressable
                    onPress={() => loadCities(item)}
                    mr={2}
                    px={5}
                    py={2}
                    borderRadius="full"
                    bg={active ? 'green.600' : 'gray.200'}
                  >
                    <Text
                      color={active ? 'white' : 'gray.800'}
                      fontWeight="bold"
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                )
              }}
            />

            <Text fontSize="lg" fontWeight="bold">
              Selecione sua cidade
            </Text>

            {loading ? (
              <Spinner size="lg" mt={6} />
            ) : (
              <FlatList
                data={cities}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => !selectingCity && handleSelectCity(item)}
                    disabled={selectingCity}
                    bg="gray.100"
                    borderRadius="md"
                    p={2}
                    mb={2}
                    borderWidth={1}
                    borderColor="gray.300"
                  >
                    <HStack justifyContent={'space-between'}>
                      <Box>
                        <Text
                          fontSize="md"
                          color="gray.700"
                          fontWeight="semibold"
                        >
                          {item.name}
                        </Text>
                      </Box>
                      <Box justifyContent={'right'}>
                        <Text fontSize="xs" color="gray.700">
                          {selectedState?.uf}
                        </Text>
                      </Box>
                    </HStack>
                  </Pressable>
                )}
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
