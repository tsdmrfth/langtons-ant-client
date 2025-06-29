# Langton's Ant Client

A real-time, multiplayer implementation of Langton's Ant cellular automaton built with React, TypeScript, and WebSocket technology. This client provides an interactive web interface for exploring the fascinating patterns created by Langton's Ant in a collaborative environment.

## 🚀 Features

- **Real-time Multiplayer**: Connect with other players in a shared Langton's Ant simulation
- **Interactive Grid**: Zoom, pan, and navigate through the cellular automaton grid
- **Custom Rules**: Define and modify ant behavior rules in real-time
- **Ant Placement**: Place multiple ants with different colors and rule sets
- **Live Updates**: Watch as ants move and create patterns in real-time
- **Responsive Design**: Optimized for both desktop and mobile devices
- **WebSocket Communication**: Real-time bidirectional communication with the server
- **Error Handling**: Robust error handling and connection management
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand
- **Real-time Communication**: WebSocket
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Custom canvas animations with requestAnimationFrame

## 📋 Prerequisites

- Node.js (version 18 or higher)
- npm package manager
- A running [Langton's Ant server](https://github.com/tsdmrfth/langtons-ant-server) (WebSocket endpoint)

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/tsdmrfth/langtons-ant-client.git
cd langtons-ant-client
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_WEBSOCKET_URL=ws://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 🌐 Deployment

This project is automatically deployed to Netlify on every push to the `main-v2` branch. The deployment process:

- **Trigger**: Any push to the `main-v2` branch
- **Platform**: Netlify
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment**: Production

The live application is available at the Netlify URL provided in the deployment settings.

## 🎮 Usage

### Getting Started
1. Open the application in your browser
2. The client will automatically attempt to connect to the WebSocket server
3. Once connected, you'll see the current game state with any existing ants and players

### Placing Ants
1. Use the sidebar controls to select your ant color
2. Click on the grid to place your ant at that position
3. Your ant will start moving according to the current rules

### Modifying Rules
1. Open the rule editor in the sidebar
2. Define custom rules for different cell colors
3. Rules specify which direction the ant should turn when encountering each color
4. Changes are applied in real-time

### Navigation
- **Zoom**: Use mouse wheel or pinch gestures to zoom in/out
- **Pan**: Click and drag to move around the grid
- **Reset View**: Use the reset button to return to the default view

### Multiplayer Features
- See other players' ants in different colors
- Watch as all ants move simultaneously
- Real-time updates when players join or leave

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── AntControlPanel.tsx
│   ├── AntsList.tsx
│   ├── CollapsibleRuleEditor.tsx
│   ├── ConnectionStatus.tsx
│   ├── ErrorBoundary.tsx
│   ├── Footer.tsx
│   ├── GameControls.tsx
│   ├── GridCanvas.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── WebSocketManager.tsx
├── config/             # Configuration files
│   ├── constants.ts    # Game constants
│   └── environment.ts  # Environment variables
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components
├── services/           # WebSocket services
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Style

This project follows strict TypeScript and React best practices:

- **TypeScript**: Strict mode enabled with no implicit any
- **ESLint**: Configured with React hooks and TypeScript rules
- **Naming**: Use descriptive names (e.g., `userRequest` instead of `usrReq`)
- **Formatting**: No semicolons, single quotes, no double quotes
- **Spacing**: Spaces above and below if/else blocks
- **Comments**: Minimal comments, prefer self-documenting code

### Key Components

#### GridCanvas
The main rendering component that handles:
- Canvas-based grid rendering
- Zoom and pan interactions
- Real-time ant movement visualization
- Performance optimization with requestAnimationFrame
- Renders only changed cells

#### WebSocketManager
Manages real-time communication:
- Connection establishment and reconnection
- Message handling and state synchronization
- Error handling and connection status

#### State Management (Zustand)
Central state management using two specialized stores:

**Game Store (`gameStore.ts`)**
- **Game State**: Grid dimensions, cells, ants, and players
- **Player Management**: Current player, player list, and player actions
- **Ant Operations**: Placement, rule changes, and ant tracking
- **Grid Updates**: Cell modifications, historical tracking, and real-time updates
- **WebSocket Integration**: Message sending and state synchronization
- **Validation**: Position and rule validation with error handling

**UI Store (`uiStore.ts`)**
- **Connection State**: WebSocket connection status and error handling
- **UI Controls**: Sidebar visibility and interaction states
- **Game Actions**: Ant placement and tile flipping modes
- **Loading States**: Game control update loading indicators
- **User Interactions**: Toggle states for different UI modes

## 🌐 WebSocket Protocol

The client communicates with the server using a structured message protocol:

### Outgoing Messages
- `PLACE_ANT` - Place a new ant on the grid
- `CHANGE_RULES` - Modify ant behavior rules
- `FLIP_TILE` - Manually flip a grid cell
- `UPDATE_GAME_CONFIG` - Update game configuration

### Incoming Messages
- `GAME_TICK_UPDATE` - Real-time game state updates
- `WELCOME` - Initial connection response
- `PLAYER_JOINED/LEFT` - Player connection events
- `ANT_PLACED` - Confirmation of ant placement
- `ERROR` - Error messages from server

## 🎨 UI Components

Built with shadcn/ui and Tailwind CSS:
- **Responsive Design**: Mobile-first approach
- **Dark Theme**: Optimized for dark backgrounds
- **Accessibility**: ARIA labels and keyboard navigation
- **Animations**: Smooth transitions and hover effects

## 🔒 Error Handling

- **Connection Errors**: Automatic reconnection with exponential backoff
- **WebSocket Errors**: Graceful degradation and user feedback
- **React Errors**: Error boundaries prevent app crashes
- **Validation**: Form validation with Zod schemas

## 🚀 Performance

- **Canvas Rendering**: Optimized for smooth 60fps animations
- **State Updates**: Efficient updates using Zustand
- **Memory Management**: Proper cleanup of event listeners
- **Bundle Size**: Tree-shaking and code splitting

## 🔗 Related

- **Server**: [Langton's Ant WebSocket server](https://github.com/tsdmrfth/langtons-ant-server)
---