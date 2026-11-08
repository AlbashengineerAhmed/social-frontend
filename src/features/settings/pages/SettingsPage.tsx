import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../auth/context/AuthContext';
import { 
  User, 
  Bell, 
  Shield, 
  Save, 
  Check 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'notifications'>('account');
  const [savedMessage, setSavedMessage] = useState(false);

  // Account form fields
  const [name, setName] = useState(user?.name || 'Sam Lanson');
  const [email, setEmail] = useState('samlanson@webestica.com');
  const [bio, setBio] = useState(user?.bio || "I'd love to change the world, but they won’t give me the source code.");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-xs text-gray-500">Manage your profile information and account preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4">
          <Card className="border border-gray-100 p-2 space-y-1">
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'account' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="w-4 h-4" />
              Account Info
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'privacy' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              Privacy & Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notification Settings
            </button>
          </Card>
        </div>

        {/* Content Area */}
        <div className="md:col-span-8">
          {savedMessage && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Your changes have been saved successfully!
            </div>
          )}

          {activeTab === 'account' && (
            <Card className="border border-gray-100">
              <CardHeader className="p-5 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Personal Information</h3>
              </CardHeader>
              <CardBody className="p-5">
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="flex items-center gap-4 pb-3">
                    <img
                      src={user?.avatar || '/assets/images/avatar/07.jpg'}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
                    />
                    <div>
                      <Button variant="outline" size="sm" type="button">
                        Change Photo
                      </Button>
                      <p className="text-[11px] text-gray-400 mt-1">JPG, GIF or PNG. Max size 2MB</p>
                    </div>
                  </div>

                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="md" className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card className="border border-gray-100 p-5 space-y-5">
              <h3 className="text-sm font-bold text-gray-900">Security Preferences</h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-semibold text-gray-900">Two-Factor Authentication</h5>
                    <p className="text-gray-500 mt-0.5">Add an extra layer of security to your account.</p>
                  </div>
                  <Button variant="primary" size="sm">Enable</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-semibold text-gray-900">Profile Visibility</h5>
                    <p className="text-gray-500 mt-0.5">Control who can discover and see your profile posts.</p>
                  </div>
                  <select className="border border-gray-200 rounded-md p-1.5 text-xs bg-white">
                    <option>Public</option>
                    <option>Friends Only</option>
                    <option>Private</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="border border-gray-100 p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Email & Push Notifications</h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 w-4 h-4" />
                  <span className="text-gray-700">Email me when someone mentions me in a post</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600 w-4 h-4" />
                  <span className="text-gray-700">Email me about new connection requests</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="rounded text-blue-600 w-4 h-4" />
                  <span className="text-gray-700">Send me weekly community digest emails</span>
                </label>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
