// @dtos/CategoryDTO.ts

export type BusinessCategoryDTO = {
  id: string
  name: string
  image?: string
  cityId: string

  // Adicionando subcategorias para funcionar com seu filtro
  stores: StoreDTO[]
}

export type StoreDTO = {
  id: string
  name: string
  slug: string
  cityId: string // Mantendo compatibilidade com seu backend
}

// Tipo para resposta da API de categorias
export interface BusinessCategoriesResponseDTO {
  data: BusinessCategoryDTO[]
}
