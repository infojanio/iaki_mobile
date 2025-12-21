import { api } from './api'

export type State = {
  id: string
  name: string
  uf: string
}

async function listStates(): Promise<State[]> {
  const { data } = await api.get('/states')
  return data
}

export const stateService = {
  listStates,
}
