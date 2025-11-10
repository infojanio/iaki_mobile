import * as Location from 'expo-location'
import { useState } from 'react'
import { LatLng, Region } from 'react-native-maps'

//Pede ao usuário permissão pra mostrar a localização atual
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
  //return region
  console.log(region)
}
