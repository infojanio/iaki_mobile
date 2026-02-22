import { api } from './api'

export async function redeemReward(rewardId: string) {
  const response = await api.post(`/rewards/${rewardId}/redeem`)
  return response.data
}
