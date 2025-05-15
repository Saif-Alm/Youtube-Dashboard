'use client';

import { FiSearch, FiChevronLeft, FiChevronRight, FiX, FiPlay, FiYoutube } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';

export default function Sidebar({
  videos,
  selectedVideo,
  onVideoSelect,
  searchQuery,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  isOpen,
  onToggleSidebar,
}) {
  const [windowWidth, setWindowWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  const sidebarScrollRef = useRef(null);

  // Handle client-side only code
  useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const isMobile = windowWidth < 1024;

  // Function to scroll to top of sidebar
  const scrollToTop = () => {
    if (sidebarScrollRef.current) {
      sidebarScrollRef.current.scrollTop = 0;
    }
  };

  // Handle page changes with scroll to top
  const handlePageChange = (newPage) => {
    onPageChange(newPage);
    scrollToTop();
  };

  if (!mounted) {
    // Return a placeholder with the same structure but no interactive elements
    return (
      <aside className="sidebar-container fixed lg:sticky top-0 left-0 h-screen flex flex-col z-40">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-6 h-6 mr-2 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="relative h-10 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="flex-1">
          <div className="p-4 h-full bg-white"></div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <aside className={`
        sidebar-container
        fixed lg:sticky top-0 left-0 h-screen
        flex flex-col
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:transform-none
        z-40
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shadow-sm">
          <div className="flex items-center">
            <FiYoutube className="text-danger w-6 h-6 mr-2" />
            <h1 className="font-semibold text-lg">Youtube Dashboard</h1>
          </div>
          {isMobile && (
            <button
              type="button"
              className="p-2 rounded-full hover:bg-gray-light"
              onClick={onToggleSidebar}
              aria-label="Close sidebar"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input focus-ring"
              aria-label="Search videos"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full"
                aria-label="Clear search"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery && videos.length > 0 && (
            <div className="mt-2 text-xs text-secondary">
              <span>{videos.length} video{videos.length !== 1 ? 's' : ''} found</span>
            </div>
          )}
        </div>

        {/* Video List */}
        <div ref={sidebarScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar">
          {videos.length > 0 ? (
            <div className="p-2">
              {videos.map((video) => {
                const isSelected = selectedVideo?.id.videoId === video.id.videoId;
                return (
                  <div
                    key={video.id.videoId}
                    className={`video-item ${isSelected ? 'active' : ''}`}
                    onClick={() => onVideoSelect(video)}
                  >
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0">
                        {isSelected && (
                          <div className="flex justify-start">
                            <div className="video-play-icon">
                              <FiPlay className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        )}
                        <h3 className={`video-title ${isSelected ? 'text-primary' : ''}`}>
                          {video.snippet.title}
                        </h3>
                        <p className="video-description">
                          {video.snippet.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center p-4">
              <p className="text-secondary">No videos found</p>
              <button 
                type="button"
                onClick={() => onSearchChange('')}
                className="mt-2 text-sm text-primary hover:underline focus-ring"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {videos.length > 0 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-white">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-light disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
              aria-label="Previous page"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-secondary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-light disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
              aria-label="Next page"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Overlay for mobile - client-side only rendering */}
      {mounted && isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden animate-fade-in"
          onClick={onToggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
} 