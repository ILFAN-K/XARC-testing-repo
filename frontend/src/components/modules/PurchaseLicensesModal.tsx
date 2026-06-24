'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Activity } from 'lucide-react';
import type { Module } from '@/types/module';
import { purchaseModuleLicenses } from '@/services/modules.service';

interface PurchaseLicensesModalProps {
  module: Module;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseLicensesModal({ module, onClose, onSuccess }: PurchaseLicensesModalProps) {
  const [additionalLicenses, setAdditionalLicenses] = useState<number | ''>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numLicenses = typeof additionalLicenses === 'number' ? additionalLicenses : 0;
  const isValid = numLicenses > 0 && Number.isInteger(numLicenses);
  
  const newCapacity = module.purchasedLicenses + numLicenses;
  const newUtilization = newCapacity > 0 ? Math.round((module.licensedSystems / newCapacity) * 100) : 0;
  const newAvailable = newCapacity - module.licensedSystems;

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      setIsSubmitting(true);
      setError('');
      await purchaseModuleLicenses(module.id, numLicenses);
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to purchase licenses.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm bg-white rounded-[16px] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-[16px] font-semibold text-gray-900">Purchase Licenses</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">Expand capacity for {module.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-[13px] font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-gray-700">Additional Licenses</label>
              <span className="text-[12px] font-medium text-gray-500">Current: {module.purchasedLicenses}</span>
            </div>
            <div className="relative">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="1"
                step="1"
                value={additionalLicenses}
                onChange={(e) => {
                  const val = e.target.value;
                  setAdditionalLicenses(val === '' ? '' : Number(val));
                }}
                className="w-full pl-9 pr-4 py-2.5 text-[14px] font-semibold text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">New Capacity</span>
              <span className="text-[14px] font-semibold text-gray-900">{isValid ? newCapacity : '--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">Current Utilization</span>
              <span className="text-[14px] font-semibold text-gray-900">{isValid ? `${newUtilization}%` : '--'}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200/60">
              <span className="text-[13px] font-medium text-gray-900">Available After Purchase</span>
              <span className="text-[14px] font-bold text-emerald-600">{isValid ? newAvailable : '--'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="px-4 py-2 text-[13px] font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Purchase'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
