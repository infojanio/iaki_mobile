import AsyncStorage from '@react-native-async-storage/async-storage'

import { UserDTO } from '@dtos/UserDTO'
import { USER_STORAGE } from '@storage/storageConfig'

//salva os dados no dispositivo
export async function storageUserSave(user: UserDTO) {
  await AsyncStorage.setItem(USER_STORAGE, JSON.stringify(user))
}

//retorna os dados do usuário
export async function storageUserGet() {
  const storage = await AsyncStorage.getItem(USER_STORAGE)

  const user: UserDTO = storage ? JSON.parse(storage) : {}
  return user
}

//remove dados do usuário do storage
export async function storageUserRemove() {
  await AsyncStorage.removeItem(USER_STORAGE)
}
