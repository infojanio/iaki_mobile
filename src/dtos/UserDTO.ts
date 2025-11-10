export type UserDTO = {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  cpf?: string
  role: 'ADMIN' | 'USER' // <- Adiciona isso
  street?: string
  city?: string
  state?: string
  postalCode?: string
}
