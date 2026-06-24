import { FileQuestion, SearchX, FilterX } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-users' | 'no-search' | 'no-filters';
  onClearFilters?: () => void;
}

export default function EmptyState({ type, onClearFilters }: EmptyStateProps) {
  const content = {
    'no-users': {
      icon: <FileQuestion className="h-10 w-10 text-gray-400" />,
      title: 'No users found',
      description: 'Get started by creating a new user for your organization.',
      showClear: false,
    },
    'no-search': {
      icon: <SearchX className="h-10 w-10 text-gray-400" />,
      title: 'No search results',
      description: 'We couldn’t find any users matching your search term. Try adjusting your query.',
      showClear: true,
    },
    'no-filters': {
      icon: <FilterX className="h-10 w-10 text-gray-400" />,
      title: 'No matching filters',
      description: 'No users match the currently applied filters. Try clearing them to see more results.',
      showClear: true,
    },
  }[type];

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 border border-gray-100 shadow-sm mb-4">
        {content.icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">{content.description}</p>
      
      {content.showClear && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
