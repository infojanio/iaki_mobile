export interface StoreDTO {
  id: string
  name: string
  slug?: string | null
  phone?: string | null
  isActive: boolean

  latitude: number
  longitude: number

  cnpj?: string | null
  avatar?: string | null
  street?: string | null
  postalCode?: string | null

  cityId: string
}
