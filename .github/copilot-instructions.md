# GitHub Copilot Instructions for McDonald's Order Management System

## Project Overview

Building a React.js single-page application for McDonald's automated order management system with cooking bot simulation.

## Tech Stack

- **Frontend Framework**: React.js with TypeScript
- **Styling**: ShadCN UI components + Tailwind CSS
- **State Management**: React hooks (useState, useEffect)
- **Build Tool**: Vite
- **Deployment**: Vercel or Netlify

## Core Requirements

### Order Management

1. **Order Types**:
   - Normal Orders: Standard priority
   - VIP Orders: High priority (processed before normal orders)
   - Each order has unique, auto-incrementing ID
   - Orders have states: PENDING → PROCESSING → COMPLETE

2. **Priority Queue Logic**:
   - VIP orders must be placed ahead of all normal orders
   - VIP orders maintain FIFO among themselves
   - Normal orders maintain FIFO among themselves
   - Implementation: Use array with proper insertion logic

3. **Bot Management**:
   - Each bot processes ONE order at a time
   - Processing time: 10 seconds per order
   - Bots can be added/removed dynamically
   - IDLE bots automatically pick up pending orders
   - Removing a bot stops its current order (returns to PENDING)

### UI Components Structure

```
src/
├── components/
│   ├── OrderCard.tsx          # Individual order display
│   ├── OrderQueue.tsx         # PENDING area
│   ├── CompletedOrders.tsx    # COMPLETE area
│   ├── BotControls.tsx        # Bot +/- buttons
│   ├── OrderControls.tsx      # New order buttons
│   └── BotStatus.tsx          # Bot status indicators
├── hooks/
│   └── useOrderSystem.ts      # Main state management hook
├── types/
│   └── index.ts               # TypeScript interfaces
└── App.tsx                    # Main application
```

### Data Structures

```typescript
interface Order {
  id: number
  type: 'NORMAL' | 'VIP'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE'
  createdAt: Date
  completedAt?: Date
}

interface Bot {
  id: number
  status: 'IDLE' | 'PROCESSING'
  currentOrder: Order | null
  processingTimer?: NodeJS.Timeout
}
```

### Key Logic Points

1. **Adding Orders**:
   - Generate unique incrementing ID
   - Set status to PENDING
   - Insert in correct position (VIP before NORMAL)
   - Trigger bot to pick up if available

2. **Bot Processing**:
   - Bot picks FIRST pending order
   - Set order status to PROCESSING
   - Start 10-second timer
   - On completion: move to COMPLETE, pick next order
   - If no orders: set bot to IDLE

3. **Removing Bots**:
   - Remove the NEWEST bot
   - If processing: cancel timer, return order to PENDING
   - Return order to FRONT of appropriate queue position

## Coding Standards

### React Best Practices

- Use functional components with hooks
- Implement proper TypeScript typing
- Use useCallback for function memoization
- Use useMemo for expensive computations
- Proper cleanup in useEffect

### ShadCN Components to Use

- `Card` for order displays
- `Button` for controls
- `Badge` for status indicators
- `Separator` for visual division
- `Alert` for bot status

### Code Style

- Clear, descriptive variable names
- Single responsibility functions
- Maximum 50 lines per function
- Add JSDoc comments for complex logic
- Use early returns to reduce nesting

### Performance Considerations

- Avoid unnecessary re-renders
- Use React.memo for pure components
- Clean up timers on unmount
- Efficient queue insertion algorithm

## Implementation Approach

### Phase 1: Setup

1. Initialize Vite + React + TypeScript
2. Install and configure ShadCN
3. Set up Tailwind CSS
4. Create project structure

### Phase 2: Core Logic

1. Implement order queue with priority logic
2. Create bot processing mechanism
3. Build state management hook
4. Add timer management

### Phase 3: UI Components

1. Build order display components
2. Create control buttons
3. Add bot status visualization
4. Implement responsive layout

### Phase 4: Testing & Polish

1. Test all user stories manually
2. Verify 10-second timing
3. Test edge cases (removing processing bot)
4. Ensure clean, readable code

## Testing Checklist

- [ ] Normal order appears in PENDING
- [ ] VIP order appears before normal orders
- [ ] Order IDs are unique and incrementing
- [ ] Bot processes order in 10 seconds
- [ ] Order moves to COMPLETE after processing
- [ ] Bot picks next order automatically
- [ ] Bot becomes IDLE when no orders
- [ ] Removing bot returns order to PENDING
- [ ] Multiple bots work independently
- [ ] Priority queue maintains correct order

## Deployment

- Build: `npm run build`
- Deploy to Vercel/Netlify
- Provide public URL
- Test in production environment

## Documentation to Provide

1. README.md with:
   - Project description
   - Setup instructions
   - How to run locally
   - Live demo URL
   - Technology choices explanation
2. Inline code comments for complex logic
3. Component usage examples

## Time Management (30 min target)

- Setup (5 min): Project initialization
- Core Logic (10 min): Queue + bot processing
- UI Components (10 min): React components
- Testing (5 min): Verify all requirements

## Common Pitfalls to Avoid

- Not handling bot removal during processing
- Incorrect VIP priority insertion
- Memory leaks from uncleaned timers
- Race conditions in async operations
- Over-engineering with complex state management

## Example Code Patterns

### Priority Queue Insertion

```typescript
const insertOrder = (orders: Order[], newOrder: Order): Order[] => {
  if (newOrder.type === 'VIP') {
    // Find last VIP position
    const lastVipIndex = orders.findLastIndex(
      (o) => o.type === 'VIP' && o.status === 'PENDING',
    )
    return [
      ...orders.slice(0, lastVipIndex + 1),
      newOrder,
      ...orders.slice(lastVipIndex + 1),
    ]
  }
  return [...orders, newOrder]
}
```

### Bot Processing

```typescript
const processOrder = (bot: Bot, order: Order) => {
  order.status = 'PROCESSING'
  bot.currentOrder = order
  bot.status = 'PROCESSING'

  bot.processingTimer = setTimeout(() => {
    order.status = 'COMPLETE'
    order.completedAt = new Date()
    bot.currentOrder = null
    bot.status = 'IDLE'
    pickNextOrder(bot)
  }, 10000)
}
```

## Success Criteria

✅ All 4 user stories implemented correctly
✅ Clean, readable code
✅ Proper TypeScript typing
✅ Responsive UI with ShadCN
✅ Deployed to public URL
✅ Documentation provided
✅ Completed within reasonable time frame
