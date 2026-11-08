import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from './ProtectedRoute';
import { FeedPage } from '../../features/feed/pages/FeedPage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { SignInPage } from '../../features/auth/pages/SignInPage';
import { SignUpPage } from '../../features/auth/pages/SignUpPage';
import { MessagingPage } from '../../features/messaging/pages/MessagingPage';
import { NotificationsPage } from '../../features/notifications/pages/NotificationsPage';
import { GroupsPage } from '../../features/groups/pages/GroupsPage';
import { GroupDetailPage } from '../../features/groups/pages/GroupDetailPage';
import { EventsPage } from '../../features/events/pages/EventsPage';
import { EventDetailPage } from '../../features/events/pages/EventDetailPage';
import { AlbumsPage } from '../../features/albums/pages/AlbumsPage';
import { VideosPage } from '../../features/videos/pages/VideosPage';
import { SettingsPage } from '../../features/settings/pages/SettingsPage';
import { HelpCenterPage } from '../../features/help/pages/HelpCenterPage';
import { SupportInboxPage } from '../../features/support/pages/SupportInboxPage';
import { NotFoundPage } from '../../features/error/pages/NotFoundPage';

// Admin feature imports
import { AdminLayout } from '../../features/admin/layouts/AdminLayout';
import { AdminOverviewPage } from '../../features/admin/pages/AdminOverviewPage';
import { AdminUsersPage } from '../../features/admin/pages/AdminUsersPage';
import { AdminPostsPage } from '../../features/admin/pages/AdminPostsPage';
import { AdminReportsPage } from '../../features/admin/pages/AdminReportsPage';
import { AdminGroupsPage } from '../../features/admin/pages/AdminGroupsPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public-only routes (redirects to '/' if already logged in) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/verify-email" element={<SignUpPage />} />
      </Route>

      {/* Protected routes (redirects to '/sign-in' if not authenticated with token) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/messaging" element={<MessagingPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/help/support-inbox" element={<SupportInboxPage />} />
          <Route path="/404" element={<NotFoundPage />} />
        </Route>
      </Route>

      {/* Protected Admin Console Routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="posts" element={<AdminPostsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="groups" element={<AdminGroupsPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
