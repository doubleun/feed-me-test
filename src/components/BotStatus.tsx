import type { Bot } from '@/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface BotStatusProps {
  bots: Bot[]
}

export const BotStatus = ({ bots }: BotStatusProps) => {
  if (bots.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No bots available. Add bots to start processing orders!
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-2">
      {bots.map((bot) => (
        <Alert key={bot.id}>
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-semibold">Bot #{bot.id}</span>
              <Badge variant={bot.status === 'IDLE' ? 'secondary' : 'default'}>
                {bot.status}
              </Badge>
            </div>
            {bot.currentOrder && (
              <span className="text-sm text-gray-600">
                Processing Order #{bot.currentOrder.id}
              </span>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
