import { useState, useCallback, useRef, useEffect } from 'react'
import type { Order, Bot, OrderStatus } from '@/types'

const PROCESSING_TIME = 10000 // 10 seconds

export const useOrderSystem = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [bots, setBots] = useState<Bot[]>([])
  const orderIdCounter = useRef(1)
  const botIdCounter = useRef(1)

  // Insert order with priority: VIP orders before NORMAL orders
  const insertOrder = useCallback(
    (orders: Order[], newOrder: Order): Order[] => {
      if (newOrder.type === 'VIP') {
        // Find the last VIP order in PENDING status
        const lastVipIndex = orders.reduce((lastIdx, order, idx) => {
          if (order.type === 'VIP' && order.status === 'PENDING') {
            return idx
          }
          return lastIdx
        }, -1)

        // Insert after the last VIP order
        return [
          ...orders.slice(0, lastVipIndex + 1),
          newOrder,
          ...orders.slice(lastVipIndex + 1),
        ]
      }
      // Normal orders go to the end
      return [...orders, newOrder]
    },
    [],
  )

  // Pick the first pending order for a bot
  const pickNextOrder = useCallback((bot: Bot) => {
    setOrders((prevOrders) => {
      const pendingOrder = prevOrders.find(
        (order) => order.status === 'PENDING',
      )

      if (!pendingOrder) {
        // No pending orders, set bot to idle
        setBots((prevBots) =>
          prevBots.map((b) =>
            b.id === bot.id ? { ...b, status: 'IDLE', currentOrder: null } : b,
          ),
        )
        return prevOrders
      }

      // Start processing the order
      pendingOrder.status = 'PROCESSING'

      setBots((prevBots) =>
        prevBots.map((b) =>
          b.id === bot.id
            ? {
                ...b,
                status: 'PROCESSING',
                currentOrder: pendingOrder,
                processingTimer: setTimeout(() => {
                  // Complete the order after 10 seconds
                  setOrders((prevOrders) =>
                    prevOrders.map((order) =>
                      order.id === pendingOrder.id
                        ? {
                            ...order,
                            status: 'COMPLETE' as OrderStatus,
                            completedAt: new Date(),
                          }
                        : order,
                    ),
                  )

                  // Pick next order
                  pickNextOrder(b)
                }, PROCESSING_TIME),
              }
            : b,
        ),
      )

      return [...prevOrders]
    })
  }, [])

  // Add a new order
  const addOrder = useCallback(
    (type: 'NORMAL' | 'VIP') => {
      const newOrder: Order = {
        id: orderIdCounter.current++,
        type,
        status: 'PENDING',
        createdAt: new Date(),
      }

      setOrders((prevOrders) => insertOrder(prevOrders, newOrder))

      // Check if any bot is idle and can pick up the order
      setBots((prevBots) => {
        const idleBot = prevBots.find((bot) => bot.status === 'IDLE')
        if (idleBot) {
          // Trigger bot to pick up order in next tick
          setTimeout(() => pickNextOrder(idleBot), 0)
        }
        return prevBots
      })
    },
    [insertOrder, pickNextOrder],
  )

  // Add a new bot
  const addBot = useCallback(() => {
    const newBot: Bot = {
      id: botIdCounter.current++,
      status: 'IDLE',
      currentOrder: null,
    }

    setBots((prevBots) => [...prevBots, newBot])

    // Check if there are pending orders
    const hasPendingOrders = orders.some((order) => order.status === 'PENDING')
    if (hasPendingOrders) {
      setTimeout(() => pickNextOrder(newBot), 0)
    }
  }, [orders, pickNextOrder])

  // Remove the newest bot
  const removeBot = useCallback(() => {
    setBots((prevBots) => {
      if (prevBots.length === 0) return prevBots

      const botToRemove = prevBots[prevBots.length - 1]

      // Clear timer if bot is processing
      if (botToRemove.processingTimer) {
        clearTimeout(botToRemove.processingTimer)
      }

      // If bot was processing an order, return it to PENDING
      if (botToRemove.currentOrder) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === botToRemove.currentOrder!.id
              ? { ...order, status: 'PENDING' as OrderStatus }
              : order,
          ),
        )
      }

      return prevBots.slice(0, -1)
    })
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      bots.forEach((bot) => {
        if (bot.processingTimer) {
          clearTimeout(bot.processingTimer)
        }
      })
    }
  }, [bots])

  const pendingOrders = orders.filter((order) => order.status === 'PENDING')
  const processingOrders = orders.filter(
    (order) => order.status === 'PROCESSING',
  )
  const completedOrders = orders.filter((order) => order.status === 'COMPLETE')

  return {
    orders,
    bots,
    pendingOrders,
    processingOrders,
    completedOrders,
    addOrder,
    addBot,
    removeBot,
  }
}
