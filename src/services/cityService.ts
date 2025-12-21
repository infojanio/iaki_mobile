import { api } from './api'

export type City = {
  id: string
  name: string
  uf: string
  stateId: string
}

async function listCitiesByState(stateId: string): Promise<City[]> {
  const { data } = await api.get(`/states/${stateId}/cities`)
  return data
}

export const cityService = {
  listCitiesByState,
}
