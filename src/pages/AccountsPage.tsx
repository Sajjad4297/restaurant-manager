import { useEffect, useState } from "react";
import { getAccounts, addAccount, updateAccount, deleteAccount } from "../lib/db";
import { useNavigate } from "react-router-dom";
import type { Account } from '../types';
import { XIcon } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";

export const AccountsPage = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [form, setForm] = useState<Partial<Account>>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [modal, setModal] = useState<{ show: boolean; action?: () => void; title?: string; message?: string; confirmColor?: "red" | "green" | "amber" }>({ show: false });
    const navigate = useNavigate();

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        const data = await getAccounts();
        setAccounts(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.accountName) return alert("نام حساب الزامی است");
        if (!form.totalDebt) form.totalDebt = 0;

        if (editingId) await updateAccount(editingId, form);
        else await addAccount(form);

        setForm({});
        setEditingId(null);
        setShowForm(false);
        loadAccounts();
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
            message: `آیا از حذف حساب "${acc.accountName}" مطمئن هستید؟`,
            confirmColor: "red",
            action: async () => {
                await deleteAccount(acc.id!);
                loadAccounts();
            },
        });
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">حساب‌ها</h1>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative">
                        <button
                            onClick={() => { setShowForm(false); setEditingId(null); }}
                            className="absolute top-4 left-4 text-gray-500 hover:text-red-600"
                        >
                            <XIcon size={28} />
                        </button>
                        <h2 className="text-xl font-bold mb-4">{editingId ? "ویرایش حساب" : "افزودن حساب جدید"}</h2>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="block font-medium mb-1">نام حساب</label>
                                <input
                                    type="text"
                                    value={form.accountName || ""}
                                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">توضیحات</label>
                                <textarea
                                    value={form.description || ""}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            {!editingId && <div>
                                <label className="block font-medium mb-1">کل بدهی</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.totalDebt ?? 0}
                                    onChange={(e) => setForm({ ...form, totalDebt: parseFloat(e.target.value) })}
                                    className="w-full border rounded-lg p-2"
                                />
                            </div>
                            }                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="px-3 py-2 cursor-pointer rounded-lg bg-gray-200 hover:bg-gray-300"
                                >
                                    لغو
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 cursor-pointer rounded-lg bg-green-600 text-white hover:bg-green-700"
                                >
                                    {editingId ? "ویرایش" : "افزودن"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Account Button */}
            <div className="mb-6 w-full max-w-3xl flex justify-end">
                <button
                    onClick={() => { setShowForm(true); setForm({}); setEditingId(null); }}
                    className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
                >
                    افزودن حساب جدید
                </button>
            </div>

            {/* Accounts List */}
            <div className="grid gap-4 w-full max-w-3xl">
                {accounts.length === 0 && (
                    <p className="text-center text-gray-500 mt-6">حسابی وجود ندارد.</p>
                )}
                {accounts.map((acc) => (
                    <div
                        key={acc.id}
                        className="bg-white p-4 rounded-2xl shadow border border-gray-200 flex justify-between items-center relative hover:shadow-lg transition"
                    >
                        <div
                            className="absolute inset-0 cursor-pointer rounded-2xl"
                            onClick={() => navigate(`/accounts/${acc.id}/history`)}
                        ></div>

                        <div className="relative z-10">
                            <h2 className="font-semibold text-lg">{acc.accountName}</h2>
                            {acc.description && <p className="text-sm text-gray-500">{acc.description}</p>}
                            {acc.totalDebt > 0 ?
                                <p className="mt-1 text-gray-700">
                                    کل بدهی: <span className="font-medium text-red-600">{acc.totalDebt.toLocaleString()} تومان</span>
                                </p> :
                                <p className="mt-1 text-gray-700">
                                    کل طلب: <span className="font-medium text-green-600">{(acc.totalDebt * -1).toLocaleString()} تومان</span>
                                </p>

                            }
                        </div>

                        <div className="flex gap-2 relative z-10">
                            <button
                                onClick={() => handleEdit(acc)}
                                className="px-3 py-1 cursor-pointer text-sm rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
                            >
                                ویرایش
                            </button>
                            <button
                                onClick={() => handleDelete(acc)}
                                className="px-3 py-1 cursor-pointer text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
                            >
                                حذف
                            </button>
                        </div>
                    </div>
                ))}
            </div>

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
    );
};
