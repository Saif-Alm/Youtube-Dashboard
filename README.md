# YouTube Dashboard

A modern Next.js YouTube dashboard application for browsing and watching videos with advanced playback features. This application provides a clean, responsive interface that works seamlessly across desktop and mobile devices.

## Features

- **Video Browsing**: Intuitive sidebar interface for browsing video collections
- **Video Playback**: High-quality YouTube video playback in the main content area
- **Video Trimming**: Set custom start and end points for precise video playback (minimum 5% duration between trim points)
- **Search Functionality**: Quick search through videos by title and description
- **Responsive Design**: Fully responsive layout that adapts to all screen sizes
- **Keyboard Controls**: Convenient keyboard shortcuts for enhanced video control
  - Space/K: Play/Pause
  - Arrow keys: Seek forward/backward
- **Local Storage**: Persistent user preferences and trim settings

 

## Technology Stack

- **Next.js 14.1.0**: React framework with server-side rendering capabilities
- **React 18.2.0**: JavaScript library for building interactive user interfaces
- **Tailwind CSS 3.4.1**: Utility-first CSS framework for rapid UI development
- **YouTube IFrame API**: Google's official API for YouTube video embedding
- **React Icons 5.0.1**: Comprehensive icon library for enhanced UI elements
- **LocalStorage API**: Browser API for client-side data persistence

## Project Structure

```
/
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── globals.css    # Global styles
│   │   ├── layout.js      # Root layout component
│   │   └── page.js        # Main page component
│   │
│   ├── components/        # React components
│   │   ├── Sidebar.js     # Video list sidebar component
│   │   └── VideoPlayer.js # Video player component
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── useVideoTrimming.js # Hook for video trim functionality
│   │   └── useYouTubePlayer.js # Hook for YouTube player integration
│   │
│   └── data/              # Data files
│       └── videos.json    # Sample video data
│
├── public/                # Static assets
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── next.config.mjs        # Next.js configuration
└── package.json           # Project dependencies
```

## Prerequisites

- Node.js 16.8.0 or later
- npm or yarn package manager
- Internet connection (for YouTube API)

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Saif-Alm/Youtube-Dashboard.git
   cd youtube-dash
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Build and Deployment

### Building for Production

```bash
npm run build
# or
yarn build
```

### Running in Production

```bash
npm run start
# or
yarn start
```

## Core Components

### VideoPlayer

The `VideoPlayer` component is responsible for:

- Rendering the YouTube video player using the YouTube IFrame API
- Implementing custom video control functionalities
- Supporting video trimming functionality
- Handling keyboard shortcuts
- Managing fullscreen toggle

### Sidebar

The `Sidebar` component provides:

- A scrollable list of available videos
- Search functionality for filtering videos
- Visual indication of the currently selected video
- Responsive design with collapsible sidebar for mobile views

## Custom Hooks

### useYouTubePlayer

Manages the YouTube player integration with features like:

- Player initialization and event handling
- Video playback state management
- Time tracking and progress calculation
- Error handling and fallback strategies

### useVideoTrimming

Handles video trimming functionality:

- Setting and managing start/end points
- Saving trim points to localStorage
- Calculating playback progress based on trim settings
- Providing trim controls interface
- Maintains a minimum 5% duration between trim handles to ensure reasonable segment length

## API Integration

The application integrates with the YouTube IFrame API to enable video playback. This requires:

1. Loading the YouTube IFrame API script
2. Creating a player instance
3. Managing player events and states
4. Controlling the player programmatically

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Opera (latest 2 versions)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
