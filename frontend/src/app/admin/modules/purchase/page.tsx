'use client';

import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function PurchaseModulePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <ShoppingCart className="w-8 h-8 text-gray-400" />
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Purchase Modules</h1>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        The module catalog and purchasing experience will be available in a future update.
      </p>
      <Link 
        href="/admin/modules"
        className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        Return to Modules
      </Link>
    </motion.div>
  );
}
