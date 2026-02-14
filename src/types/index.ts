export type OrderType = 'NORMAL' | 'VIP'
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETE'
export type BotStatus = 'IDLE' | 'PROCESSING'

export interface Order {
  id: number
  type: OrderType
  status: OrderStatus
  createdAt: Date
  completedAt?: Date
}

export interface Bot {
  id: number
  status: BotStatus
  currentOrder: Order | null
  processingTimer?: NodeJS.Timeout
}
