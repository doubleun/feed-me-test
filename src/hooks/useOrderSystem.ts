import { useReducer, useRef, useEffect, useMemo, useCallback } from 'react'
import type { Order, Bot, OrderStatus, BotStatus } from '@/types'

const PROCESSING_TIME = 10000 // 10 seconds

// ============================================================================
// STATE & ACTION TYPES
// ============================================================================

interface OrderSystemState {
  orders: Order[]
  bots: Bot[]
  orderIdCounter: number
  botIdCounter: number
}

type OrderSystemAction =
  | { type: 'ADD_ORDER'; payload: { orderType: 'NORMAL' | 'VIP' } }
  | { type: 'ADD_BOT' }
  | { type: 'REMOVE_BOT' }
  | { type: 'START_PROCESSING'; payload: { botId: number; orderId: number } }
  | { type: 'COMPLETE_ORDER'; payload: { orderId: number; botId: number } }
  | { type: 'RETURN_TO_PENDING'; payload: { orderId: number } }

// ============================================================================
// PURE HELPER FUNCTIONS
// ============================================================================

/**
 * Insert order maintaining VIP priority.
 * VIP orders are inserted after the last VIP PENDING or PROCESSING order.
 * NORMAL orders are appended to the end.
 */
function insertOrderByPriority(orders: Order[], newOrder: Order): Order[] {
  if (newOrder.type === 'VIP') {
    // Find the last VIP order in PENDING or PROCESSING status
    const lastVipIndex = orders.reduce((lastIdx, order, idx) => {
      if (
        order.type === 'VIP' &&
        (order.status === 'PENDING' || order.status === 'PROCESSING')
      ) {
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
}

/**
 * Find the first pending order (prioritizes VIP, then NORMAL).
 */
function findNextPendingOrder(orders: Order[]): Order | undefined {
  return orders.find((order) => order.status === 'PENDING')
}

/**
 * Find the first idle bot.
 */
function findIdleBot(bots: Bot[]): Bot | undefined {
  return bots.find((bot) => bot.status === 'IDLE')
}

/**
 * Auto-assign orders to idle bots.
 * This is the core orchestration logic that runs after state changes.
 * Returns new state with assignments made (if any).
 */
function autoAssignOrders(state: OrderSystemState): OrderSystemState {
  let currentState = state
  let madeAssignment = true

  // Keep assigning while there are idle bots and pending orders
  while (madeAssignment) {
    const idleBot = findIdleBot(currentState.bots)
    const pendingOrder = findNextPendingOrder(currentState.orders)

    if (!idleBot || !pendingOrder) {
      madeAssignment = false
      break
    }

    // Create assignment by updating both order and bot
    const updatedOrders = currentState.orders.map((order) =>
      order.id === pendingOrder.id
        ? { ...order, status: 'PROCESSING' as OrderStatus }
        : order,
    )

    const updatedBots = currentState.bots.map((bot) =>
      bot.id === idleBot.id
        ? {
            ...bot,
            status: 'PROCESSING' as BotStatus,
            currentOrder: {
              ...pendingOrder,
              status: 'PROCESSING' as OrderStatus,
            },
          }
        : bot,
    )

    currentState = {
      ...currentState,
      orders: updatedOrders,
      bots: updatedBots,
    }
  }

  return currentState
}

// ============================================================================
// REDUCER
// ============================================================================

function orderSystemReducer(
  state: OrderSystemState,
  action: OrderSystemAction,
): OrderSystemState {
  switch (action.type) {
    case 'ADD_ORDER': {
      const newOrder: Order = {
        id: state.orderIdCounter,
        type: action.payload.orderType,
        status: 'PENDING',
        createdAt: new Date(),
      }

      const ordersWithNew = insertOrderByPriority(state.orders, newOrder)

      const stateWithOrder = {
        ...state,
        orders: ordersWithNew,
        orderIdCounter: state.orderIdCounter + 1,
      }

      // Auto-assign if possible
      return autoAssignOrders(stateWithOrder)
    }

    case 'ADD_BOT': {
      const newBot: Bot = {
        id: state.botIdCounter,
        status: 'IDLE',
        currentOrder: null,
      }

      const stateWithBot = {
        ...state,
        bots: [...state.bots, newBot],
        botIdCounter: state.botIdCounter + 1,
      }

      // Auto-assign if possible
      return autoAssignOrders(stateWithBot)
    }

    case 'REMOVE_BOT': {
      if (state.bots.length === 0) return state

      const botToRemove = state.bots[state.bots.length - 1]

      // If bot was processing an order, return it to PENDING
      let updatedOrders = state.orders
      if (botToRemove.currentOrder) {
        updatedOrders = state.orders.map((order) =>
          order.id === botToRemove.currentOrder!.id
            ? { ...order, status: 'PENDING' as OrderStatus }
            : order,
        )
      }

      return {
        ...state,
        orders: updatedOrders,
        bots: state.bots.slice(0, -1),
      }
    }

    case 'START_PROCESSING': {
      // This action is not currently used as assignment happens in autoAssignOrders
      // But keeping it for potential manual assignment scenarios
      const { botId, orderId } = action.payload

      const order = state.orders.find((o) => o.id === orderId)
      if (!order) return state

      const updatedOrders = state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'PROCESSING' as OrderStatus } : o,
      )

      const updatedBots = state.bots.map((bot) =>
        bot.id === botId
          ? {
              ...bot,
              status: 'PROCESSING' as BotStatus,
              currentOrder: { ...order, status: 'PROCESSING' as OrderStatus },
            }
          : bot,
      )

      return {
        ...state,
        orders: updatedOrders,
        bots: updatedBots,
      }
    }

    case 'COMPLETE_ORDER': {
      const { orderId, botId } = action.payload

      // Mark order as complete
      const updatedOrders = state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: 'COMPLETE' as OrderStatus,
              completedAt: new Date(),
            }
          : order,
      )

      // Set bot to idle
      const updatedBots = state.bots.map((bot) =>
        bot.id === botId
          ? { ...bot, status: 'IDLE' as BotStatus, currentOrder: null }
          : bot,
      )

      const stateWithCompletion = {
        ...state,
        orders: updatedOrders,
        bots: updatedBots,
      }

      // Auto-assign next order if available
      return autoAssignOrders(stateWithCompletion)
    }

    case 'RETURN_TO_PENDING': {
      const { orderId } = action.payload

      const updatedOrders = state.orders.map((order) =>
        order.id === orderId
          ? { ...order, status: 'PENDING' as OrderStatus }
          : order,
      )

      return {
        ...state,
        orders: updatedOrders,
      }
    }

    default:
      return state
  }
}

