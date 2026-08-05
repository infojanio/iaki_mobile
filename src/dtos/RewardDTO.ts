export type RewardStoreDTO = {
  id: string
  name: string
  avatar?: string | null
}

export type RewardDTO = {
  id: string
  storeId: string

  title: string
  description: string | null

  pointsCost: number
  stock: number

  isActive: boolean
  image: string | null

  expiresAt: string | null
  maxPerUser: number | null

  createdAt: string

  store?: RewardStoreDTO | null
}
