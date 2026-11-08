# 📱 SocialApp — Frontend Single Page Application (SPA)

A modern, responsive, and feature-rich social media web client built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**. Implements authentic Facebook and Instagram UI paradigms including animated stories, soundwave music trimming, live chat, interactive feeds, and an admin analytics suite.

---

## 🌟 Key Highlights & Capabilities

- 🎨 **Facebook & Instagram UI Design**:
  - Floating vertical toolbar (`Aa`, `🎵`, `✨`, `📍`, `🎨`, `✏️`, `🗑️`).
  - Frosted glass aesthetics (`backdrop-blur-md`), dark mode elements, and gradient transitions.
- 📱 **Interactive 24-Hour Stories**:
  - Horizontal story avatar rings with unread indicator badges.
  - Fullscreen Story Viewer with **40-second smooth progress bars** and automatic advancement to the next story and user.
  - **Draggable overlays**: Freely position music stickers, mention tags, and text captions across the canvas using pointer touch/mouse events.
  - **Facebook-style Music Sticker**: Frosted rounded pill with cover art, track/artist title, and live equalizer audio waves.
  - Interactive Viewers bottom sheet with viewer timestamps and quick emoji reactions (`❤️`, `🔥`, `👏`, `😂`, `😮`, `😢`).
  - Delete story modal with thumbnail preview and auto-pause.
- 🎵 **Integrated Music Library & 40s Waveform Trimmer**:
  - Egyptian hits and online soundtracks library.
  - Visual soundwave scrubber with draggable pink highlight window (40-second clip selection).
  - Quick-jump preset buttons (`Intro`, `Verse`, `Chorus`, `Climax`).
  - Zero-audio-leak cleanup stopping all sounds upon submission or modal close.
- 💬 **Live Chat with Socket.IO**:
  - Split-view desktop layout and mobile full-screen view.
  - Instant incoming message alerts, media sending, and active conversation sorting.
- 📰 **Feed & Social Actions**:
  - Rich post composer supporting photos, videos, gradients, feelings, and locations.
  - Facebook-style reaction picker (Like, Love, Care, Haha, Wow, Sad, Angry) with animated emojis.
  - Threaded comment trees with nested reply forms.
  - Share post dialog, bookmark/save post, and pull-to-refresh on mobile.
- 👥 **Communities & Events**:
  - Discover and manage community groups with member rosters.
  - Scheduled events with interactive RSVP buttons (`Going`, `Interested`).
- 🔔 **Real-Time Notification Hub**:
  - Live socket notifications for interactions with unread counter badges.
- 🎫 **Support Helpdesk & Admin Management**:
  - User support ticket submission with priority levels.
  - Full-featured Admin portal with analytics cards, user suspension, and reported content moderation queue.
- ⚡ **Performance & Architecture**:
  - Feature-based folder architecture matching industry best practices.
  - Global state management using **Zustand** stores (`authStore`, `toastStore`, `notificationStore`).
  - Fast bundle builds with **Vite** and **Tailwind CSS v4**.

---

## 📁 Project Structure

