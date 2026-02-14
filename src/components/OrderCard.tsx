import type { Order } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface OrderCardProps {
  order: Order
}

export const OrderCard = ({ order }: OrderCardProps) => {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-700">
              #{order.id}
            </span>
            <Badge variant={order.type === 'VIP' ? 'default' : 'secondary'}>
              {order.type}
            </Badge>
          </div>
          <Badge
            variant={
              order.status === 'COMPLETE'
                ? 'default'
                : order.status === 'PROCESSING'
                  ? 'outline'
                  : 'secondary'
            }
          >
            {order.status}
          </Badge>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Created: {order.createdAt.toLocaleTimeString()}
          {order.completedAt && (
            <> • Completed: {order.completedAt.toLocaleTimeString()}</>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
