// @dtos/CategoryDTO.ts

export type CategoryDTO = {
  id: string
  name: string
  description?: string
  image?: string
  status: boolean

  // Adicionando subcategorias para funcionar com seu filtro
  subcategories: SubCategoryDTO[]
}

export type SubCategoryDTO = {
  id: string
  name: string
  categoryId: string // Mantendo compatibilidade com seu backend
  status: boolean
}

// Tipo para resposta da API de categorias
export interface CategoriesResponseDTO {
  data: CategoryDTO[]
}
