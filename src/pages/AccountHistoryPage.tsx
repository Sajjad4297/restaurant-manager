// src/pages/AccountHistoryPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ShoppingBag, XIcon } from "lucide-react";
import {
    getAccountOrders,
    getAccountTransactions,
    addTransaction,
    updateAccountDebt,
    getAccounts,
    updateTransactionNote,
} from "../lib/db";
import type { OrderItem, Account, Transaction } from "../types";
import { ConfirmModal } from "../components/ConfirmModal";
import ReceiptModal from "../components/ReceiptModal";

//timer
const groupOrdersByMonth = (orders: OrderItem[]) => {
    const groups: Record<string, OrderItem[]> = {};

    orders.forEach((order) => {
        const orderDate = new Date(order.date);

        // Get month name
        const monthName = new Intl.DateTimeFormat("fa-IR-u-nu-latn", { month: "long" }).format(orderDate);
        // Get year
        const year = new Intl.DateTimeFormat("fa-IR-u-nu-latn", { year: "numeric" }).format(orderDate);

        const monthLabel = `${monthName} ${year}`; // Month first, then year

        if (!groups[monthLabel]) groups[monthLabel] = [];
        groups[monthLabel].push(order);
    });

    // Sort months newest first
    return Object.entries(groups).sort(
        (a, b) => new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime()
    );
};

