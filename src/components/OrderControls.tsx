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
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-lg font-semibold">Order:</span>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onAddNormalOrder} variant="outline" size="lg">
          New Normal Order
        </Button>
        <Button onClick={onAddVipOrder} size="lg">
          New VIP Order
        </Button>
      </div>
    </div>
  )
}
