import { BusinessCategoryDTO } from './BusinessCategoryDTO'
import { CategoryDTO } from './CategoryDTO'
import { CityDTO } from './UserDTO'

export interface StoreDTO {
  id: string
  name: string
  slug?: string | null
  phone?: string | null
  isActive?: boolean

  rating?: number
  ratingCount?: number
  latitude?: number
  longitude?: number

  cnpj?: string | null
  avatar?: string
  street?: string | null
  postalCode?: string | null

  cityId: string
  city?: CityDTO
  category?: BusinessCategoryDTO
  categories?: CategoryDTO[]
}
