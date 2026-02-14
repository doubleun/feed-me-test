import { Button } from '@/components/ui/button'

interface BotControlsProps {
  botCount: number
  onAddBot: () => void
  onRemoveBot: () => void
}

export const BotControls = ({
  botCount,
  onAddBot,
  onRemoveBot,
}: BotControlsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="text-lg font-semibold">
        Bots: <span className="text-2xl text-blue-600">{botCount}</span>
      </span>
      <div className="flex gap-2">
        <Button onClick={onAddBot} size="lg">
          Add Bot
        </Button>
        <Button
          onClick={onRemoveBot}
          variant="destructive"
          size="lg"
          disabled={botCount === 0}
        >
          Remove Bot
        </Button>
      </div>
    </div>
  )
}
