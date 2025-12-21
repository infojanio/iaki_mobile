import AsyncStorage from '@react-native-async-storage/async-storage'

const CITY_STORAGE_KEY = '@iaki:city'

export type StoredCity = {
  id: string
  name: string
  uf: string
}

export async function storageCitySave(city: StoredCity) {
  await AsyncStorage.setItem(CITY_STORAGE_KEY, JSON.stringify(city))
}

export async function storageCityGet(): Promise<StoredCity | null> {
  const data = await AsyncStorage.getItem(CITY_STORAGE_KEY)
  return data ? JSON.parse(data) : null
}

export async function storageCityRemove() {
  await AsyncStorage.removeItem(CITY_STORAGE_KEY)
}
