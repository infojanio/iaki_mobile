// storeService.ts
import { api } from '@services/api'
import { StoreDTO } from '@dtos/StoreDTO'

export async function getStoresByBusinessCategory(categoryId: string) {
  const response = await api.get<StoreDTO[]>(`/stores/business/${categoryId}`)
  //const response = await api.get<StoreDTO[]>('/stores')
  return response.data
}
