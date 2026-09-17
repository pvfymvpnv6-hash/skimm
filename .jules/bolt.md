# Bolt's Journal - Performance Learnings

## 2025-05-18 - [Preventing Unnecessary Component Re-renders in Clock-Ticking React Apps]
**Learning:** In React applications with top-level 1-second state updates (e.g. live header clock ticks), passing non-memoized callback functions down to large list items (e.g., 24+ ArticleCard components) invalidates `React.memo` and causes unnecessary re-renders and re-computations (like text enrichment/regex scanning).
**Action:** Always wrap top-level callback functions in `useCallback` and memoize computationally intensive list item components with `React.memo` and `useMemo` for derived data.
