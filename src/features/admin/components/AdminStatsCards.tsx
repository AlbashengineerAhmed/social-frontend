import React from 'react';
import { Card } from '../../../components/ui/Card';
import {
  Users,
  UserCheck,
  FileText,
  MessageSquare,
  AlertTriangle,
  FolderKanban
} from 'lucide-react';
import type { AdminStats } from '../api/admin.api';

interface AdminStatsCardsProps {
  stats: AdminStats | null;
  isLoading: boolean;
}

export const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ stats, isLoading }) => {
  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: 'Registered accounts'
    },
    {
      title: 'Active Accounts',
      value: stats?.activeUsers ?? 0,
      icon: UserCheck,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      description: 'Confirmed & verified'
    },
    {
      title: 'Published Posts',
      value: stats?.totalPosts ?? 0,
      icon: FileText,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      description: 'Public & group posts'
    },
    {
      title: 'Comments',
      value: stats?.totalComments ?? 0,
      icon: MessageSquare,
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
      description: 'Post interactions'
    },
    {
      title: 'Pending Reports',
      value: stats?.totalReports ?? 0,
      icon: AlertTriangle,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      description: 'Requires moderation'
    },
    {
      title: 'Communities',
      value: stats?.totalGroups ?? 0,
      icon: FolderKanban,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Active public/private groups'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 border border-gray-100 shadow-xs animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-gray-100 mb-3" />
            <div className="h-6 w-16 bg-gray-100 rounded mb-1" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card
            key={i}
            className="p-4 border border-gray-100 shadow-xs hover:shadow-md transition-shadow bg-white flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${card.bgColor} ${card.iconColor} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                {card.value.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">{card.title}</p>
              <p className="text-[10px] text-gray-400 mt-1 truncate">{card.description}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

