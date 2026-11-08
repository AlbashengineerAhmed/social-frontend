import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldAlert, X, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardBody } from '../../../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { toast } from '../../../stores/toastStore';
import { supportApi } from '../../support/api/support.api';
import { createPortal } from 'react-dom';

export const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Appeal Modal states (Meta/Instagram Paradigm)
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealEmail, setAppealEmail] = useState('');
  const [appealReason, setAppealReason] = useState('Account was suspended by mistake');
  const [appealDescription, setAppealDescription] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealSuccessNumber, setAppealSuccessNumber] = useState<string | null>(null);

  const handleOpenAppeal = () => {
    setAppealEmail(email);
    setAppealDescription('');
    setAppealSuccessNumber(null);
    setAppealModalOpen(true);
  };

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealEmail.trim() || !appealDescription.trim()) {
      toast.warning('Please enter your email and reason for appeal.');
      return;
    }

    setAppealLoading(true);
    try {
      const res = await supportApi.submitAppeal({
        email: appealEmail.trim(),
        subject: `Appeal against ban for ${appealEmail.trim()}`,
        reason: appealReason,
        description: appealDescription.trim()
      });
      setAppealSuccessNumber(res.ticketNumber || 'TKT-PENDING');
      toast.success('Your appeal has been received. Our team will review your account.', 'Appeal Submitted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not submit appeal');
    } finally {
      setAppealLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! You have signed in successfully.', 'Signed In');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      let msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      const lower = msg.toLowerCase();
      if (lower.includes('in-valid login data') || lower.includes('in-valid account') || lower.includes('invalid credentials')) {
        msg = 'Invalid email or password. Please check your credentials and try again.';
      }
      setError(msg);
      toast.error(msg, 'Authentication Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <img src="/assets/images/logo.svg" alt="Social" className="h-9 mx-auto" />
          </Link>
        </div>

        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/sign-up" className="font-medium text-blue-600 hover:text-blue-500">
                  Click here to sign up
                </Link>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 space-y-1.5 animate-in fade-in">
                <p>{error}</p>
                {error.toLowerCase().includes('confirm') && (
                  <Link
                    to={`/sign-up?step=confirm&email=${encodeURIComponent(email)}`}
                    className="inline-block font-semibold text-blue-600 hover:text-blue-700 underline"
                  >
                    Enter verification code or resend code →
                  </Link>
                )}
                {(error.toLowerCase().includes('banned') || error.toLowerCase().includes('suspended')) && (
                  <div>
                    <button
                      type="button"
                      onClick={handleOpenAppeal}
                      className="font-bold text-red-700 hover:text-red-900 underline cursor-pointer inline-flex items-center gap-1 mt-1"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Disagree with decision? Request review / Appeal ban →
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  label="Email address"
                  type="email"
                  required
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-gray-600">Remember me?</span>
                </label>
                <a href="#forgot" className="text-blue-600 hover:text-blue-500 font-medium">
                  Forgot password?
                </a>
              </div>

              <Button type="submit" variant="primary" fullWidth size="lg" isLoading={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                ©2026 Social Network. All rights reserved.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Appeal Ban Modal (Meta/Instagram Paradigm) */}
      {appealModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setAppealModalOpen(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Appeal Account Suspension</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAppealModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {appealSuccessNumber ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    ✓
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Appeal Submitted Successfully</h4>
                  <p className="text-xs text-gray-600">
                    Your request has been routed to our Trust & Safety queue. Case Number:
                  </p>
                  <span className="font-mono text-sm font-bold bg-slate-100 text-blue-700 px-3 py-1 rounded-lg inline-block">
                    {appealSuccessNumber}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Our team reviews appeals within 24-48 hours. If approved, your account will be unlocked automatically.
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setAppealModalOpen(false)}
                  >
                    Got It
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSendAppeal} className="space-y-3.5">
                  <p className="text-xs text-gray-600">
                    If you believe your account was suspended by mistake or want to request a review, please provide details below:
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Account Email Address</label>
                    <input
                      type="email"
                      value={appealEmail}
                      onChange={(e) => setAppealEmail(e.target.value)}
                      placeholder="Enter account email"
                      required
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Appeal</label>
                    <select
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500"
                    >
                      <option value="Account was suspended by mistake">Account was suspended by mistake</option>
                      <option value="My account was compromised/hacked">My account was compromised or hacked</option>
                      <option value="Content did not violate guidelines">Content did not violate safety rules</option>
                      <option value="Other grievance">Other clarification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Why should your account be reinstated?</label>
                    <textarea
                      rows={4}
                      value={appealDescription}
                      onChange={(e) => setAppealDescription(e.target.value)}
                      placeholder="Explain why this decision should be reversed..."
                      required
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAppealModalOpen(false)}
                      disabled={appealLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" disabled={appealLoading}>
                      {appealLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Submit Appeal
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
