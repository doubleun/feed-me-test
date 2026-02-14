import type { Order } from '@/types'
import { OrderCard } from './OrderCard'

interface CompletedOrdersProps {
  orders: Order[]
}

export const CompletedOrders = ({ orders }: CompletedOrdersProps) => {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-800">Completed Orders</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {orders.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No completed orders yet
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  )
}
