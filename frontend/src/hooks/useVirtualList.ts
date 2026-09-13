import { useState, useEffect } from 'react';

interface UseVirtualListOptions {
  count: number;
  estimateSize: () => number;
  getScrollElement: () => HTMLDivElement | null;
  overscan?: number;
}

export interface VirtualItem {
  index: number;
  start: number;
  size: number;
  key: number;
}

export function useVirtualList({
  count,
  estimateSize,
  getScrollElement,
  overscan = 5,
}: UseVirtualListOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(550);

  useEffect(() => {
    const el = getScrollElement();
    if (!el) return;

    const handleScroll = () => {
      setScrollTop(el.scrollTop);
    };

    setScrollTop(el.scrollTop);
    setContainerHeight(el.clientHeight || 550);

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [getScrollElement]);

  const itemHeight = estimateSize();
  const totalSize = count * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(count - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);

  const virtualItems: VirtualItem[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      start: i * itemHeight,
      size: itemHeight,
      key: i,
    });
  }

  return {
    getTotalSize: () => totalSize,
    getVirtualItems: () => virtualItems,
  };
}
