export type ExchangeRate = {
  code: string
  rate: number
  name?: string
  date?: string
}

export type ExchangeRateSnapshot = {
  base: string
  rates: ExchangeRate[]
  status: 'idle' | 'fetching' | 'done'
  date: string
}