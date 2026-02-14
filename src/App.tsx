import { useOrderSystem } from '@/hooks/useOrderSystem'
import { OrderQueue } from '@/components/OrderQueue'
import { CompletedOrders } from '@/components/CompletedOrders'
import { BotControls } from '@/components/BotControls'
import { OrderControls } from '@/components/OrderControls'
import { BotStatus } from '@/components/BotStatus'
import { Separator } from '@/components/ui/separator'
import './App.css'

function App() {
  const {
    bots,
    pendingOrders,
    processingOrders,
    completedOrders,
    addOrder,
    addBot,
    removeBot,
  } = useOrderSystem()

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-yellow-50 p-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            🍔 McDonald's Order Management
          </h1>
          <p className="text-gray-600">
            Automated order processing with cooking bots
          </p>
        </div>

        <Separator />

        {/* Controls */}
        <div className="flex flex-wrap gap-6 justify-center items-center bg-white p-6 rounded-lg shadow-md">
          <OrderControls
            onAddNormalOrder={() => addOrder('NORMAL')}
            onAddVipOrder={() => addOrder('VIP')}
          />
          <Separator orientation="vertical" className="h-12" />
          <BotControls
            botCount={bots.length}
            onAddBot={addBot}
            onRemoveBot={removeBot}
          />
        </div>

        {/* Bot Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Bot Status
          </h2>
          <BotStatus bots={bots} />
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <OrderQueue orders={pendingOrders} title="⏳ Pending" />
          </div>

          {/* Processing Orders */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <OrderQueue orders={processingOrders} title="🍳 Processing" />
          </div>

          {/* Completed Orders */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <CompletedOrders orders={completedOrders} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