// ============================================================================
// HOOK
// ============================================================================

const initialState: OrderSystemState = {
  orders: [],
  bots: [],
  orderIdCounter: 1,
  botIdCounter: 1,
}

export const useOrderSystem = () => {
  // State management with reducer
  const [state, dispatch] = useReducer(orderSystemReducer, initialState)

  // Timer management (side effects stored in ref, not state)
  const timerMapRef = useRef<Map<number, number>>(new Map())

  /**
   * Clear a processing timer for a specific bot.
   */
  const clearProcessingTimer = useCallback((botId: number) => {
    const timer = timerMapRef.current.get(botId)
    if (timer) {
      clearTimeout(timer)
      timerMapRef.current.delete(botId)
    }
  }, [])

  /**
   * Start a processing timer for a bot.
   * After PROCESSING_TIME, dispatches COMPLETE_ORDER action.
   */
  const startProcessingTimer = useCallback(
    (botId: number, orderId: number) => {
      // Clear any existing timer for this bot
      clearProcessingTimer(botId)

      // Create new timer
      const timer = setTimeout(() => {
        // Clear timer BEFORE dispatching to avoid race condition
        // We delete directly instead of calling clearProcessingTimer to avoid
        // circular dependency issues in the callback
        timerMapRef.current.delete(botId)

        dispatch({
          type: 'COMPLETE_ORDER',
          payload: { orderId, botId },
        })
      }, PROCESSING_TIME)

      // Store in ref
      timerMapRef.current.set(botId, timer)
    },
    [clearProcessingTimer],
  )

  /**
   * Sync timers with bot state.
   * If a bot is processing but has no timer, start one.
   * If a bot is idle but has a timer, clear it.
   */
  useEffect(() => {
    state.bots.forEach((bot) => {
      const hasTimer = timerMapRef.current.has(bot.id)

      if (bot.status === 'PROCESSING' && bot.currentOrder) {
        // Bot is processing but no timer exists - start one
        if (!hasTimer) {
          startProcessingTimer(bot.id, bot.currentOrder.id)
        }
      } else {
        // Bot is idle but timer exists - clear it
        if (hasTimer) {
          clearProcessingTimer(bot.id)
        }
      }
    })
  }, [state.bots, startProcessingTimer, clearProcessingTimer])

  /**
   * Cleanup all timers on unmount.
   */
  useEffect(() => {
    const timers = timerMapRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  // ============================================================================
  // ACTION CREATORS
  // ============================================================================

  const addOrder = useCallback((type: 'NORMAL' | 'VIP') => {
    dispatch({ type: 'ADD_ORDER', payload: { orderType: type } })
  }, [])

  const addBot = useCallback(() => {
    dispatch({ type: 'ADD_BOT' })
  }, [])

  const removeBot = useCallback(() => {
    const botToRemove = state.bots[state.bots.length - 1]
    if (botToRemove) {
      clearProcessingTimer(botToRemove.id)
    }
    dispatch({ type: 'REMOVE_BOT' })
  }, [state.bots, clearProcessingTimer])

  // ============================================================================
  // COMPUTED VALUES (MEMOIZED SELECTORS)
  // ============================================================================

  const pendingOrders = useMemo(
    () => state.orders.filter((order) => order.status === 'PENDING'),
    [state.orders],
  )

  const processingOrders = useMemo(
    () => state.orders.filter((order) => order.status === 'PROCESSING'),
    [state.orders],
  )

  const completedOrders = useMemo(
    () => state.orders.filter((order) => order.status === 'COMPLETE'),
    [state.orders],
  )

  return {
    orders: state.orders,
    bots: state.bots,
    pendingOrders,
    processingOrders,
    completedOrders,
    addOrder,
    addBot,
    removeBot,
  }
}
