import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  defaultSort?: SortDirection;
}

export function useTableSorting<T = any>(
  data: T[],
  columns: TableColumn[],
  defaultSortKey?: string,
  customSortFn?: (a: T, b: T, key: string, direction: SortDirection) => number
) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const defaultColumn = columns.find(col => col.key === defaultSortKey);
    return {
      key: defaultSortKey || null,
      direction: defaultColumn?.defaultSort || 'asc'
    };
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      // Custom sort function takes precedence
      if (customSortFn) {
        return customSortFn(a, b, sortConfig.key!, sortConfig.direction);
      }

      const aValue = getNestedValue(a, sortConfig.key!);
      const bValue = getNestedValue(b, sortConfig.key!);

      // Handle null/undefined values (priorità più bassa)
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Handle different data types
      const result = compareValues(aValue, bValue);
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [data, sortConfig, customSortFn]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // Cycle through: asc -> desc -> null -> asc
        const newDirection: SortDirection = 
          prevConfig.direction === 'asc' ? 'desc' :
          prevConfig.direction === 'desc' ? null : 'asc';
        
        return {
          key: newDirection ? key : null,
          direction: newDirection
        };
      }
      
      // New column selected
      const column = columns.find(col => col.key === key);
      return {
        key,
        direction: column?.defaultSort || 'asc'
      };
    });
  }, [columns]);

  const getSortIcon = useCallback((key: string) => {
    if (sortConfig.key !== key) return '↕️';
    if (sortConfig.direction === 'asc') return '↑';
    if (sortConfig.direction === 'desc') return '↓';
    return '↕️';
  }, [sortConfig]);

  return {
    sortedData,
    sortConfig,
    handleSort,
    getSortIcon
  };
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((value, key) => value?.[key], obj);
}

// Smart value comparison
function compareValues(a: any, b: any): number {
  // Same type comparison
  if (typeof a === typeof b) {
    if (typeof a === 'string') {
      return a.localeCompare(b, 'it', { numeric: true, sensitivity: 'base' });
    }
    if (typeof a === 'number') {
      return a - b;
    }
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }
    if (typeof a === 'boolean') {
      return a === b ? 0 : a ? 1 : -1;
    }
  }

  // Different types - convert to string and compare
  const aStr = String(a);
  const bStr = String(b);
  return aStr.localeCompare(bStr, 'it', { numeric: true, sensitivity: 'base' });
}

// Pagination hook
export function usePagination<T>(
  data: T[],
  initialPageSize: number = 20,
  pageIncrement: number = 20
) {
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginatedData = useMemo(() => {
    return data.slice(0, pageSize);
  }, [data, pageSize]);

  const canLoadMore = pageSize < data.length;
  const totalItems = data.length;
  const showingItems = Math.min(pageSize, data.length);

  const loadMore = useCallback(() => {
    setPageSize(prev => Math.min(prev + pageIncrement, data.length));
  }, [pageIncrement, data.length]);

  const reset = useCallback(() => {
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  return {
    paginatedData,
    canLoadMore,
    totalItems,
    showingItems,
    pageSize,
    loadMore,
    reset
  };
}