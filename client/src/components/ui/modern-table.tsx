import { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, X } from 'lucide-react';
import { useTableState, type TableColumn, type SortDirection } from '@/hooks/use-table-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModernTableProps<T = any> {
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

export function ModernTable<T = any>({
  data,
  columns,
  renderCell,
  defaultSortKey,
  defaultSortDirection = 'asc',
  customSortFn,
  className = '',
  emptyMessage = 'Nessun dato disponibile',
  searchFields,
  searchPlaceholder = 'Cerca...',
  showSearch = true,
  compact = false,
  stickyHeader = false,
  tabKey,
  onTabChange
}: ModernTableProps<T>) {
  const {
    tableState,
    handleSort,
    handlePageSizeChange,
    handlePageChange,
    handleSearch,
    handleTabChange,
    getSortIndicator,
    removeSortConfig,
    processData
  } = useTableState({
    defaultSortKey,
    defaultSortDirection,
    defaultPageSize: 20,
    resetOnTabChange: true,
    tabKey
  });

  // Process data with search, sort, and pagination
  const {
    data: processedData,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage
  } = processData(data, searchFields, customSortFn);

  const getSortIcon = (columnKey: string) => {
    const indicator = getSortIndicator(columnKey);
    if (!indicator) return <ChevronsUpDown className="h-4 w-4 opacity-40" />;
    
    const isAsc = indicator.includes('↑');
    const priority = indicator.replace(/[↑↓]/g, '');
    
    return (
      <div className="flex items-center gap-1">
        {isAsc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {priority && <span className="text-xs font-bold bg-blue-100 text-blue-600 rounded-full w-4 h-4 flex items-center justify-center">{priority}</span>}
      </div>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun dato disponibile</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const cellPadding = compact ? 'p-2' : 'p-4';
  const textSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Search and Controls */}
      {showSearch && searchFields && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={tableState.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10 h-10"
            />
            {tableState.searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => handleSearch('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 whitespace-nowrap">Righe per pagina:</span>
            <select
              value={tableState.pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                {columns.map((column) => {
                  const sortConfig = tableState.sortConfigs.find(config => config.key === column.key);
                  return (
                    <th
                      key={column.key}
                      className={`
                        ${cellPadding} font-semibold text-gray-700
                        ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                        ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-200 select-none transition-all duration-200' : ''}
                        ${sortConfig ? 'bg-blue-50 text-blue-900' : ''}
                        ${column.sticky ? 'sticky left-0 z-20' : ''}
                        group
                      `}
                      style={{ width: column.width }}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      <div className={`flex items-center gap-2 ${
                        column.align === 'center' ? 'justify-center' : 
                        column.align === 'right' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className={`font-bold ${textSize}`}>{column.label}</span>
                        {column.sortable !== false && (
                          <div className={`transition-all duration-200 ${
                            sortConfig ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                          }`}>
                            {getSortIcon(column.key)}
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {processedData.map((item, index) => (
                <tr 
                  key={index} 
                  className="border-b border-gray-100 hover:bg-blue-50/30 transition-all duration-200 group"
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className={`
                        ${cellPadding} ${textSize} text-gray-900
                        ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                        ${column.sticky ? 'sticky left-0 bg-white group-hover:bg-blue-50/30' : ''}
                      `}
                      style={{ width: column.width }}
                    >
                      {renderCell(item, column.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination and Info */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        {totalPages > 1 && (
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
                Successiva →
              </Button>
            </div>
          </div>
        )}

        {/* Sort Info */}
        {tableState.sortConfigs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
              <span className="font-medium">Ordinato per:</span>
              {tableState.sortConfigs
                .sort((a, b) => a.priority - b.priority)
                .map((config, index) => {
                  const column = columns.find(c => c.key === config.key);
                  return (
                    <Badge 
                      key={config.key} 
                      variant="secondary" 
                      className="text-xs flex items-center gap-1 pl-2 pr-1 hover:bg-gray-200 transition-colors"
                    >
                      <span>
                        {index + 1}. {column?.label} {config.direction === 'asc' ? '↑' : '↓'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-gray-300 rounded-full"
                        onClick={() => removeSortConfig(config.key)}
                        title={`Rimuovi ordinamento per ${column?.label}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Status Badge Component with consistent colors
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'winner':
      case 'vincitore':
        return { 
          label: 'Vincitore', 
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
        };
      case 'active':
      case 'attivo':
        return { 
          label: 'Attivo', 
          className: 'bg-green-100 text-green-800 border-green-200' 
        };
      case 'passed':
      case 'superato':
        return { 
          label: 'Superato', 
          className: 'bg-blue-100 text-blue-800 border-blue-200' 
        };
      case 'eliminated':
      case 'eliminato':
        return { 
          label: 'Eliminato', 
          className: 'bg-red-100 text-red-800 border-red-200' 
        };
      case 'registration':
      case 'registrazione':
        return { 
          label: 'Registrazione', 
          className: 'bg-purple-100 text-purple-800 border-purple-200' 
        };
      case 'completed':
      case 'completato':
        return { 
          label: 'Completato', 
          className: 'bg-gray-100 text-gray-800 border-gray-200' 
        };
      default:
        return { 
          label: status, 
          className: 'bg-gray-100 text-gray-800 border-gray-200' 
        };
    }
  };

  const { label, className: statusClassName } = getStatusConfig(status);

  return (
    <Badge 
      className={`border font-semibold ${statusClassName} ${className}`}
      variant="outline"
    >
      {label}
    </Badge>
  );
}