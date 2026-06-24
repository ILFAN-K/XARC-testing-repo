import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Loader2, CheckCircle2, Shield, User, Mail, Building2, CheckSquare, Square } from 'lucide-react';
import { createUser, fetchRoles } from '../services/usersApi';
import type { Role } from '../types/users.types';
import { ApiError } from '@/services/api';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminOrgName?: string;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess, adminOrgName = 'Not Assigned' }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
  });

  const [sendInvitation, setSendInvitation] = useState(true);
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const loadRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const data = await fetchRoles();
      // Filter out ADMIN and SUPERADMIN
      const allowedRoles = data.filter(r => r.id !== 'ADMIN' && r.id !== 'SUPERADMIN');
      setRoles(allowedRoles);
      if (allowedRoles.length > 0) {
        setFormData(prev => ({ ...prev, role: allowedRoles[0].id }));
      }
    } catch (err) {
      console.error('Failed to load roles', err);
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData({ fullName: '', email: '', role: roles.length ? roles[0].id : '' });
      setSendInvitation(true);
      setErrors({});
      setIsSubmitting(false);
      setIsSuccess(false);
      
      if (roles.length === 0) {
        loadRoles();
      }
    }
  }, [isOpen, roles, loadRoles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim() || formData.fullName.length < 3 || formData.fullName.length > 100) {
      newErrors.fullName = 'Full Name must be between 3 and 100 characters.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Business Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format.';
    }
    if (!formData.role) newErrors.role = 'Role is required.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setErrors(prev => ({ ...prev, submit: 'Please review the entered information.' }));
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        sendInvitation,
      });
      setIsSuccess(true);
      onSuccess();
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: 'A user with this email already exists.' });
      } else if (err instanceof ApiError && err.status === 400) {
        setErrors({ submit: 'Please review the entered information.' });
      } else {
        setErrors({ submit: 'Unable to send invitation. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ fullName: '', email: '', role: roles.length ? roles[0].id : '' });
    setSendInvitation(true);
    setErrors({});
    setIsSuccess(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />
      
      <div 
        ref={modalRef}
        className="relative flex flex-col w-full max-w-[520px] max-h-[85vh] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in slide-in-from-top-4 fade-in duration-300"
        role="dialog"
        aria-modal="true"
      >
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center p-10 text-center overflow-y-auto">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 shrink-0">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 shrink-0" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Team Member Invited</h2>
            
            <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4 w-full">
              <p className="text-lg font-bold text-gray-900">{formData.fullName}</p>
              <p className="text-sm font-medium text-gray-500">{formData.email}</p>
            </div>

            <div className="mb-8 text-sm text-gray-600 space-y-1">
              <p>An invitation email has been sent.</p>
              <p>The account will remain pending until the invitation is accepted.</p>
            </div>

            <div className="flex w-full gap-3 shrink-0">
              <button
                onClick={resetForm}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                Invite Another User
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-8 py-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create Team Member</h2>
                <p className="mt-1 text-sm font-medium text-gray-500">Invite a new member to your organization</p>
                <p className="mt-1 text-xs text-gray-400">An invitation email will be sent to activate the account.</p>
              </div>
              <button 
                onClick={() => !isSubmitting && onClose()}
                disabled={isSubmitting}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="px-8 py-6 overflow-y-auto space-y-8 flex-1">
                
                {errors.submit && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shrink-0">
                    {errors.submit}
                  </div>
                )}

                {/* Section 1: Identity Information */}
                <div>
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Identity Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-bold text-gray-700">Full Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className={`block w-full rounded-xl border ${errors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/30' : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'} px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-1 transition-colors disabled:bg-gray-50 disabled:text-gray-500`}
                        placeholder="John Doe"
                      />
                      {errors.fullName && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-bold text-gray-700">Business Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        disabled={isSubmitting}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`block w-full rounded-xl border ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/30' : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'} px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-1 transition-colors disabled:bg-gray-50 disabled:text-gray-500`}
                        placeholder="john.doe@company.com"
                      />
                      {errors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>}
                    </div>
                  </div>
                </div>

                {/* Section 2: Access Control */}
                <div>
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Access Control
                  </h3>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-bold text-gray-700">Role <span className="text-red-500">*</span></label>
                    {isLoadingRoles ? (
                      <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100"></div>
                    ) : (
                      <select
                        disabled={isSubmitting}
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className={`block w-full rounded-xl border ${errors.role ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/30' : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900'} px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-1 transition-colors disabled:bg-gray-50 disabled:text-gray-500`}
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    )}
                    <p className="mt-2 text-xs font-medium text-gray-500">Role determines what resources and dashboards the user can access.</p>
                    {errors.role && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.role}</p>}
                  </div>
                </div>

                {/* Section 3: Organization */}
                <div>
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> Organization
                  </h3>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-700 shadow-sm">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{adminOrgName}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Current Assigned Organization</p>
                    </div>
                  </div>
                </div>

                {/* Section 4: Invitation Settings */}
                <div>
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Invitation Settings
                  </h3>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSendInvitation(!sendInvitation)}
                    className="flex w-full items-start gap-3 rounded-xl border border-gray-200 p-4 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 text-left"
                  >
                    <div className="mt-0.5 text-blue-600">
                      {sendInvitation ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Send Invitation Immediately</p>
                      <p className="mt-1 text-xs font-medium text-gray-500 leading-relaxed">The user will receive an email to activate their account and create a password.</p>
                    </div>
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-8 py-5 rounded-b-2xl">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingRoles}
                  className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
