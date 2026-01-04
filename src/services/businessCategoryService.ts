import { api } from '@services/api'

export type BusinessCategory = {
  id: string
  name: string
  image?: string
}

export async function listBusinessCategoriesByCity(cityId: string) {
  const response = await api.get(`/business-categories/city/${cityId}`)

  return response.data.categories as BusinessCategory[]
}
