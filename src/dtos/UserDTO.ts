export type CityDTO = {
  id: string
  name: string
  uf: string
}

export type UserDTO = {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  cpf?: string
  role: 'ADMIN' | 'USER' // <- Adiciona isso
  street?: string
  state?: string
  postalCode?: string
  city?: CityDTO | null
}
