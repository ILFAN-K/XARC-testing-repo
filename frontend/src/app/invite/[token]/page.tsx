'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { apiGet, apiPost, ApiError } from '@/services/api';

export default function InviteAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    const validateToken = async () => {
      try {
        const data = await apiGet<{ success: boolean; fullName: string; email: string; organizationName: string; role: string; }>(`/auth/validate-invitation/${token}`);
        setUserInfo(data);
        setIsValid(true);
      } catch (err) {
        if (err instanceof ApiError) {
          setErrorMsg(err.status === 400 ? 'Invitation Invalid or Expired' : 'Unable to load invitation');
        } else {
          setErrorMsg('An unexpected error occurred.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await apiPost('/auth/accept-invitation', { token, password });
      setIsSuccess(true);
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg('Failed to activate account. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{errorMsg}</h2>
          <p className="text-gray-500 mb-8">This invitation link is no longer valid. Please contact your administrator to request a new invitation.</p>
          <button 
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 bg-gray-900 text-white font-bold rounded-xl shadow-sm hover:bg-black transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Activated Successfully</h2>
          <p className="text-gray-500 mb-8">Redirecting to Login...</p>
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-900 px-8 py-10 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Welcome to XR Nexus</h1>
          <p className="text-gray-400 font-medium">Create a password to activate your account</p>
        </div>

        <div className="p-8">
          {/* User Info Card */}
          <div className="mb-8 rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Organization</span>
              <span className="text-sm font-bold text-gray-900">{userInfo.organizationName}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Role</span>
              <span className="text-sm font-bold text-gray-900 capitalize">{userInfo.role.toLowerCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Email</span>
              <span className="text-sm font-bold text-gray-900">{userInfo.email}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 text-sm font-medium rounded-xl border border-red-100">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:bg-gray-50"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:bg-gray-50"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="w-full py-3.5 px-4 bg-gray-900 text-white font-bold rounded-xl shadow-sm hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Activating...
                </>
              ) : (
                'Activate Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
