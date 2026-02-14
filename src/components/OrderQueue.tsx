import type { Order } from '@/types'
import { OrderCard } from './OrderCard'

interface OrderQueueProps {
  orders: Order[]
  title: string
}

export const OrderQueue = ({ orders, title }: OrderQueueProps) => {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="space-y-2 max-h-200 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No orders</div>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  )
}
