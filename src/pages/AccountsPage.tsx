import { useEffect, useState } from "react";
import { getAccounts, addAccount, updateAccount, deleteAccount } from "../lib/db";
import { useNavigate } from "react-router-dom";
import type { Account } from '../types';
import { XIcon, PlusIcon, Edit3Icon, Trash2Icon, ArrowLeftRight } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";

export const AccountsPage = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [form, setForm] = useState<Partial<Account>>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState<{ show: boolean; action?: () => void; title?: string; message?: string; confirmColor?: "red" | "green" | "amber" }>({ show: false });
    const navigate = useNavigate();

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setIsLoading(true);
        try {
            const data = await getAccounts();
            setAccounts(data);
        } catch (error) {
            console.error("Error loading accounts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.accountName?.trim()) {
            alert("نام حساب الزامی است");
            return;
        }
        if (!form.totalDebt) form.totalDebt = 0;

        setIsLoading(true);
        try {
            if (editingId) await updateAccount(editingId, form);
            else await addAccount(form);

            setForm({});
            setEditingId(null);
            setShowForm(false);
            await loadAccounts();
        } catch (error) {
            console.error("Error saving account:", error);
            alert("خطا در ذخیره‌سازی حساب");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (acc: Account) => {
        setForm(acc);
        setEditingId(acc.id!);
        setShowForm(true);
    };

    const handleDelete = (acc: Account) => {
        setModal({
            show: true,
            title: "حذف حساب",
            message: `آیا از حذف حساب "${acc.accountName}" مطمئن هستید؟ این عمل غیرقابل بازگشت است.`,
            confirmColor: "red",
            action: async () => {
                setIsLoading(true);
                try {
                    await deleteAccount(acc.id!);
                    await loadAccounts();
                } catch (error) {
                    console.error("Error deleting account:", error);
                    alert("خطا در حذف حساب");
                } finally {
                    setIsLoading(false);
                }
            },
        });
    };

    const getDebtColor = (amount: number) => {
        return amount >= 0 ? "text-red-600" : "text-green-600";
    };

    const getDebtBackground = (amount: number) => {
        return amount >= 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-l from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                        مدیریت حساب‌ها
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        مدیریت و پیگیری حساب‌های مالی خود را در این بخش انجام دهید
                    </p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">تعداد حساب‌ها</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{accounts.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <ArrowLeftRight className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">مجموع بدهی</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {accounts
                                        .filter(acc => acc.totalDebt >= 0)
                                        .reduce((sum, acc) => sum + (acc.totalDebt || 0), 0)
                                        .toLocaleString()} تومان
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <span className="text-red-600 font-bold">↓</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">مجموع طلب</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {accounts
                                        .filter(acc => acc.totalDebt < 0)
                                        .reduce((sum, acc) => sum + Math.abs(acc.totalDebt || 0), 0)
                                        .toLocaleString()} تومان
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <span className="text-green-600 font-bold">↑</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Account Button */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex-1"></div>
                    <button
                        onClick={() => { setShowForm(true); setForm({}); setEditingId(null); }}
                        disabled={isLoading}
                        className="flex items-center cursor-pointer gap-2 bg-gradient-to-l from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        <PlusIcon size={20} />
                        افزودن حساب جدید
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && accounts.length === 0 && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Accounts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {accounts.length === 0 && !isLoading && (
                        <div className="col-span-full text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <ArrowLeftRight className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">حسابی وجود ندارد</h3>
                            <p className="text-gray-500 mb-4">برای شروع، اولین حساب خود را ایجاد کنید</p>
                        </div>
                    )}

                    {accounts.map((acc) => (
                        <div
                            key={acc.id}
                            className={`bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group cursor-pointer ${getDebtBackground(acc.totalDebt || 0)}`}
                            onClick={() => navigate(`/accounts/${acc.id}/history`)}
                        >
                            {/* Account Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-bold text-xl text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                        {acc.accountName}
                                    </h2>
                                    {acc.description && (
                                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                            {acc.description}
                                        </p>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div
                                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => handleEdit(acc)}
                                        disabled={isLoading}
                                        className="p-2 rounded-lg cursor-pointer bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors disabled:opacity-50"
                                    >
                                        <Edit3Icon size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(acc)}
                                        disabled={isLoading}
                                        className="p-2 rounded-lg cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                                    >
                                        <Trash2Icon size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Debt Amount */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                {acc.totalDebt >= 0 ? (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-600">کل بدهی:</span>
                                        <span className={`font-bold text-lg ${getDebtColor(acc.totalDebt || 0)}`}>
                                            {acc.totalDebt.toLocaleString()} تومان
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-600">کل طلب:</span>
                                        <span className={`font-bold text-lg ${getDebtColor(acc.totalDebt || 0)}`}>
                                            {Math.abs(acc.totalDebt || 0).toLocaleString()} تومان
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add/Edit Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                        <div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="border-b border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editingId ? "ویرایش حساب" : "افزودن حساب جدید"}
                                    </h2>
                                    <button
                                        onClick={() => { setShowForm(false); setEditingId(null); }}
                                        disabled={isLoading}
                                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                    >
                                        <XIcon size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto">
                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-2">
                                            نام حساب
                                            <span className="text-red-500 mr-1">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.accountName || ""}
                                            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="نام حساب را وارد کنید"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-2">
                                            توضیحات
                                        </label>
                                        <textarea
                                            value={form.description || ""}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                            placeholder="توضیحات اختیاری"
                                            rows={3}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {!editingId && (
                                        <div>
                                            <label className="block font-semibold text-gray-700 mb-2">
                                                کل بدهی
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={form.totalDebt ?? 0}
                                                onChange={(e) => setForm({ ...form, totalDebt: parseFloat(e.target.value) || 0 })}
                                                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="0"
                                                disabled={isLoading}
                                            />
                                            <p className="text-sm text-gray-500 mt-1">برای طلب، عدد منفی وارد کنید</p>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => { setShowForm(false); setEditingId(null); }}
                                            disabled={isLoading}
                                            className="px-6 py-3 cursor-pointer rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                                        >
                                            لغو
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading || !form.accountName?.trim()}
                                            className="px-6 py-3 cursor-pointer rounded-xl bg-gradient-to-l from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? "در حال ذخیره..." : editingId ? "ویرایش حساب" : "افزودن حساب"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Modal */}
                <ConfirmModal
                    show={modal.show}
                    title={modal.title}
                    message={modal.message}
                    confirmColor={modal.confirmColor}
                    onCancel={() => setModal({ show: false })}
                    onConfirm={() => { modal.action?.(); setModal({ show: false }); }}
                />
            </div>
        </div>
    );
};
