// src/services/userService.ts
import { api } from '@services/api'

export type CashbackBalanceResponse = {
  balance: number
  totalReceived: number
  totalUsed: number
}

async function getUserCashbackBalance(): Promise<CashbackBalanceResponse> {
  try {
    const response = await api.get('/users/balance')

    const { balance, totalReceived, totalUsed } = response.data
    console.log('saldo:', response.data)
    console.log(
      'saldo:',
      balance,
      'total recebido:',
      totalReceived,
      'total usado:',
      totalUsed,
    )
    return {
      balance: balance || 0,
      totalReceived: totalReceived || 0,
      totalUsed: totalUsed || 0,
    }
  } catch (error) {
    console.error('Erro ao buscar saldo de cashback:', error)
    throw error
  }
}

export async function getUserCashbackStatement() {
  const response = await api.get('/cashbacks/transactions')
  // console.log('extrato:', response.data.transactions)
  return response.data.transactions // ou ajuste conforme sua resposta
}

export const userService = {
  getUserCashbackBalance,
  getUserCashbackStatement,
}
