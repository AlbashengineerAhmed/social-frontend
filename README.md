# 📱 SocialApp — Enterprise Frontend Single Page Application (SPA)

> **Framework:** React 19 + TypeScript + Vite  
> **Styling Engine:** Tailwind CSS v4  
> **State Management:** Zustand Stores (`auth`, `toast`, `notifications`)  
> **Routing:** React Router v7  
> **Deployment Target:** Vercel SPA  

---

## 📖 Executive Summary

The **SocialApp Frontend** is an enterprise-grade social networking client designed with authentic **Facebook & Instagram UI/UX paradigms**. It features 24-hour animated stories with interactive 40-second audio trimming, real-time messaging via Socket.IO, multi-emoji reaction pickers, community group hubs, event scheduling, and a full administrative moderation suite.

---

## 🛠️ Technology Stack & Libraries

| Library / Tool | Version | Role / Purpose |
| :--- | :--- | :--- |
| **React** | `v19.3` | Modern declarative component-driven UI library with hooks |
| **TypeScript** | `v6.0` | Compile-time strict type safety, interfaces, and API contracts |
| **Vite** | `v8.3` | Next-generation bundler with instant Hot Module Replacement (HMR) |
| **Tailwind CSS** | `v4.3` | Utility-first styling engine with native CSS variables and glassmorphism |
| **React Router DOM** | `v7.18` | Declarative client-side routing, nested layouts, and route guards |
| **Zustand** | `v5.0` | Minimalist, unopinionated atomic global state management |
| **Socket.IO Client** | `v4.8` | Real-time WebSocket connection for chat and instant notifications |
| **Axios** | `v1.21` | HTTP client with request/response interceptors for JWT token injection |
| **Lucide React** | `v1.69` | Consistent, accessible SVG icon library |

---

## 🗺️ Application Routing Matrix

| Route Path | Component | Layout | Access Guard | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `FeedPage` | `MainLayout` | Protected | Main newsfeed with StoriesBar, Post composer, and widgets |
| `/signin` | `SignInPage` | Auth Layout | Public Only | Email/password sign-in and Google OAuth2 button |
| `/signup` | `SignUpPage` | Auth Layout | Public Only | New account registration with OTP email verification |
| `/messages` | `MessagingPage` | `MainLayout` | Protected | Split-screen real-time chat with active conversation rooms |
| `/notifications`| `NotificationsPage`| `MainLayout`| Protected | Real-time notification activity center with read toggles |
| `/profile/:id` | `ProfilePage` | `MainLayout` | Protected | User profile, cover/avatar images, follower counts, and posts |
| `/groups` | `GroupsPage` | `MainLayout` | Protected | Community discovery directory and group creation modal |
| `/groups/:id` | `GroupDetailPage` | `MainLayout` | Protected | Group feed, member directory, and join request actions |
| `/events` | `EventsPage` | `MainLayout` | Protected | Upcoming events catalog and RSVP attendance buttons |
| `/events/:id` | `EventDetailPage` | `MainLayout` | Protected | Event schedule, map location, and attendees list |
| `/videos` | `VideosPage` | `MainLayout` | Protected | Dedicated video feed and reels player |
| `/albums` | `AlbumsPage` | `MainLayout` | Protected | User photo and media album galleries |
| `/support` | `SupportInboxPage` | `MainLayout` | Protected | Help desk ticket submission and support conversation thread |
| `/settings` | `SettingsPage` | `MainLayout` | Protected | Account preferences, password update, and account deactivation |
| `/admin` | `AdminOverviewPage`| `AdminLayout`| **Admin Only** | SuperAdmin platform KPIs, metrics, and traffic statistics |
| `/admin/users` | `AdminUsersPage` | `AdminLayout`| **Admin Only** | User management, role elevation (`Admin`), and account banning |
| `/admin/posts` | `AdminPostsPage` | `AdminLayout`| **Admin Only** | Post moderation, soft-delete, and restoration |
| `/admin/reports`| `AdminReportsPage`| `AdminLayout`| **Admin Only** | Moderation queue for user-submitted content reports |
| `*` | `NotFoundPage` | Simple Layout | Public | Clean 404 page with return to home navigation |

---

## 🗄️ State Management Architecture (Zustand Stores)