```text
social-frontend/
├── index.html                             # Single page application entry HTML
├── package.json                           # React 19, TypeScript, Vite & dependencies
├── vite.config.ts                         # Vite configuration with Tailwind CSS plugin
├── tsconfig.json                          # TypeScript project references
├── vercel.json                            # Vercel SPA client-side routing rewrites
├── public/
│   ├── assets/
│   │   ├── musics/                        # Local Egyptian & trending audio tracks (.mp3)
│   │   └── images/                        # Static UI assets and icons
│   └── favicon.svg                        # SocialApp brand favicon
└── src/
    ├── main.tsx                           # Application DOM mount
    ├── App.tsx                            # Root router composition & global toaster
    ├── index.css                          # Tailwind CSS imports & theme definitions
    ├── app/
    │   ├── layouts/                       # MainLayout with responsive Navbar & Sidebars
    │   └── router/                        # React Router v7 routes & ProtectedRoute guards
    ├── components/
    │   ├── modals/
    │   │   ├── CreateModal.tsx            # Unified Post & Story composer with 40s music trimmer
    │   │   ├── StoryViewerModal.tsx       # 40s story playback, viewers sheet, Facebook music pill
    │   │   ├── ShareModal.tsx             # Post sharing dialog
    │   │   └── GoogleMapLocationModal.tsx # Location picker with maps integration
    │   └── ui/                            # Reusable primitives (Button, Input, Card, Toaster)
    ├── features/                          # Domain-driven feature modules
    │   ├── auth/                          # Sign In, Sign Up, OTP Verification, Google Login
    │   ├── feed/                          # Posts list, StoriesBar, PostCard, Music API
    │   ├── messaging/                     # Socket.IO live chat & conversation threads
    │   ├── profile/                       # User profile, follower counts, photo albums
    │   ├── groups/                        # Groups discovery, detail pages, member lists
    │   ├── events/                        # Events discovery, creation & RSVP
    │   ├── notifications/                 # Notifications dropdown & full notifications page
    │   ├── support/                       # User support ticketing & ticket status
    │   ├── admin/                         # Admin dashboard, reports table, user management
    │   └── settings/                      # Account settings & privacy preferences
    ├── lib/
    │   ├── axios.ts                       # Axios HTTP client with automatic JWT token injection
    │   ├── socket.ts                      # Singleton Socket.IO client instance
    │   └── apiClient.ts                   # Centralized API service helpers
    ├── stores/                            # Zustand reactive stores
    │   ├── authStore.ts                   # User authentication, token state & logout
    │   ├── toastStore.ts                  # Toast notifications manager
    │   └── notificationStore.ts           # Real-time notification counters & socket listener
    └── types/                             # Global TypeScript interfaces & data contracts
```

---

## 🔄 Core Application User Flows

### 1. Story Creation & 40-Second Playback Flow
```text
[Click 'Create Story'] ──> [Choose Photo/Video or Gradient Text]
                       ──> [Tap 🎵 to pick local/online track]
                       ──> [Drag 40s waveform scrubber to pick chorus]
                       ──> [Drag music sticker & text to desired canvas coordinates]
                       ──> [Click 'Share to Story'] ──> Audio stops immediately & story is live!
```

### 2. Story Viewing & Interaction Flow
```text
[Click Story in StoriesBar] ──> [Open Fullscreen StoryViewer]
                            ──> [Progress bar starts 0% ──> 100% over 40s]
                            ──> [Header shows clean audio attribution: 🎵 Track • Artist]
                            ──> [Canvas shows sleek draggable Facebook music sticker]
                            ──> [Send quick emoji reaction / reply]
                            ──> [At 40s, auto-advances to the next story/user]
```

### 3. Post Publishing & Feed Engagement Flow
```text
[Home Feed] ──> [Create Post] ──> [Attach Media / Feelings / Location]
            ──> [Publish] ──> [Live update in feed]
            ──> [Followers react with animated emojis (Like, Love, Haha, Wow, Sad, Angry)]
            ──> [Nested comment replies & real-time notification alerts]
```

### 4. Real-Time Chat Messaging Flow
```text
[Open Messages] ──> [Select Friend] ──> [Socket connects & room joins]
                ──> [Send Text/Photo] ──> [Instant delivery bubble to recipient]
```

---

## 🛠️ Local Development Setup

1. **Install dependencies**:
   ```bash
   cd social-frontend
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in `social-frontend/` (optional, defaults to `http://localhost:3001`):
   ```env
   VITE_API_BASE_URL="http://localhost:3001"
   VITE_SOCKET_URL="http://localhost:3001"
   ```

3. **Start Vite development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Type-check and build for production**:
   ```bash
   npm run build
   ```

5. **Preview production build locally**:
   ```bash
   npm run preview
   ```

---

## 🚀 Deployment (Vercel)

The frontend includes a [`vercel.json`](./vercel.json) file configured for Single Page Application client-side routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

1. Push your code to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and select `social-frontend`.
3. Set the Framework Preset to **Vite**.
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: URL of your deployed backend (e.g. `https://social-backend.vercel.app` or `https://social-backend.onrender.com`).
   - `VITE_SOCKET_URL`: URL of your deployed Socket.IO server.
5. Click **Deploy**. Vercel will build and serve your app globally with zero configuration.
