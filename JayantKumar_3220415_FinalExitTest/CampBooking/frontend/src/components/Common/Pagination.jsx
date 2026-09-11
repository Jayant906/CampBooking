const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2)); 
    let endPage = Math.min(totalPages, startPage + maxVisible - 1); 
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-12">
      <button
      /// Previous button - disabled on first page
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-300 border border-[var(--color-sand-dark)] dark:border-[#404040] text-white/70 hover:text-white hover:bg-[var(--color-sand)] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </span>
      </button>
      {/* Page number buttons - show max 5 at a time, centered around current page */}
      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-10 h-10 rounded-full font-medium text-sm transition-all duration-300 ${
            page === currentPage
              ? 'bg-[var(--color-forest)] text-white shadow-md'
              : 'text-white/70 hover:text-white hover:bg-[var(--color-sand)] dark:hover:bg-[#333]'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button 
      /// Next button - disabled on last page
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-300 border border-[var(--color-sand-dark)] dark:border-[#404040] text-white/70 hover:text-white hover:bg-[var(--color-sand)] dark:hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <span className="flex items-center gap-2">
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default Pagination;
