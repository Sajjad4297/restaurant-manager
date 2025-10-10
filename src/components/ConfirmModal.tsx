// src/components/ConfirmModal.tsx
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Account } from "../types";

interface ConfirmModalProps {
  show: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "red" | "green" | "amber";
  accounts?: Account[] | null;
  /**
   * IMPORTANT: onConfirm now receives the selected account (or null)
   */
  onConfirm: (selectedAccount?: Account | null) => void;
  onCancel: () => void;
  /**
   * optional: parent can still get selection while user changes the dropdown
   */
  onSelectAccount?: (account: Account | null) => void;
}

export const ConfirmModal = ({
  show,
  title = "تأیید عملیات",
  message = "آیا از انجام این عملیات مطمئن هستید؟",
  confirmText = "تأیید",
  cancelText = "انصراف",
  confirmColor = "green",
  onConfirm,
  onCancel,
  onSelectAccount,
  accounts = null,
}: ConfirmModalProps) => {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // reset selection when modal closes/opens
  useEffect(() => {
    if (!show) setSelectedAccountId(null);
  }, [show]);

  const handleConfirm = () => {
    const selected = accounts?.find((a) => a.id === selectedAccountId) || null;
    // give parent the selected account immediately (avoids race)
    onConfirm(selected);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-[90%] max-w-md rounded-2xl shadow-2xl p-6 relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              onClick={onCancel}
              className="absolute left-4 top-4 text-gray-500 hover:text-red-500 transition-all"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-3 text-gray-800 text-center">{title}</h2>
            <p className="text-gray-600 text-center mb-6">{message}</p>

            {/* Account Selector */}
            {accounts && accounts.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2 text-center">انتخاب حساب:</label>
                <select
                  value={selectedAccountId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const id = val === "" ? null : Number(val);
                    setSelectedAccountId(id);
                    const account = accounts?.find((a) => a.id === id) || null;
                    if (onSelectAccount) onSelectAccount(account);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">انتخاب کنید...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {/* adjust the display property according to your Account shape */}
                      {("accountName" in acc ? (acc as any).accountName : (acc as any).account_name) || `#${acc.id}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={onCancel}
                className="bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-700 font-semibold px-5 py-2 rounded-lg transition-all"
              >
                {cancelText}
              </button>

              <button
                onClick={handleConfirm}
                // disable confirm when accounts exist but none selected
                disabled={!!accounts && accounts.length > 0 && selectedAccountId === null}
                className={`font-semibold px-5 cursor-pointer py-2 rounded-lg text-white shadow-md transition-all ${
                  confirmColor === "red"
                    ? "bg-red-500 hover:bg-red-600"
                    : confirmColor === "amber"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-green-500 hover:bg-green-600"
                } ${!!accounts && accounts.length > 0 && selectedAccountId === null ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
