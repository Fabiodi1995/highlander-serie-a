import { useState, useMemo, ReactNode } from 'react';
import { ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  className?: string;
}

interface TableState {
  sortKey: string | null;
  sortDirection: SortDirection;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  filters: Record<string, string[]>;
}

interface ModernTableProps<T extends Record<string, any> = Record<string, any>> {
  data: T[];
  columns: TableColumn[];
  renderCell: (item: T, columnKey: string) => ReactNode;
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  customSortFn?: (a: T, b: T, key: string, direction: SortDirection) => number;
  className?: string;
  emptyMessage?: string;
  searchFields?: string[];
  searchPlaceholder?: string;
  showSearch?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
  tabKey?: string;
  onTabChange?: (tabKey: string) => void;
}

export function ModernTable<T extends Record<string, any> = Record<string, any>>({
  data,
  columns,
  renderCell,
  defaultSortKey,
  defaultSortDirection = 'asc',
  customSortFn,
  className = '',
  emptyMessage = 'Nessun dato disponibile',
  searchFields = [],
  searchPlaceholder = 'Cerca...',
  showSearch = true,
  compact = false,
  stickyHeader = true,
  tabKey,
  onTabChange
}: ModernTableProps<T>) {
  const [tableState, setTableState] = useState<TableState>({
    sortKey: defaultSortKey || null,
    sortDirection: defaultSortDirection,
    searchQuery: '',
    currentPage: 0,
    pageSize: 10,
    filters: {}
  });

  // Sort data
  const sortedData = useMemo(() => {
    if (!tableState.sortKey) return data;

    return [...data].sort((a, b) => {
      if (customSortFn) {
        return customSortFn(a, b, tableState.sortKey!, tableState.sortDirection);
      }

      const aVal = a[tableState.sortKey!];
      const bVal = b[tableState.sortKey!];
      
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
      const result = aVal < bVal ? -1 : 1;
      return tableState.sortDirection === 'desc' ? -result : result;
    });
  }, [data, tableState.sortKey, tableState.sortDirection, customSortFn]);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!tableState.searchQuery.trim()) return sortedData;
    
    const query = tableState.searchQuery.toLowerCase();
    return sortedData.filter(item => {
      if (searchFields.length > 0) {
        return searchFields.some(field => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(query);
        });
      }
      
      return Object.values(item).some(value => 
        value && String(value).toLowerCase().includes(query)
      );
    });
  }, [sortedData, tableState.searchQuery, searchFields]);

  // Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / tableState.pageSize);
  const paginatedData = filteredData.slice(
    tableState.currentPage * tableState.pageSize,
    (tableState.currentPage + 1) * tableState.pageSize
  );

  const handleSort = (key: string) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setTableState(prev => ({
      ...prev,
      sortKey: key,
      sortDirection: prev.sortKey === key && prev.sortDirection === 'asc' ? 'desc' : 'asc',
      currentPage: 0
    }));
  };

  const handleSearch = (query: string) => {
    setTableState(prev => ({
      ...prev,
      searchQuery: query,
      currentPage: 0
    }));
  };

  const handlePageChange = (page: number) => {
    setTableState(prev => ({ ...prev, currentPage: page }));
  };

  const hasPrevPage = tableState.currentPage > 0;
  const hasNextPage = tableState.currentPage < totalPages - 1;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      {showSearch && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={tableState.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                {columns.map((column) => {
                  const isSorted = tableState.sortKey === column.key;
                  const sortIcon = isSorted ? (
                    tableState.sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : null;

                  return (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                      } ${column.className || ''}`}
                      style={column.width ? { width: column.width } : undefined}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{column.header}</span>
                        {column.sortable && (
                          <div className="flex flex-col">
                            {sortIcon || <ChevronUp className="h-3 w-3 text-gray-400" />}
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-sm ${compact ? 'py-2' : 'py-3'} ${column.className || ''}`}
                      >
                        {renderCell(item, column.key)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">{(tableState.currentPage * tableState.pageSize) + 1}</span> - <span className="font-semibold">{Math.min((tableState.currentPage + 1) * tableState.pageSize, totalItems)}</span> di <span className="font-semibold">{totalItems}</span> elementi
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(tableState.currentPage - 1)}
                disabled={!hasPrevPage}
                className="px-3 py-2"
              >
                ← Precedente
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (tableState.currentPage < 3) {
                    pageNum = i;
                  } else if (tableState.currentPage > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = tableState.currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === tableState.currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-10 h-8 p-0 font-semibold"
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(tableState.currentPage + 1)}
                disabled={!hasNextPage}
                className="px-3 py-2"
              >
                Successivo →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {Object.keys(tableState.filters).length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Filtri attivi:</span>
            {Object.entries(tableState.filters).map(([key, values]) => 
              values.map((value, index) => {
                return (
                  <Badge key={`${key}-${index}`} variant="secondary" className="flex items-center gap-1">
                    <span className="text-xs">{key}: {value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => {
                        setTableState(prev => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            [key]: prev.filters[key].filter(v => v !== value)
                          }
                        }));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Status Badge Component with consistent colors
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'attivo':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_corso':
      case 'in corso':
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completato':
      case 'completed':
      case 'terminato':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'sospeso':
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'eliminato':
      case 'eliminated':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'superato':
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statusClassName = getStatusStyle(status);
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge className={`border ${statusClassName} ${className}`}>
      {label}
    </Badge>
  );
}