'use client';

import React, { useState } from 'react';
import { IoSearchOutline, IoChevronBack, IoChevronForward, IoLayersOutline } from 'react-icons/io5';

export default function DataTable({
  columns,
  data,
  searchPlaceholder = 'بحث في السجلات...',
  searchKey = 'name',
  actions,
  filterComponent,
  pageSize = 8,
  emptyMessage = 'لا توجد سجلات مطابقة للبحث أو الفلتر.',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const val = item[searchKey];
    if (typeof val === 'string') {
      return val.toLowerCase().includes(searchTerm.toLowerCase());
    }
    // Also check other string properties
    return Object.values(item).some(
      (v) => typeof v === 'string' && v.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="surface-card overflow-hidden">
      {/* Table Control Bar */}
      <div className="p-4 sm:p-5 border-b border-[#12315C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#687287]">
            <IoSearchOutline className="text-lg" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="input-field pr-10 pl-4 text-sm"
          />
        </div>

        {/* Filter component & Action buttons */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {filterComponent}
          {actions}
        </div>
      </div>

      {/* Responsive Table Body */}
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={col.className || ''}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={col.cellClassName || ''}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-[#687287] gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#12315C]/50 flex items-center justify-center text-xl text-[#A7AFBF]">
                      <IoLayersOutline />
                    </div>
                    <p className="text-sm font-medium">{emptyMessage}</p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="btn-ghost text-xs text-[#0488F8]"
                      >
                        مسح البحث
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-[#12315C] flex items-center justify-between text-xs text-[#A7AFBF]">
          <div>
            عرض <span className="font-tabular text-[#F5F7FA]">{(currentPage - 1) * pageSize + 1}</span> إلى{' '}
            <span className="font-tabular text-[#F5F7FA]">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </span>{' '}
            من إجمالي <span className="font-tabular text-[#F5F7FA]">{filteredData.length}</span> سجل
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#12315C] text-[#F5F7FA] hover:bg-[#0A1B3D] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <IoChevronForward className="rtl:rotate-0 ltr:rotate-180" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              // Show window of pages
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg font-tabular font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#0488F8] text-white'
                        : 'border border-[#12315C] text-[#A7AFBF] hover:bg-[#0A1B3D]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return (
                  <span key={pageNum} className="px-1 text-[#687287]">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#12315C] text-[#F5F7FA] hover:bg-[#0A1B3D] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <IoChevronBack className="rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