| Store Name | File Path | Core State Attributes | Primary Actions |
| :--- | :--- | :--- | :--- |
| **`authStore`** | `src/stores/authStore.ts` | `user`, `accessToken`, `refreshToken`, `isAuthenticated` | `login()`, `logout()`, `updateUser()`, `refreshAuth()` |
| **`notificationStore`**| `src/stores/notificationStore.ts` | `notifications[]`, `unreadCount` | `fetchNotifications()`, `markAsRead()`, `addNotification()` |
| **`toastStore`** | `src/stores/toastStore.ts` | `toasts[]` (`id`, `type`, `title`, `message`, `duration`) | `toast.success()`, `toast.error()`, `toast.info()`, `remove()` |

---

## 🌟 Core Feature Modules & UI Matrix

| Feature | Primary Components | Key Capabilities & Architecture |
| :--- | :--- | :--- |
| **24-Hour Stories** | `StoriesBar.tsx`<br>`StoryViewerModal.tsx` | • Horizontal story ring list with unread gradient borders.<br>• **40-second smooth progression** with auto-advance to next story/user.<br>• Draggable overlays (music, text captions, mentions) with touch coordinates.<br>• **Facebook-style music sticker** (frosted pill, cover, bold title, equalizer wave).<br>• Real-time viewers bottom sheet with read timestamps and quick emoji reactions.<br>• Dedicated story deletion modal with auto-pause. |
| **Music Trimmer (40s)**| `CreateModal.tsx` | • Local Egyptian hits + royalty-free soundtrack catalog.<br>• **40-second waveform scrubber** with draggable highlight frame.<br>• Quick-jump chorus presets (`Intro`, `Verse`, `Chorus`, `Climax`).<br>• Guaranteed zero-audio-leak cleanup on submit, close, or unmount. |
| **Post Composer** | `CreatePostCard.tsx`<br>`CreateModal.tsx` | • Vertical tool column (`Aa`, `🎵`, `✨`, `📍`, `🎨`, `✏️`, `🗑️`).<br>• Text posts with dynamic gradients and customizable font colors.<br>• Cloudinary image/video attachments with preview removal.<br>• Feelings/Activities picker and Google Maps location tagging. |
| **Interactive Feed** | `FeedPage.tsx`<br>`PostCard.tsx` | • Facebook-style reaction picker with animated emojis (Like, Love, Care...).<br>• Multi-level threaded comments and nested replies.<br>• Share dialog with direct link copying and feed re-sharing.<br>• Mobile pull-to-refresh gesture and bookmarking. |
| **Live Chat** | `MessagingPage.tsx` | • Socket.IO bidirectional message delivery.<br>• Active conversations list with unread counter badges.<br>• Image upload preview inside chat bubbles.<br>• Typing indicators and online status presence. |
| **Admin Portal** | `AdminLayout.tsx`<br>`AdminSidebar.tsx` | • Analytical KPI cards (users, posts, active stories, open tickets).<br>• Paginated users table with role toggle and ban/unban switches.<br>• Content reports queue with action resolutions (Warn, Delete, Dismiss). |

---

## ⚡ Socket.IO Client Event Matrix

| Event Name | Type | Payload Received / Sent | UI Impact |
| :--- | :--- | :--- | :--- |
| `connect` | Built-in | Socket ID | Establishes authenticated connection with JWT token handshake |
| `newMessage` | Inbound | `{ message, conversationId }` | Appends chat bubble and increments unread badge |
| `userTyping` | Inbound | `{ userId, conversationId }` | Displays "Typing..." dots in conversation window |
| `newNotification`| Inbound| `{ notification }` | Increments bell icon counter & triggers toast alert |
| `storyReaction` | Inbound | `{ storyId, emoji, user }` | Displays floating reaction toast on active story |

---

## ⚙️ Frontend Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:3001` | Backend REST API server URL (e.g. `https://social-backend.vercel.app`) |
| `VITE_SOCKET_URL` | `http://localhost:3001` | Socket.IO WebSocket server host (e.g. `https://social-backend.onrender.com`) |

---

## 🚀 Deployment (Vercel SPA Configuration)

The repository includes [`vercel.json`](./vercel.json) to handle Single Page Application client routing:

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

### Deployment Step-by-Step Matrix:
| Step | Action | Platform | Command / Details |
| :---: | :--- | :--- | :--- |
| **1** | Import Repository | Vercel Dashboard | Select `AlbashengineerAhmed/social-frontend` |
| **2** | Framework Preset | Vercel Settings | Preset: **Vite** (Build: `npm run build`, Output: `dist`) |
| **3** | Environment Variables | Vercel Project Settings | Set `VITE_API_BASE_URL` and `VITE_SOCKET_URL` |
| **4** | Deploy | Vercel Web | Click **Deploy** ➔ Live globally distributed CDN deployment |
