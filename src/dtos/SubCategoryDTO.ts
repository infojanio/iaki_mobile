export type SubCategoryDTO = {
  id: string
  name: string
  image: string
  categoryId: string

  Category?: {
    id: string
    name: string
    // outras propriedades da Category, se houver
  }
}
