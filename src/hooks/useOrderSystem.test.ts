import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOrderSystem } from './useOrderSystem'

describe('useOrderSystem', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useOrderSystem())

      expect(result.current.orders).toEqual([])
      expect(result.current.bots).toEqual([])
      expect(result.current.pendingOrders).toEqual([])
      expect(result.current.processingOrders).toEqual([])
      expect(result.current.completedOrders).toEqual([])
    })
  })

  describe('Adding Orders', () => {
    it('should add a NORMAL order', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
      })

      expect(result.current.orders).toHaveLength(1)
      expect(result.current.orders[0]).toMatchObject({
        id: 1,
        type: 'NORMAL',
        status: 'PENDING',
      })
      expect(result.current.pendingOrders).toHaveLength(1)
    })

    it('should add a VIP order', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('VIP')
      })

      expect(result.current.orders).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(1)
      expect(result.current.orders[0]).toMatchObject({
        id: 1,
        type: 'VIP',
        status: 'PENDING',
      })
    })

    it('should increment order IDs', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
        result.current.addOrder('NORMAL')
        result.current.addOrder('NORMAL')
      })

      expect(result.current.orders).toHaveLength(3)
      expect(result.current.pendingOrders).toHaveLength(3)
      expect(result.current.orders[0].id).toBe(1)
      expect(result.current.orders[1].id).toBe(2)
      expect(result.current.orders[2].id).toBe(3)
    })

    it('should prioritize VIP orders before NORMAL orders', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL') // Order 1
        result.current.addOrder('NORMAL') // Order 2
        result.current.addOrder('VIP') // Order 3 - should be inserted before NORMAL orders
      })

      expect(result.current.orders).toHaveLength(3)
      expect(result.current.pendingOrders).toHaveLength(3)
      expect(result.current.pendingOrders[0].type).toBe('VIP')
      expect(result.current.pendingOrders[0].id).toBe(3)
      expect(result.current.pendingOrders[1].type).toBe('NORMAL')
      expect(result.current.pendingOrders[1].id).toBe(1)
      expect(result.current.pendingOrders[2].type).toBe('NORMAL')
      expect(result.current.pendingOrders[2].id).toBe(2)
    })

    it('should maintain VIP order insertion order', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('VIP') // Order 1
        result.current.addOrder('VIP') // Order 2
        result.current.addOrder('NORMAL') // Order 3
        result.current.addOrder('VIP') // Order 4
      })

      const pendingOrders = result.current.pendingOrders
      expect(pendingOrders[0]).toMatchObject({ id: 1, type: 'VIP' })
      expect(pendingOrders[1]).toMatchObject({ id: 2, type: 'VIP' })
      expect(pendingOrders[2]).toMatchObject({ id: 4, type: 'VIP' })
      expect(pendingOrders[3]).toMatchObject({ id: 3, type: 'NORMAL' })
    })
  })

  describe('Adding Bots', () => {
    it('should add a bot', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addBot()
      })

      expect(result.current.bots).toHaveLength(1)
      expect(result.current.bots[0]).toMatchObject({
        id: 1,
        status: 'IDLE',
        currentOrder: null,
      })
    })

    it('should increment bot IDs', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addBot()
        result.current.addBot()
        result.current.addBot()
      })

      expect(result.current.bots[0].id).toBe(1)
      expect(result.current.bots[1].id).toBe(2)
      expect(result.current.bots[2].id).toBe(3)
    })
  })

  describe('Auto-Assignment', () => {
    it('should auto-assign order to bot when both are added', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
        result.current.addBot()
      })

      expect(result.current.bots[0].status).toBe('PROCESSING')
      expect(result.current.bots[0].currentOrder).toMatchObject({
        id: 1,
        type: 'NORMAL',
        status: 'PROCESSING',
      })
      expect(result.current.processingOrders).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(0)
    })

    it('should auto-assign order when bot exists and order is added', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addBot()
        result.current.addOrder('VIP')
      })

      expect(result.current.bots[0].status).toBe('PROCESSING')
      expect(result.current.bots[0].currentOrder?.id).toBe(1)
      expect(result.current.processingOrders).toHaveLength(1)
    })

    it('should assign VIP orders before NORMAL orders', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL') // Order 1
        result.current.addOrder('VIP') // Order 2
        result.current.addBot() // Should pick VIP order (2)
      })

      expect(result.current.bots[0].currentOrder?.id).toBe(2)
      expect(result.current.bots[0].currentOrder?.type).toBe('VIP')
    })

    it('should assign multiple orders to multiple bots', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL') // Order 1
        result.current.addOrder('NORMAL') // Order 2
        result.current.addOrder('VIP') // Order 3
        result.current.addBot() // Bot 1 - should get VIP order 3
        result.current.addBot() // Bot 2 - should get NORMAL order 1
      })

      expect(result.current.bots[0].currentOrder?.id).toBe(3)
      expect(result.current.bots[0].currentOrder?.type).toBe('VIP')
      expect(result.current.bots[1].currentOrder?.id).toBe(1)
      expect(result.current.bots[1].currentOrder?.type).toBe('NORMAL')
      expect(result.current.pendingOrders).toHaveLength(1)
      expect(result.current.processingOrders).toHaveLength(2)
    })
  })

  describe('Order Completion', () => {
    it('should complete order after 10 seconds', async () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
        result.current.addBot()
      })

      expect(result.current.processingOrders).toHaveLength(1)
      expect(result.current.completedOrders).toHaveLength(0)
      expect(result.current.pendingOrders).toHaveLength(0)

      // Fast-forward time by 10 seconds
      await act(async () => {
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.completedOrders).toHaveLength(1)
      expect(result.current.processingOrders).toHaveLength(0)
      expect(result.current.pendingOrders).toHaveLength(0)
      expect(result.current.completedOrders[0]).toMatchObject({
        id: 1,
        status: 'COMPLETE',
      })
      expect(result.current.completedOrders[0].completedAt).toBeInstanceOf(Date)
      expect(result.current.bots[0].status).toBe('IDLE')
      expect(result.current.bots[0].currentOrder).toBeNull()
    }, 15000)

    it('should auto-assign next order after completion', async () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL') // Order 1
        result.current.addOrder('NORMAL') // Order 2
        result.current.addBot()
      })

      expect(result.current.bots[0].currentOrder?.id).toBe(1)
      expect(result.current.completedOrders).toHaveLength(0)
      expect(result.current.processingOrders).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(1)

      // Complete first order
      await act(async () => {
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.bots[0].currentOrder?.id).toBe(2)
      expect(result.current.bots[0].status).toBe('PROCESSING')
      expect(result.current.completedOrders).toHaveLength(1)
      expect(result.current.processingOrders).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(0)
    }, 15000)

    it('should process multiple orders sequentially', async () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL') // Order 1
        result.current.addOrder('NORMAL') // Order 2
        result.current.addOrder('NORMAL') // Order 3
        result.current.addBot()
      })

      // Complete first order
      await act(async () => {
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.completedOrders).toHaveLength(1)
      expect(result.current.processingOrders).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(1)
      expect(result.current.bots[0].currentOrder?.id).toBe(2)

      // Complete second order
      await act(async () => {
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.completedOrders).toHaveLength(2)
      expect(result.current.processingOrders).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(0)
      expect(result.current.bots[0].currentOrder?.id).toBe(3)

      // Complete third order
      await act(async () => {
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.completedOrders).toHaveLength(3)
      expect(result.current.processingOrders).toHaveLength(0)
      expect(result.current.pendingOrders).toHaveLength(0)
      expect(result.current.bots[0].status).toBe('IDLE')
      expect(result.current.bots[0].currentOrder).toBeNull()
    }, 35000)

    it('should handle multiple bots completing orders independently', async () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL') // Order 1
        result.current.addOrder('NORMAL') // Order 2
        result.current.addBot() // Bot 1
        result.current.addBot() // Bot 2
      })

      expect(result.current.bots[0].currentOrder?.id).toBe(1)
      expect(result.current.bots[1].currentOrder?.id).toBe(2)

      // Complete both orders
      await act(async () => {
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.completedOrders).toHaveLength(2)
      expect(result.current.bots[0].status).toBe('IDLE')
      expect(result.current.bots[1].status).toBe('IDLE')
    }, 15000)
  })

  describe('Removing Bots', () => {
    it('should remove the newest bot', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addBot() // Bot 1
        result.current.addBot() // Bot 2
        result.current.addBot() // Bot 3
      })

      expect(result.current.bots).toHaveLength(3)

      act(() => {
        result.current.removeBot()
      })

      expect(result.current.bots).toHaveLength(2)
      expect(result.current.bots[0].id).toBe(1)
      expect(result.current.bots[1].id).toBe(2)
    })

    it('should return processing order to PENDING when bot is removed', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
        result.current.addBot()
      })

      expect(result.current.processingOrders).toHaveLength(1)
      expect(result.current.bots[0].currentOrder?.id).toBe(1)

      act(() => {
        result.current.removeBot()
      })

      expect(result.current.bots).toHaveLength(0)
      expect(result.current.pendingOrders).toHaveLength(1)
      expect(result.current.pendingOrders[0].id).toBe(1)
      expect(result.current.processingOrders).toHaveLength(0)
    })

    it('should cancel timer when removing processing bot', async () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
        result.current.addBot()
      })

      expect(result.current.bots[0].status).toBe('PROCESSING')

      act(() => {
        result.current.removeBot()
      })

      // Advance time - order should NOT complete since bot was removed
      await act(async () => {
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.completedOrders).toHaveLength(0)
      expect(result.current.pendingOrders).toHaveLength(1)
    }, 15000)

    it('should do nothing when removing from empty bot list', () => {
      const { result } = renderHook(() => useOrderSystem())

      expect(result.current.bots).toHaveLength(0)

      act(() => {
        result.current.removeBot()
      })

      expect(result.current.bots).toHaveLength(0)
    })

    it('should reassign returned order when other bots are available', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL') // Order 1
        result.current.addOrder('NORMAL') // Order 2
        result.current.addBot() // Bot 1 - gets Order 1
        result.current.addBot() // Bot 2 - gets Order 2
      })

      expect(result.current.bots[0].currentOrder?.id).toBe(1)
      expect(result.current.bots[1].currentOrder?.id).toBe(2)

      // Remove Bot 2 - Order 2 should return to pending but no idle bot to pick it up
      act(() => {
        result.current.removeBot()
      })

      expect(result.current.bots).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(1)
      expect(result.current.pendingOrders[0].id).toBe(2)
      expect(result.current.bots[0].currentOrder?.id).toBe(1) // Bot 1 still processing Order 1
    })

    it('should reassign VIP order to available bot if a bot was removed', async () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('VIP') // Order 1
        result.current.addOrder('VIP') // Order 2
        result.current.addOrder('NORMAL') // Order 3
        result.current.addBot() // Bot 1 - gets VIP Order 1
        result.current.addBot() // Bot 2 - gets VIP Order 2
      })

      expect(result.current.bots[0].currentOrder?.id).toBe(1)
      expect(result.current.bots[1].currentOrder?.id).toBe(2)
      expect(result.current.processingOrders).toHaveLength(2)
      expect(result.current.pendingOrders).toHaveLength(1)

      act(() => {
        // Add more VIP order
        result.current.addOrder('VIP') // Order 4

        // Remove Bot 2 - Order 2 should return to pending
        result.current.removeBot()
      })

      expect(result.current.bots).toHaveLength(1)
      expect(result.current.processingOrders).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(3) // Orders 2, 4, and 3

      await act(async () => {
        // Advance time to complete Order 1
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      // Bot 1 should pick up VIP Order 2 next (not NORMAL Order 3 or VIP Order 4)
      // since it was returned to pending when Bot 2 got removed while processing
      expect(result.current.bots[0].currentOrder?.id).toBe(2)
      expect(result.current.bots[0].currentOrder?.type).toBe('VIP')
      expect(result.current.processingOrders).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(2) // Orders 4 and 3

      await act(async () => {
        // Advance time to complete Order 2
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      // Bot 1 should pick up VIP Order 4 next (not NORMAL Order 3)
      expect(result.current.bots[0].currentOrder?.id).toBe(4)
      expect(result.current.bots[0].currentOrder?.type).toBe('VIP')
      expect(result.current.processingOrders).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(1) // Order 3

      // Completed VIP Orders 1, 2
      expect(result.current.completedOrders).toHaveLength(2) // Orders 1 and 2
    })
  })

  describe('Edge Cases', () => {
    it('should handle adding order when no bots exist', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
      })

      expect(result.current.orders).toHaveLength(1)
      expect(result.current.pendingOrders).toHaveLength(1)
      expect(result.current.processingOrders).toHaveLength(0)
    })

    it('should handle adding bot when no orders exist', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addBot()
      })

      expect(result.current.bots).toHaveLength(1)
      expect(result.current.bots[0].status).toBe('IDLE')
      expect(result.current.bots[0].currentOrder).toBeNull()
    })

    it('should handle more bots than orders', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
        result.current.addBot()
        result.current.addBot()
        result.current.addBot()
      })

      expect(result.current.bots[0].status).toBe('PROCESSING')
      expect(result.current.bots[1].status).toBe('IDLE')
      expect(result.current.bots[2].status).toBe('IDLE')
    })

    it('should handle more orders than bots', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
        result.current.addOrder('NORMAL')
        result.current.addOrder('NORMAL')
        result.current.addBot()
      })

      expect(result.current.pendingOrders).toHaveLength(2)
      expect(result.current.processingOrders).toHaveLength(1)
    })

    it('should maintain correct state through complex operations', async () => {
      const { result } = renderHook(() => useOrderSystem())

      // Add initial orders and bots
      act(() => {
        result.current.addOrder('VIP') // Order 1
        result.current.addOrder('NORMAL') // Order 2
        result.current.addBot() // Bot 1 - gets VIP Order 1
      })

      expect(result.current.bots[0].currentOrder?.id).toBe(1)

      // Advance halfway through processing Order 1
      await act(async () => {
        vi.advanceTimersByTime(5000)
      })

      // Add more orders
      act(() => {
        result.current.addOrder('VIP') // Order 3
        result.current.addOrder('NORMAL') // Order 4
      })

      // Add another bot
      act(() => {
        result.current.addBot() // Bot 2 - should get VIP Order 3
      })

      expect(result.current.bots[1].currentOrder?.id).toBe(3)
      expect(result.current.pendingOrders).toHaveLength(2) // Orders 2 and 4

      // Complete first bot's order (finish the remaining 5 seconds)
      await act(async () => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.completedOrders).toHaveLength(1)

      // Bot 1 should now have Order 2 (first in pending)
      expect(result.current.bots[0].currentOrder?.id).toBe(2)

      // Remove Bot 2 while processing
      act(() => {
        result.current.removeBot()
      })

      // Order 3 should return to pending
      expect(result.current.pendingOrders).toHaveLength(2) // Orders 3 and 4

      // Complete Bot 1's current order (Order 2)
      await act(async () => {
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.completedOrders).toHaveLength(2)

      // Bot 1 should pick up Order 3 (VIP has priority) from Bot 2 that got removed while processing
      expect(result.current.bots[0].currentOrder?.id).toBe(3)

      expect(result.current.pendingOrders).toHaveLength(1) // Only Order 4
    }, 25000)
  })

  describe('Computed Values', () => {
    it('should correctly filter pending orders', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
        result.current.addOrder('VIP')
        result.current.addOrder('NORMAL')
      })

      expect(result.current.pendingOrders).toHaveLength(3)
      expect(
        result.current.pendingOrders.every(
          (o: { status: string }) => o.status === 'PENDING',
        ),
      ).toBe(true)
    })

    it('should correctly filter processing orders', () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
        result.current.addOrder('NORMAL')
        result.current.addBot()
        result.current.addBot()
      })

      expect(result.current.processingOrders).toHaveLength(2)
      expect(
        result.current.processingOrders.every(
          (o: { status: string }) => o.status === 'PROCESSING',
        ),
      ).toBe(true)
    })

    it('should correctly filter completed orders', async () => {
      const { result } = renderHook(() => useOrderSystem())

      act(() => {
        result.current.addOrder('NORMAL')
        result.current.addBot()
      })

      await act(async () => {
        vi.advanceTimersByTime(10000)
        await vi.runAllTimersAsync()
      })

      expect(result.current.completedOrders).toHaveLength(1)
      expect(
        result.current.completedOrders.every(
          (o: { status: string }) => o.status === 'COMPLETE',
        ),
      ).toBe(true)
    }, 15000)
  })
})
