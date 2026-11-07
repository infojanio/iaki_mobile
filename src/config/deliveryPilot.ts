export type DeliveryPilotStore = {
  storeId: string
  storeName: string

  // WhatsApp confirmado pela loja: DDI + DDD + número.
  // Exemplo: 5562999999999
  whatsapp: string

  // Somente formas confirmadas pela loja para entrega.
  paymentMethods: string[]
}

export const DELIVERY_PILOT_STORES: DeliveryPilotStore[] = [
  /*
  {
    storeId: 'UUID_REAL_DA_LOJA',
    storeName: 'Nome da distribuidora',
    whatsapp: '5562999999999',
    paymentMethods: [
      'Pix na entrega',
      'Dinheiro na entrega',
      'Cartão na entrega',
    ],
  },
  */
]
