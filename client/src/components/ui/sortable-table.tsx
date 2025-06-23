import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal } from 'lucide-react';
import { useTableSorting, usePagination, type TableColumn, type SortDirection } from '@/hooks/use-table-sorting';

interface SortableTableProps<T = any> {
  data: T[];
  columns: TableColumn[];
  renderCell: (item: T, columnKey: string) => ReactNode;
  defaultSortKey?: string;
  customSortFn?: (a: T, b: T, key: string, direction: SortDirection) => number;
  className?: string;
  emptyMessage?: string;
  initialPageSize?: number;
  pageIncrement?: number;
}

export function SortableTable<T = any>({
  data,
  columns,
  renderCell,
  defaultSortKey,
  customSortFn,
  className = '',
  emptyMessage = 'Nessun dato disponibile',
  initialPageSize = 20,
  pageIncrement = 20
}: SortableTableProps<T>) {
  const {
    sortedData,
    sortConfig,
    handleSort,
    getSortIcon
  } = useTableSorting(data, columns, defaultSortKey, customSortFn);

  const {
    paginatedData,
    canLoadMore,
    totalItems,
    showingItems,
    loadMore,
    reset
  } = usePagination(sortedData, initialPageSize, pageIncrement);

  const getSortIconComponent = (key: string) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="h-4 w-4" />;
    }
    if (sortConfig.direction === 'desc') {
      return <ChevronDown className="h-4 w-4" />;
    }
    return <ChevronsUpDown className="h-4 w-4" />;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`text-left p-3 font-medium text-gray-700 border-b-2 border-gray-200 ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                  } ${
                    sortConfig.key === column.key ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{column.label}</span>
                    {column.sortable !== false && (
                      <div className={`transition-colors duration-200 ${
                        sortConfig.key === column.key 
                          ? 'text-blue-600' 
                          : 'text-gray-400 group-hover:text-gray-600'
                      }`}>
                        {getSortIconComponent(column.key)}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, index) => (
              <tr 
                key={index} 
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                {columns.map((column) => (
                  <td key={column.key} className="p-3">
                    {renderCell(item, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination and Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Mostrando {showingItems} di {totalItems} elementi
          {sortConfig.key && (
            <span className="ml-2">
              • Ordinato per{' '}
              <Badge variant="outline" className="ml-1">
                {columns.find(col => col.key === sortConfig.key)?.label}
                {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
              </Badge>
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {canLoadMore && (
            <Button
              variant="outline"
              onClick={loadMore}
              className="flex items-center gap-2"
            >
              <MoreHorizontal className="h-4 w-4" />
              Mostra altri {Math.min(pageIncrement, totalItems - showingItems)}
            </Button>
          )}
          
          {showingItems < totalItems && (
            <Button
              variant="ghost"
              onClick={reset}
              className="text-blue-600 hover:text-blue-800"
            >
              Mostra solo i primi {initialPageSize}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente per rendering del badge di stato
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'vincitore':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'attivo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'superato':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'eliminato':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'active':
      case 'attiva':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
      case 'completato':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'registration':
      case 'registrazione':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getStatusColor(status)} ${className}`}
    >
      {status}
    </Badge>
  );
}