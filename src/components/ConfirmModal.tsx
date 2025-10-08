import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ConfirmModalProps {
  show: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "red" | "green" | "amber";
  onConfirm: () => void;
  onCancel: () => void;
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
}: ConfirmModalProps) => {
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
            transition={{ duration: 0.1 }}
          >
            {/* Close Icon */}
            <button
              onClick={onCancel}
              className="absolute left-4 top-4 text-gray-500 hover:text-red-500 transition-all"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-3 text-gray-800 text-center">
              {title}
            </h2>
            <p className="text-gray-600 text-center mb-6">{message}</p>

            <div className="flex justify-center gap-4">
              <button
                onClick={onCancel}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-5 py-2 rounded-lg transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`font-semibold px-5 py-2 rounded-lg text-white shadow-md transition-all ${
                  confirmColor === "red"
                    ? "bg-red-500 hover:bg-red-600"
                    : confirmColor === "amber"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
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
