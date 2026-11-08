import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardBody } from '../../../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { toast } from '../../../stores/toastStore';

export const SignUpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP confirmation step (6-digit code)
  const [step, setStep] = useState<'register' | 'confirm'>('register');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend code countdown and rate-limit states
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  const { signup, confirmEmail, resendCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Read URL params (e.g. from sign-in page redirection)
  useEffect(() => {
    const stepParam = searchParams.get('step');
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
    if (stepParam === 'confirm' || location.pathname === '/verify-email') {
      setStep('confirm');
      setCountdown(60);
    }
  }, [searchParams, location.pathname]);

  // 60-second countdown timer for resending code
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'confirm' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Name validations (minimum 2 characters for both first and last name)
  const isFirstNameValid = firstName.trim().length >= 2;
  const isLastNameValid = lastName.trim().length >= 2;

  // Real-time backend validation rules
  // Pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  }, [password]);

  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.minLength) score += 25;
    if (passwordCriteria.hasUpper) score += 25;
    if (passwordCriteria.hasLower) score += 25;
    if (passwordCriteria.hasNumber) score += 25;
    return score;
  }, [passwordCriteria]);

  const isPasswordValid = passwordScore === 100;
  const isConfirmPasswordMatch = Boolean(confirmPassword && password === confirmPassword);

  const getStrengthColor = () => {
    if (passwordScore <= 25) return 'bg-red-500';
    if (passwordScore <= 50) return 'bg-amber-500';
    if (passwordScore <= 75) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = () => {
    if (!password) return '';
    if (passwordScore <= 25) return 'Weak';
    if (passwordScore <= 50) return 'Fair';
    if (passwordScore <= 75) return 'Good';
    return 'Strong';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFirstNameValid || !isLastNameValid) {
      setError('Please provide both first and last name (minimum 2 letters each).');
      return;
    }

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

    if (!isConfirmPasswordMatch) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(false);
    setResendSuccess('');

    try {
      setLoading(true);
      // Backend virtual 'username' splits by space into firstName and lastName
      const fullUsername = `${firstName.trim()} ${lastName.trim()}`;
      await signup(fullUsername, email, password, confirmPassword);
      toast.success(
        'Account created! A 6-digit verification code was sent to your email.',
        'Verification Code Sent'
      );
      setStep('confirm');
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed. Please check inputs.';
      setError(msg);
      toast.error(msg, 'Registration Error');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (codeToVerify: string) => {
    if (codeToVerify.length < 6 || loading) return;

    setError('');
    setLoading(true);
    try {
      await confirmEmail(email, codeToVerify);
      toast.success('Your email has been confirmed! Please sign in.', 'Account Verified');
      navigate('/sign-in');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP code.';
      setError(msg);
      toast.error(msg, 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const lastChar = clean.slice(-1);
    const updated = [...otpDigits];
    updated[index] = lastChar;
    setOtpDigits(updated);

    const fullCode = updated.join('');
    // Auto-verify if all 6 digits are provided
    if (fullCode.length === 6) {
      submitOtp(fullCode);
    } else if (index < 5) {
      // Auto-advance to next box
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpDigits(updated);

    const fullCode = updated.join('');
    // Auto-verify if full 6-digit code was pasted
    if (fullCode.length === 6) {
      submitOtp(fullCode);
    } else {
      const targetIdx = Math.min(pasted.length, 5);
      inputRefs.current[targetIdx]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setError('');
    setResendSuccess('');

    try {
      const res = await resendCode(email);
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      const successMsg = res?.message || 'A fresh 6-digit verification code has been sent to your email.';
      setResendSuccess(successMsg);
      toast.success(successMsg, 'Code Resent');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not resend code. Please try again.';
      setError(msg);
      toast.error(msg, 'Resend Failed');
    } finally {
      setIsResending(false);
    }
  };

  const handleConfirmOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = otpDigits.join('');

    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    await submitOtp(fullCode);
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
            {step === 'register' && (
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Create an Account
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link to="/sign-in" className="font-semibold text-blue-600 hover:text-blue-500">
                    Sign in here
                  </Link>
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {step === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* First Name & Last Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="First Name"
                      type="text"
                      required
                      placeholder="e.g. John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      icon={<UserIcon className="w-4 h-4" />}
                    />
                    {firstName && !isFirstNameValid && (
                      <span className="text-[10px] text-red-500 mt-0.5 block">Min 2 letters</span>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Last Name"
                      type="text"
                      required
                      placeholder="e.g. Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      icon={<UserIcon className="w-4 h-4" />}
                    />
                    {lastName && !isLastNameValid && (
                      <span className="text-[10px] text-red-500 mt-0.5 block">Min 2 letters</span>
                    )}
                  </div>
                </div>

                <div>
                  <Input
                    label="Email address"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                    helperText="We'll send an activation OTP code to verify your email."
                  />
                </div>

                <div>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Real-time Password Strength & Criteria */}
                  {password && (
                    <div className="mt-3 space-y-2.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                      {/* Strength Meter Bar */}
                      <div>
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="text-gray-500 font-medium">Password Strength:</span>
                          <span className={`font-semibold ${passwordScore === 100 ? 'text-emerald-600' : 'text-gray-700'
                            }`}>
                            {getStrengthLabel()}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                            style={{ width: `${passwordScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Criteria Checklist */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                          {passwordCriteria.minLength ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                          {passwordCriteria.hasNumber ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                          <span>At least 1 number</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                          {passwordCriteria.hasUpper ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                          <span>1 uppercase letter (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                          {passwordCriteria.hasLower ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                          <span>1 lowercase letter (a-z)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Input
                    label="Confirm password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<ShieldCheck className="w-4 h-4" />}
                    rightElement={
                      confirmPassword ? (
                        isConfirmPasswordMatch ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )
                      ) : null
                    }
                  />
                  {confirmPassword && !isConfirmPasswordMatch && (
                    <p className="mt-1 text-[11px] text-red-500 font-medium">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={loading}
                  disabled={loading || !isFirstNameValid || !isLastNameValid || !isPasswordValid || !isConfirmPasswordMatch}
                >
                  {loading ? 'Creating account...' : 'Sign me up'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleConfirmOtp} className="space-y-6">
                {/* Envelope Badge Header */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 ring-8 ring-blue-50/50 shadow-xs">
                    <Mail className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Verify your email
                  </h2>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    We've sent a 6-digit verification code to your email address:
                  </p>
                  <p className="text-xs font-bold text-gray-900 mt-1">
                    {email}
                  </p>
                </div>

                {resendSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-100 flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{resendSuccess}</span>
                  </div>
                )}

                {/* 6-Digit Input Boxes */}
                <div>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <label className="text-xs font-semibold text-gray-700">
                      Enter Verification Code
                    </label>
                    <span className="text-[11px] text-blue-600 font-medium">
                      Auto-verifies on 6th digit
                    </span>
                  </div>
                  <div className="flex justify-center items-center gap-1.5 sm:gap-2.5">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        disabled={loading}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        onPaste={handlePaste}
                        className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl transition-all shadow-xs ${
                          loading
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-wait'
                            : 'bg-gray-50 border-2 border-gray-200 text-gray-900 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:outline-none'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Email Action Button */}
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  isLoading={loading}
                  disabled={loading || otpDigits.join('').length < 6}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>

                {/* Resend Code Section Matching Prompt Mockup */}
                <div className="pt-2 border-t border-gray-100 text-center space-y-2.5">
                  <p className="text-xs text-gray-500 font-medium">
                    Didn't receive the code?
                  </p>

                  {countdown > 0 ? (
                    <p className="text-xs font-semibold text-gray-600">
                      Resend code in <span className="font-bold text-blue-600 font-mono">{formatCountdown(countdown)}</span>
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={countdown > 0 || isResending}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      countdown > 0 || isResending
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200/50'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm cursor-pointer'
                    }`}
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending new code...</span>
                      </>
                    ) : (
                      <span>Resend Code</span>
                    )}
                  </button>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('register');
                        setError('');
                        setResendSuccess('');
                      }}
                      className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer mt-1 hover:underline"
                    >
                      Change email address
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                ©2026 Social Media App. All rights reserved.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
