export type SubCategoryDTO = {
  id: string
  name: string
  image: string
  category_id: string

  Category?: {
    id: string
    name: string
    // outras propriedades da Category, se houver
  }
}
