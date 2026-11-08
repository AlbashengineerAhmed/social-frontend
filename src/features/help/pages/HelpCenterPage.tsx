import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Search, BookOpen, ShieldCheck, Inbox, ChevronRight } from 'lucide-react';

export const HelpCenterPage: React.FC = () => {
  const faqs = [
    { q: 'How do I change my profile photo or bio?', a: 'Go to Settings > Personal Information to update your name, photo, and bio at any time.' },
    { q: 'How can I create or join a group?', a: 'Navigate to the Groups tab in the navbar or sidebar, where you can browse community groups or click "Create Group".' },
    { q: 'Is my data secure?', a: 'Yes, your account credentials and personal information are stored securely with strict privacy controls.' },
    { q: 'How do I report inappropriate content?', a: 'Click on the three dots icon on any post or comment to report it directly to our moderation team.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 sm:p-12 text-center text-white">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">How can we help you?</h1>
        <p className="text-blue-100 text-xs sm:text-sm max-w-md mx-auto mb-6">
          Search for answers, guides, troubleshooting articles, and community support.
        </p>

        <div className="max-w-lg mx-auto relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search help topics, questions, features..."
            className="w-full bg-white text-gray-900 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none shadow-lg placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border border-gray-100 p-5 text-center hover:border-blue-200 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 mb-1">Getting Started</h3>
          <p className="text-xs text-gray-500">Learn how to create accounts, setup profiles, and post.</p>
        </Card>

        <Card className="border border-gray-100 p-5 text-center hover:border-blue-200 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 mb-1">Account & Privacy</h3>
          <p className="text-xs text-gray-500">Manage security settings, two-factor auth, and privacy.</p>
        </Card>

        <Link to="/help/support-inbox" className="block">
          <Card className="border border-purple-100 bg-purple-50/30 p-5 text-center hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">Support Inbox & Appeals</h3>
              <p className="text-xs text-gray-500">View status of your reports, appeals, and official replies.</p>
            </div>
            <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-purple-700 mt-3">
              Open Support Inbox <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Card>
        </Link>
      </div>

      <Card className="border border-gray-100 p-6 space-y-4">
        <h2 className="text-base font-bold text-gray-900">Frequently Asked Questions</h2>
        <div className="divide-y divide-gray-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-3.5 space-y-1">
              <h4 className="text-xs font-semibold text-gray-900">{faq.q}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
