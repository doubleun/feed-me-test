import { Button } from '@/components/ui/button'

interface OrderControlsProps {
  onAddNormalOrder: () => void
  onAddVipOrder: () => void
}

export const OrderControls = ({
  onAddNormalOrder,
  onAddVipOrder,
}: OrderControlsProps) => {
  return (
    <div className="flex items-center gap-4">
      <span className="text-lg font-semibold">New Order:</span>
      <div className="flex gap-2">
        <Button onClick={onAddNormalOrder} variant="outline" size="lg">
          Normal Order
        </Button>
        <Button onClick={onAddVipOrder} size="lg">
          VIP Order
        </Button>
      </div>
    </div>
  )
}
