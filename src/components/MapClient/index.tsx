import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native'
import MapView, { Callout, LatLng, Marker, Region } from 'react-native-maps'
import * as Location from 'expo-location'

import { api } from '@services/api'

import { MapGoogleType } from '@components/MapGoogleType'
import { MapCard } from '@components/MapCard'
import { NewMarker } from '@components/NewMarker'
import { ButtonBack } from '@components/ButtonBack'
import { MapTypeCard } from '@components/MapTypeCard'
import { LocationActual } from '@components/LocationActual'
import { InfoAdd } from '@components/InfoAdd'
import database from '@components/NewMarker/database'

import PhotoPng from '@assets/UserLocal.png'
import { useAuth } from '@hooks/useAuth'
import { AppNavigatorRoutesProps } from '@routes/app.routes'
import { useNavigation } from '@react-navigation/native'

const { width, height } = Dimensions.get('screen')

export function MapClient() {
  const { userId } = useAuth()
  const navigation = useNavigation<AppNavigatorRoutesProps>()

  const [showMarkerSetter, setShowMarkerSetter] = useState(false)
  const [showAddress, setShowAddress] = useState(false)
  const [markerCoordinates, setMarkerCoordinates] = useState<LatLng>({
    latitude: 0,
    longitude: 0,
  })
  const [cardHeight, setCardHeight] = useState(0)
  const [showCard, setShowCard] = useState<'back' | 'mapType'>('back')
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'terrain'>(
    'standard',
  )

  const markers = database.markers
  const mapRef = useRef<MapView>(null)

  function handleOpenHome(userId: string) {
    navigation.navigate('home', { userId })
  }

  const getMyLocation = async (): Promise<Region | undefined> => {
    let { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return

    const { latitude, longitude } = (
      await Location.getCurrentPositionAsync({})
    ).coords
    const region = {
      latitude,
      longitude,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    }
    return region
  }

  const goToMyLocation = async () => {
    const region = await getMyLocation()
    region && mapRef.current?.animateToRegion(region, 1000)
    return region
  }

  const handleNewMarker = async () => {
    if (!showMarkerSetter) {
      const camera = await mapRef.current?.getCamera()
      camera?.center && setMarkerCoordinates(camera?.center)
    }
    setShowMarkerSetter((v) => !v)
    setShowAddress((v) => !v)
  }

  const saveUserLocation = async () => {
    if (!userId) {
      Alert.alert('Erro', 'Usuário não identificado.')
      return
    }

    try {
      await api.post('/users/location', {
        userId,
        latitude: markerCoordinates.latitude,
        longitude: markerCoordinates.longitude,
      })
      Alert.alert('Sucesso', 'Localização salva com sucesso!')

      handleOpenHome(userId) //navega para home
    } catch (error) {
      console.log('Erro:', error)
      Alert.alert('Erro', 'Não foi possível salvar a localização.')
      console.error(error)
    }
  }

  const handleLayoutChange = (event: any) => {
    const { height } = event.nativeEvent.layout
    setCardHeight(height)
  }

  return (
    <View>
      <MapView
        style={styles.map}
        ref={mapRef}
        onMapReady={goToMyLocation}
        loadingEnabled
        showsUserLocation
        showsMyLocationButton={false}
        mapType={mapType}
        zoomEnabled={true}
        minZoomLevel={5}
      >
        {showMarkerSetter && (
          <Marker
            draggable
            coordinate={markerCoordinates}
            onDragEnd={(e) => setMarkerCoordinates(e.nativeEvent.coordinate)}
            calloutAnchor={{ x: 0.5, y: 1.5 }} // move o balão mais pra cima
          >
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutText}>Pressione e Arraste</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinates}
            pinColor={marker.color}
            image={PhotoPng}
          >
            <Callout>
              <Text>Minha Localização</Text>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {showMarkerSetter && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={saveUserLocation}
        >
          <Text style={styles.confirmButtonText}>Confirmar Localização</Text>
        </TouchableOpacity>
      )}

      <LocationActual mBottom={cardHeight} onPress={goToMyLocation} />

      <MapGoogleType
        mBottom={cardHeight}
        onPress={() => setShowCard('mapType')}
      />

      <NewMarker
        mBottom={cardHeight}
        showMarkerSetter={showMarkerSetter}
        onPress={handleNewMarker}
      />

      {showCard === 'back' ? (
        <ButtonBack handleLayoutChange={handleLayoutChange} />
      ) : (
        <MapTypeCard
          handleLayoutChange={handleLayoutChange}
          closeModal={() => setShowCard('back')}
          changeMapType={(type) => setMapType(type)}
        />
      )}

      {!showAddress ? (
        <InfoAdd handleLayoutChange={handleLayoutChange} />
      ) : (
        <MapCard handleLayoutChange={handleLayoutChange} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  map: {
    width,
    height,
  },
  confirmButton: {
    position: 'absolute',
    bottom: 80,
    left: 80,
    right: 80,
    backgroundColor: '#047857', // green.700
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  calloutContainer: {
    backgroundColor: 'white',
    paddingVertical: 1,
    marginBottom: -4,
    paddingHorizontal: 12,
    borderRadius: 6,
    elevation: 4,
  },
  calloutText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },

  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