export const AccountHistoryPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [account, setAccount] = useState<Account>();
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
    const [activeTab, setActiveTab] = useState<"orders" | "transactions">("orders");
    const [payAmount, setPayAmount] = useState("");
    const [modal, setModal] = useState<{ show: boolean; action?: () => void; title?: string; message?: string; confirmColor?: "red" | "green" | "amber" }>({ show: false });
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [noteInput, setNoteInput] = useState("");

    useEffect(() => {
        if (!id) return;
        loadAccount();
        loadOrders();
        loadTransactions();
    }, [id]);
    async function loadAccount() {
        const data = await getAccounts();
        const thisAccount = data.find((account: Account) => account.id == id)
        if (thisAccount) {
            setAccount(thisAccount);
        }
    }

    async function loadOrders() {
        const data = await getAccountOrders(Number(id));
        const formatted = data.map((o) => {
            const orderDate = new Date(o.date);
            const JTime = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
                dateStyle: "long",
                timeStyle: "medium",
            }).format(orderDate);
            return { ...o, time: JTime };
        });
        setOrders(formatted);
    }

    async function loadTransactions() {
        const data = await getAccountTransactions(Number(id));
        const formatted = data.map((t: any) => {
            const tDate = new Date(t.date);
            const JTime = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
                dateStyle: "long",
                timeStyle: "medium",
            }).format(tDate);
            return { ...t, time: JTime };
        });
        setTransactions(formatted);
    }

    async function handlePay() {
        if (!id || !account) return;
        const amount = Number(payAmount);
        if (!amount || amount <= 0) return alert("مبلغ نامعتبر است");

        const newDebt = account.totalDebt - amount;

        setModal({
            show: true,
            title: ` پرداخت بدهی "${account.accountName}"`,
            message: `آیا از پرداخت مبلغ ${amount} برای حساب  "${account.accountName}" مطمئن هستید؟`,
            confirmColor: "red",
            action: async () => {
                await addTransaction(Number(id), amount);
                await updateAccountDebt(Number(id), amount);
                setAccount({ ...account, totalDebt: newDebt });
                setPayAmount("");
                loadTransactions();
            },
        });

    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-row-reverse items-center justify-between mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                    بازگشت
                    <ArrowLeftIcon size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    حساب {account?.accountName}
                </h1>
            </div>

            {/* Debt and Payment */}
            <div className="bg-white rounded-2xl shadow p-5 mb-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {account && (account?.totalDebt >= 0 ?
                        <div className="text-lg text-gray-800 font-semibold">
                            بدهی کل:{" "}
                            <span className="text-red-600">
                                {account?.totalDebt?.toLocaleString() || 0} تومان
                            </span>
                        </div> :
                        <div className="text-lg text-gray-800 font-semibold">
                            طلب کل:{" "}
                            <span className="text-green-600">
                                {(account?.totalDebt * -1)?.toLocaleString() || 0} تومان
                            </span>
                        </div>

                    )}
                    <div className="flex flex-col sm:flex-row items-center gap-3 min-w-40 sm:w-auto mt-4">
                        <ReceiptModal accountName={account?.accountName || ""} accountId={Number(id)} />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 min-w-40 sm:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <p>پرداخت بدهی :</p>
                            <input
                                type="text"
                                placeholder="مبلغ پرداخت..."
                                value={payAmount}
                                onChange={(e) => {
                                    const inputData = Number(e.target.value);
                                    if (isNaN(inputData)) {
                                        e.preventDefault();
                                    } else
                                        setPayAmount(e.target.value)
                                }
                                }
                                className="border rounded-lg px-3 py-2 text-gray-700 min-w-75 sm:w-36 text-center"
                            />
                            <button
                                onClick={handlePay}
                                className="bg-green-500 cursor-pointer hover:bg-green-600 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
                            >
                                پرداخت
                            </button>
                        </div>

                        {/* Remaining debt info */}
                        {payAmount && (
                            <div className="text-sm mt-2 sm:mt-0 text-gray-700 text-center sm:text-right">
                                {Number(payAmount) > (account?.totalDebt || 0) ? (
                                    <span>
                                        طلب پس از پرداخت:{" "}
                                        <strong className="text-green-600">
                                            {
                                                (((account?.totalDebt || 0) - Number(payAmount)) * -1).toLocaleString()}{" "}
                                            تومان
                                        </strong>
                                    </span>
                                ) : (
                                    <span>
                                        بدهی پس از پرداخت:{" "}
                                        <strong className="text-red-600">
                                            {Math.max(
                                                (account?.totalDebt || 0) - Number(payAmount),
                                                0
                                            ).toLocaleString()}{" "}
                                            تومان
                                        </strong>
                                    </span>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-6">
                <div className="bg-white rounded-full shadow flex">
                    <button
                        onClick={() => setActiveTab("orders")}
                        className={`px-6 py-2 rounded-full font-semibold ${activeTab === "orders"
                            ? "bg-indigo-500 text-white"
                            : "text-gray-600 hover:text-indigo-600"
                            }`}
                    >
                        سفارشات
                    </button>
                    <button
                        onClick={() => setActiveTab("transactions")}
                        className={`px-6 py-2 rounded-full font-semibold ${activeTab === "transactions"
                            ? "bg-indigo-500 text-white"
                            : "text-gray-600 hover:text-indigo-600"
                            }`}
                    >
                        تراکنش‌ها
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === "orders" ? (
                <div className="bg-white rounded-2xl shadow p-4 border border-gray-100">
                    {orders.length === 0 ? (
                        <p className="text-center text-gray-500">سفارشی وجود ندارد.</p>
                    ) : (
                        <div className="overflow-x-auto flex justify-center pb-10">
                            <table className="w-full max-w-7xl bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                                <thead className="bg-indigo-100 text-gray-700 font-semibold">
                                    <tr>
                                        <th className="p-3 text-center">شناسه</th>
                                        <th className="p-3 text-center">نام</th>
                                        <th className="p-3 text-center">مبلغ کل</th>
                                        <th className="p-3 text-center">زمان</th>
                                        <th className="p-3 text-center">جزئیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupOrdersByMonth(orders).map(([monthLabel, monthOrders]) => (
                                        <React.Fragment key={monthLabel}>
                                            {/* Month Header */}
                                            <tr>
                                                <td colSpan={7} className="py-3 bg-linear-to-r from-indigo-100 via-indigo-50 to-indigo-100">
                                                    <div className="flex items-center justify-center relative">
                                                        <div className="absolute right-3 z-10 bg-white px-2 py-1 rounded-full shadow-sm border text-gray-700 font-bold ">
                                                            {monthOrders.length}x
                                                        </div>
                                                        <div className="absolute left-3 z-10 bg-white px-2 py-1 rounded-full shadow-sm border text-gray-700 font-bold ">
                                                            {monthOrders.reduce((acc, item) => acc + item.totalPrice, 0).toLocaleString()} تومان
                                                        </div>

                                                        <div className="absolute left-0 right-0 h-px bg-indigo-200" />
                                                        <span className="relative z-10 bg-white px-6 py-1 rounded-full shadow-sm border text-gray-700 font-bold text-lg">
                                                            {monthLabel}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Orders in this month */}
                                            {monthOrders.map((o) => (
                                                <tr key={o.id} className="hover:bg-gray-50">
                                                    <td className="p-3 text-center font-bold">#{o.id}</td>
                                                    <td className="p-3 text-center">{o.name || "—"}</td>
                                                    <td className="p-3 text-center font-semibold">{o.totalPrice.toLocaleString()} تومان</td>
                                                    <td className="p-3 text-center text-sm text-gray-500">{o.time}</td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            onClick={() => setSelectedOrder(o)}
                                                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm"
                                                        >
                                                            جزئیات
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow p-4 border border-gray-100">
                    {transactions.length === 0 ? (
                        <p className="text-center text-gray-500">تراکنشی وجود ندارد.</p>
                    ) : (
                        <table className="w-full border-collapse text-right text-gray-800">
                            <thead className="bg-green-100 text-gray-700 font-semibold">
                                <tr>
                                    <th className="p-3 text-center w-20">شناسه</th>
                                    <th className="p-3 text-center w-52">مبلغ</th>
                                    <th className="p-3 text-center w-52">زمان</th>
                                    <th className="p-3 text-center">توضیح</th>
                                    <th className="p-3 text-center w-30"></th>

                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-center font-bold">#{t.id}</td>
                                        <td className="p-3 text-center text-green-700 font-semibold">
                                            {t.amount.toLocaleString()} تومان
                                        </td>
                                        <td className="p-3 text-center text-sm text-gray-500">{t.time}</td>
                                        <td className="p-3 text-center  ">
                                            <p className="text-center">{t.note || "—"}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => setEditingTransaction(t)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg text-xs"
                                            >
                                                {t.note ? "ویرایش توضیح" : "افزودن توضیح"}
                                            </button>

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center animate-fadeIn justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 relative">
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="absolute cursor-pointer top-4 left-4 text-gray-600 hover:text-red-500 transition-all"
                        >
                            <XIcon size={28} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 border-b pb-4 text-gray-800">
                            جزئیات سفارش #{selectedOrder.id}
                        </h2>

                        <div className="space-y-3 text-gray-700 leading-relaxed">
                            <p>
                                <span className="font-semibold text-indigo-600">نام:</span>{" "}
                                {selectedOrder.name || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-indigo-600">شماره تماس:</span>{" "}
                                {selectedOrder.phone || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-indigo-600">آدرس:</span>{" "}
                                {selectedOrder.address || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-indigo-600">توضیحات:</span>{" "}
                                {selectedOrder.description || "—"}
                            </p>
                            {selectedOrder.isOutFood &&
                                <div className="bg-blue-500 text-white flex max-w-fit items-center gap-1 px-2 py-1 rounded-full text-sm shadow-sm">
                                    <ShoppingBag size={16} />
                                    <span>بیرون‌بر</span>
                                </div>
                            }
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold text-lg text-gray-800 mb-3">
                                اقلام سفارش:
                            </h3>
                            <ul className="divide-y divide-gray-200">
                                {selectedOrder.foods.map((food) => (
                                    <li
                                        key={food.id}
                                        className="flex justify-between py-2 text-gray-700"
                                    >
                                        <span>
                                            {food.quantity} × {food.title}
                                        </span>
                                        <span>{food.totalPrice.toLocaleString()} تومان</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-6 border-t pt-4 flex justify-between text-lg font-semibold text-gray-900">
                            <span>تعداد کل اقلام:</span>
                            <span>{selectedOrder.totalQuantity}</span>
                        </div>

                        <div className="mt-2 flex justify-between text-lg font-bold text-green-600">
                            <span>مبلغ نهایی:</span>
                            <span>{selectedOrder.totalPrice.toLocaleString()} تومان</span>
                        </div>
                        <div className="flex justify-between">
                            <p className="mt-4 text-gray-500 text-sm text-left">
                                زمان سفارش: {selectedOrder.time}
                            </p>

                            {selectedOrder.paidTime && (

                                <p className="mt-4 text-gray-500 text-sm text-left">
                                    زمان پرداخت: {selectedOrder.paidTime}
                                </p>
                            )}
                        </div>

                    </div>
                </div>
            )}


            <ConfirmModal
                show={modal.show}
                title={modal.title}
                message={modal.message}
                confirmColor={modal.confirmColor}
                onCancel={() => setModal({ show: false })}
                onConfirm={() => { modal.action?.(); setModal({ show: false }); }}
            />
            {editingTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md relative shadow-lg">
                        <button
                            onClick={() => setEditingTransaction(null)}
                            className="absolute top-4 left-4 text-gray-500 hover:text-red-600"
                        >
                            <XIcon size={28} />
                        </button>
                        <h2 className="text-xl font-bold mb-4">
                            {editingTransaction.note ? "ویرایش یادداشت" : "افزودن یادداشت"} تراکنش #{editingTransaction.id}
                        </h2>

                        <textarea
                            value={noteInput || editingTransaction.note || ""}
                            onChange={(e) => setNoteInput(e.target.value)}
                            className="w-full border rounded-lg p-2 mb-4"
                            placeholder="توضیح خود را وارد کنید..."
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingTransaction(null)}
                                className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                            >
                                لغو
                            </button>
                            <button
                                onClick={async () => {
                                    if (!editingTransaction) return;
                                    await updateTransactionNote(editingTransaction.id!, noteInput);
                                    setEditingTransaction(null);
                                    setNoteInput("");
                                    loadTransactions();
                                }}
                                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                            >
                                ذخیره
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
