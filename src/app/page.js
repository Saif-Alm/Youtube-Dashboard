'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import VideoPlayer from '@/components/VideoPlayer';
import videosData from '@/data/videos.json';
import { FiYoutube } from 'react-icons/fi';

export default function Home() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const videosPerPage = 10;

  // Client-side only code
  useEffect(() => {
    setMounted(true);
    
    // Initialize with first video - this effect should only run once on mount
    // Add a small delay to ensure components are ready before selecting the first video
    const timer = setTimeout(() => {
      if (videosData.items && videosData.items.length > 0) {
        setSelectedVideo(videosData.items[0]);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle search query change
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    // Reset to page 1 when search query changes
    setCurrentPage(1);
  };

  // Filter videos based on search query
  const filteredVideos = videosData.items.filter(video => {
    const title = video.snippet.title.toLowerCase();
    const description = video.snippet.description.toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || description.includes(query);
  });

  // Calculate pagination
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / videosPerPage));

  // Update selected video if it's filtered out by search
  useEffect(() => {
    // If no videos match the search or the selected video is filtered out
    if (filteredVideos.length > 0 && 
        (!selectedVideo || !filteredVideos.some(v => v.id.videoId === selectedVideo.id.videoId))) {
      setSelectedVideo(filteredVideos[0]);
    }
  }, [filteredVideos, selectedVideo]);

  // Close sidebar on mobile when a video is selected
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // For initial server render, return minimal UI
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header for mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white shadow-soft z-30 flex items-center justify-between px-4">
        <div className="flex items-center">
            <FiYoutube className="text-danger w-6 h-6 mr-2" />
            <h1 className="font-semibold text-lg">Youtube Dashboard</h1>
        </div>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-gray-light"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <span className="sr-only">Toggle menu</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </header>
      
      {/* Main content */}
      <div className="flex flex-1 pt-16 lg:pt-0">
        <Sidebar
          videos={currentVideos}
          selectedVideo={selectedVideo}
          onVideoSelect={handleVideoSelect}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <main className={`flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-0' : ''}`}>
          {selectedVideo ? (
            <div className="w-full overflow-hidden rounded-xl shadow-medium animate-fade-in" style={{ minHeight: 'var(--video-height, 60vh)' }}>
              <VideoPlayer video={selectedVideo} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-300 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 0h-17.25m20.25 0a1.125 1.125 0 01-1.125 1.125m-17.25 0a1.125 1.125 0 01-1.125-1.125m1.125-1.125h17.25m-17.25 0h-1.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h17.25c.621 0 1.125.504 1.125 1.125M3.375 4.5h-1.5A1.125 1.125 0 011.5 5.625m17.25-1.125h-1.5c-.621 0-1.125.504-1.125 1.125m1.125-1.125H21.75m0 0h1.5C23.496 4.5 24 4.996 24 5.625M21.75 4.5h-1.5C19.629 4.5 19.125 4.996 19.125 5.625m0 0H21.75m-4.875 0h-1.5c-.621 0-1.125.504-1.125 1.125m1.125-1.125h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125m-7.5 0h-1.5c-.621 0-1.125.504-1.125 1.125M12 5.625h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125M8.625 4.5H7.125c-.621 0-1.125.504-1.125 1.125M12 5.625H8.625m0 0c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 4.996 6 5.625M3.375 4.5h-1.5A1.125 1.125 0 001.5 5.625m0 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m7.5-3v1.5c0 .621.504 1.125 1.125 1.125M12 5.625v1.5c0 .621-.504 1.125-1.125 1.125m7.5-3v1.5c0 .621.504 1.125 1.125 1.125m-7.5-1.5h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125m7.5-1.125c.621 0 1.125.504 1.125 1.125m-9.75 0h1.5m8.25-3v1.5c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m-7.5 1.5v-1.5c0-.621.504-1.125 1.125-1.125m-1.125 1.5v1.5c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
              </svg>
              <h2 className="text-xl font-medium">No video selected</h2>
              <p className="text-secondary mt-1">Please select a video from the sidebar to start</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
