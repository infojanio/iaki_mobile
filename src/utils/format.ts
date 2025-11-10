export function formatCurrency(value: number) {
  return value
    ? value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
    : 'R$ 0,00'
}
