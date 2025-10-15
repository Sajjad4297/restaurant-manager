import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Account } from "../types";

interface ConfirmModalProps {
    show: boolean;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: "red" | "green" | "amber";
    accounts?: Account[] | null;
    showPaymentSelect?: boolean;
    onConfirm: (selectedAccount?: Account | null, paymentMethod?: string) => void;
    onCancel: () => void;
    onSelectAccount?: (account: Account | null) => void;
}

export const ConfirmModal = ({
    show,
    title = "تأیید عملیات",
    message = "آیا از انجام این عملیات مطمئن هستید؟",
    confirmText = "تأیید",
    cancelText = "انصراف",
    confirmColor = "green",
    accounts = null,
    showPaymentSelect = false,
    onConfirm,
    onCancel,
    onSelectAccount,
}: ConfirmModalProps) => {
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("کارتخوان");
    const confirmBtnRef = useRef<HTMLButtonElement>(null);
    const [search, setSearch] = useState("");
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (search.trim()) {
            const results = accounts?.filter((a) =>
                a.accountName?.toLowerCase().includes(search.toLowerCase())
            ) ?? [];
            setFilteredAccounts(results);
        } else {
            setFilteredAccounts(accounts ?? []);
        }
    }, [search, accounts]);

    useEffect(() => {
        if (!show) {
            setSelectedAccountId(null);
            setPaymentMethod("کارتخوان");
        }
    }, [show]);

    useEffect(() => {
        if (show && confirmBtnRef.current) {
            confirmBtnRef.current.focus();
        }
    }, [show]);

    const handleConfirm = () => {
        const selected = accounts?.find((a) => a.id === selectedAccountId) || null;
        onConfirm(selected, paymentMethod);
    };

    useEffect(() => {
        if (search.trim()) {
            const results = accounts?.filter((a) =>
                a.accountName?.toLowerCase().includes(search.toLowerCase())
            ) ?? [];
            setFilteredAccounts(results);
        } else {
            setFilteredAccounts(accounts ?? []);
        }
    }, [search, accounts]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white w-[90%] max-w-md rounded-2xl shadow-xl p-6 relative border border-gray-200 max-h-[80vh]"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <button
                            onClick={onCancel}
                            className="absolute left-4 top-4 text-gray-500 hover:text-red-500 transition-all"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-3 text-gray-800 text-center">{title}</h2>
                        <p className="text-gray-600 text-center mb-6 leading-relaxed">{message}</p>

                        {/* ✅ Account Select */}
                        {accounts && accounts.length > 0 && (
                            <div className="mb-6 relative">
                                <label className="block text-gray-700 font-semibold mb-2 text-center">
                                    انتخاب حساب:
                                </label>
                                <input
                                    type="text"
                                    placeholder="جستجو حساب..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />

                                {/* Suggestions dropdown */}
                                {showSuggestions && filteredAccounts.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-48 overflow-auto shadow-md">
                                        {filteredAccounts.map((acc) => (
                                            <li
                                                key={acc.id}
                                                onClick={() => {
                                                    if (acc.id)
                                                        setSelectedAccountId(acc.id);
                                                    setSearch(acc.accountName || `#${acc.id}`);
                                                    setShowSuggestions(false);
                                                    if (onSelectAccount) onSelectAccount(acc);
                                                }}
                                                className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 ${acc.id === selectedAccountId ? "bg-indigo-100" : ""
                                                    }`}
                                            >
                                                {acc.accountName || `#${acc.id}`}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                        {/* ✅ Payment Method Select */}
                        {showPaymentSelect && (
                            <div className="flex flex-col gap-3 text-right mt-4">
                                <label className="font-semibold">نحوه پرداخت:</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="border rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-indigo-400"
                                >
                                    <option value="کارتخوان">کارتخوان</option>
                                    <option value="نقدی">نقدی</option>
                                    <option value="کارت به کارت">کارت به کارت</option>
                                </select>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex justify-center gap-4 mt-6">
                            <button
                                onClick={()=>{onCancel();setSearch("");}}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2 rounded-lg shadow-sm transition-all"
                            >
                                {cancelText}
                            </button>

                            <button
                                ref={confirmBtnRef}
                                onClick={()=>{handleConfirm();setSearch("");}}
                                className={`font-semibold px-5 py-2 rounded-lg text-white shadow-md transition-all
                  ${confirmColor === "red"
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
