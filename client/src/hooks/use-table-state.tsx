import { useState, useCallback, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
  priority: number;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

export interface TableState {
  sortConfigs: SortConfig[];
  pageSize: number;
  currentPage: number;
  searchQuery: string;
}

interface UseTableStateOptions {
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  defaultPageSize?: number;
  resetOnTabChange?: boolean;
  tabKey?: string;
}

export function useTableState({
  defaultSortKey,
  defaultSortDirection = 'asc',
  defaultPageSize = 20,
  resetOnTabChange = true,
  tabKey
}: UseTableStateOptions = {}) {
  const [currentTabKey, setCurrentTabKey] = useState(tabKey);
  const [tableState, setTableState] = useState<TableState>(() => ({
    sortConfigs: defaultSortKey ? [{
      key: defaultSortKey,
      direction: defaultSortDirection,
      priority: 0
    }] : [],
    pageSize: defaultPageSize,
    currentPage: 0,
    searchQuery: ''
  }));

  // Reset state when tab changes
  const handleTabChange = useCallback((newTabKey: string) => {
    if (resetOnTabChange && newTabKey !== currentTabKey) {
      setTableState({
        sortConfigs: defaultSortKey ? [{
          key: defaultSortKey,
          direction: defaultSortDirection,
          priority: 0
        }] : [],
        pageSize: defaultPageSize,
        currentPage: 0,
        searchQuery: ''
      });
    }
    setCurrentTabKey(newTabKey);
  }, [currentTabKey, resetOnTabChange, defaultSortKey, defaultSortDirection, defaultPageSize]);

  const handleSort = useCallback((columnKey: string) => {
    setTableState(prev => {
      const existingIndex = prev.sortConfigs.findIndex(config => config.key === columnKey);
      let newSortConfigs: SortConfig[];

      if (existingIndex !== -1) {
        // Column already sorted, toggle direction or remove
        const existingConfig = prev.sortConfigs[existingIndex];
        if (existingConfig.direction === 'asc') {
          // Change to desc with highest priority
          newSortConfigs = [
            { key: columnKey, direction: 'desc', priority: 0 },
            ...prev.sortConfigs.filter(config => config.key !== columnKey)
              .map(config => ({ ...config, priority: config.priority + 1 }))
          ];
        } else {
          // Remove this sort
          newSortConfigs = prev.sortConfigs
            .filter(config => config.key !== columnKey)
            .map(config => ({ ...config, priority: Math.max(0, config.priority - 1) }));
        }
      } else {
        // New column, add as highest priority
        newSortConfigs = [
          { key: columnKey, direction: 'asc', priority: 0 },
          ...prev.sortConfigs.map(config => ({ ...config, priority: config.priority + 1 }))
        ];
      }

      return {
        ...prev,
        sortConfigs: newSortConfigs.slice(0, 3), // Limit to 3 sorts max
        currentPage: 0 // Reset to first page when sorting
      };
    });
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setTableState(prev => ({
      ...prev,
      pageSize: newPageSize,
      currentPage: 0
    }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setTableState(prev => ({
      ...prev,
      currentPage: newPage
    }));
  }, []);

  const handleSearch = useCallback((query: string) => {
    setTableState(prev => ({
      ...prev,
      searchQuery: query,
      currentPage: 0
    }));
  }, []);

  const resetState = useCallback(() => {
    setTableState({
      sortConfigs: defaultSortKey ? [{
        key: defaultSortKey,
        direction: defaultSortDirection,
        priority: 0
      }] : [],
      pageSize: defaultPageSize,
      currentPage: 0,
      searchQuery: ''
    });
  }, [defaultSortKey, defaultSortDirection, defaultPageSize]);

  // Get current sort config for a column
  const getSortConfig = useCallback((columnKey: string): SortConfig | null => {
    return tableState.sortConfigs.find(config => config.key === columnKey) || null;
  }, [tableState.sortConfigs]);

  // Get sort indicator for display
  const getSortIndicator = useCallback((columnKey: string): string => {
    const config = getSortConfig(columnKey);
    if (!config) return '';
    
    const arrow = config.direction === 'asc' ? '↑' : '↓';
    const priority = config.priority > 0 ? `${config.priority + 1}` : '';
    return `${arrow}${priority}`;
  }, [getSortConfig]);

  // Sort data function
  const sortData = useCallback(<T extends Record<string, any>>(
    data: T[],
    customSortFn?: (a: T, b: T, key: string, direction: SortDirection) => number
  ): T[] => {
    if (tableState.sortConfigs.length === 0) return data;

    return [...data].sort((a, b) => {
      for (const config of tableState.sortConfigs.sort((x, y) => x.priority - y.priority)) {
        let result = 0;

        if (customSortFn) {
          result = customSortFn(a, b, config.key, config.direction);
        }

        if (result === 0) {
          // Default sorting logic
          const aVal = a[config.key];
          const bVal = b[config.key];

          if (aVal == null && bVal == null) result = 0;
          else if (aVal == null) result = 1;
          else if (bVal == null) result = -1;
          else if (typeof aVal === 'number' && typeof bVal === 'number') {
            result = aVal - bVal;
          } else {
            result = String(aVal).localeCompare(String(bVal), 'it', { numeric: true });
          }
        }

        if (result !== 0) {
          return config.direction === 'asc' ? result : -result;
        }
      }
      return 0;
    });
  }, [tableState.sortConfigs]);

  // Filter and paginate data
  const processData = useCallback(<T extends Record<string, any>>(
    data: T[],
    searchFields?: string[],
    customSortFn?: (a: T, b: T, key: string, direction: SortDirection) => number
  ) => {
    // Filter data
    let filteredData = data;
    if (tableState.searchQuery && searchFields) {
      const query = tableState.searchQuery.toLowerCase();
      filteredData = data.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value != null && String(value).toLowerCase().includes(query);
        })
      );
    }

    // Sort data
    const sortedData = sortData(filteredData, customSortFn);

    // Paginate data
    const startIndex = tableState.currentPage * tableState.pageSize;
    const endIndex = startIndex + tableState.pageSize;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      totalItems: filteredData.length,
      totalPages: Math.ceil(filteredData.length / tableState.pageSize),
      hasNextPage: endIndex < filteredData.length,
      hasPrevPage: tableState.currentPage > 0
    };
  }, [tableState, sortData]);

  return {
    tableState,
    handleSort,
    handlePageSizeChange,
    handlePageChange,
    handleSearch,
    handleTabChange,
    resetState,
    getSortConfig,
    getSortIndicator,
    sortData,
    processData
  };
}