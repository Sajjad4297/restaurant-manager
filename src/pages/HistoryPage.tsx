// src/pages/HistoryPage.tsx
import React, { useEffect, useState } from "react";
import { addPaidOrderFromUnpaid, getPaidOrders, getUnpaidOrders } from "../lib/db";
import type { Account, OrderItem } from "../types";
import { XIcon } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";

const groupOrdersByDay = (orders: OrderItem[]) => {
    const groups: Record<string, OrderItem[]> = {};

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayUnix = now.getTime();
    const yesterdayUnix = todayUnix - 86400000; // one day in ms

    orders.forEach((order) => {
        const orderDate = new Date(order.date);
        const orderDay = new Date(orderDate);
        orderDay.setHours(0, 0, 0, 0);
        const keyUnix = orderDay.getTime();

        let label = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
            dateStyle: "long",
        }).format(orderDate);

        if (keyUnix === todayUnix) label = "امروز";
        else if (keyUnix === yesterdayUnix) label = "دیروز";

        if (!groups[label]) groups[label] = [];
        groups[label].push(order);
    });

    // Sort days newest first
    return Object.entries(groups).sort(
        (a, b) => new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime()
    );
};

export const HistoryPage = () => {
    const [paidOrders, setPaidOrders] = useState<OrderItem[]>([]);
    const [unpaidOrders, setUnpaidOrders] = useState<OrderItem[]>([]);
    const [showPaid, setShowPaid] = useState(false); // default: show unpaid
    const [showDetails, setShowDetails] = useState<OrderItem | null>();
    useEffect(() => {
        loadOrders();
    }, []);

    const [modal, setModal] = useState<{
        show: boolean;
        action?: (account?: Account | null, paymentMethod?: string) => Promise<void> | void;
        title?: string;
        message?: any;
        confirmColor?: "red" | "green" | "amber";
    }>({ show: false });

    async function loadOrders() {
        try {
            const paidItems = await getPaidOrders();
            const unpaidItems = await getUnpaidOrders();

            const formatOrders = (orders: OrderItem[]) =>
                orders.map((order) => {
                    const time = new Date(order.date);
                    let JPaidTime;
                    const JTime = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { dateStyle: 'long', timeStyle: 'medium' }).format(time);
                    if (order.paidDate) {
                        const paidTime = new Date(order.paidDate);
                        JPaidTime = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { dateStyle: 'long', timeStyle: 'medium' }).format(paidTime);
                    }
                    return {
                        ...order,
                        time: JTime,
                        paidTime: JPaidTime
                    };
                });

            setPaidOrders(formatOrders(paidItems));
            setUnpaidOrders(formatOrders(unpaidItems));
            if (unpaidItems.length == 0) setShowPaid(true);
        } catch (error) {
            console.error("Error loading orders:", error);
        }
    }

    const displayedOrders = showPaid ? paidOrders : unpaidOrders;

    const submitPaidOrder = (item: any) => {
        setModal({
            show: true,
            title: "تأیید پرداخت",
            message: "آیا از پرداخت این سفارش مطمئن هستید؟",
            confirmColor: "green",
            action: async (_?: Account | null, selectedPaymentMethod?: string) => {
                try {
                    const date = new Date();
                    const paidDate = date.getTime();
                    item.paidDate = paidDate;
                    item.paymentMethod = selectedPaymentMethod || "کارتخوان";
                    await addPaidOrderFromUnpaid(item);
                    await loadOrders();
                    console.log("✅ Payment method saved:", selectedPaymentMethod);
                } catch (error) {
                    console.error(error);
                }
            },
        });
    };

    return (
        <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex flex-col items-center">
            <h2 className="text-4xl font-bold mb-8 text-gray-800 drop-shadow-sm">
                سوابق سفارش‌ها
            </h2>

            {/* Toggle between Paid / Unpaid */}
            <div className="flex items-center gap-4 mb-8 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border">
                <span
                    className={`font-semibold transition-all ${showPaid ? "text-green-600" : "text-gray-500"
                        }`}
                >
                    پرداخت شده
                </span>

                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showPaid}
                        onChange={() => setShowPaid(!showPaid)}
                        className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-red-400 peer-focus:outline-none rounded-full peer peer-checked:bg-green-400 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-6 shadow-inner"></div>
                </label>

                <span
                    className={`font-semibold transition-all ${!showPaid ? "text-red-600" : "text-gray-500"
                        }`}
                >
                    پرداخت نشده
                </span>
            </div>

            {/* Orders table */}
            <div className="w-full max-w-7xl bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <table className="w-full border-collapse text-right text-gray-800">
                    <thead className="bg-indigo-100 text-gray-700 font-semibold text-lg">
                        <tr>
                            <th className="p-3 text-center">شناسه</th>
                            <th className="p-3 text-center">نام</th>
                            <th className="p-3 text-center">مبلغ کل</th>{showPaid &&
                                <th className="p-3 text-center">نحوه پرداخت</th>
                            }<th className="p-3 text-center">
                                {showPaid ? "زمان پرداخت" : "زمان ثبت سفارش"}
                            </th>
                            <th className="p-3 text-center">جزئیات</th>
                            {!showPaid && <th className="p-3 text-center">عملیات</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {displayedOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-6 text-center text-gray-500 font-medium">
                                    {showPaid
                                        ? "هیچ سفارش پرداخت‌شده‌ای وجود ندارد."
                                        : "هیچ سفارش پرداخت‌نشده‌ای وجود ندارد."}
                                </td>
                            </tr>
                        ) : (
                            groupOrdersByDay(displayedOrders).map(([label, orders]) => (
                                <React.Fragment key={label}>
                                    {/* --- Section Header --- */}
                                    <tr>
                                        <td colSpan={7} className="py-3 bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100">
                                            <div className="flex items-center justify-center relative">
                                                <div className="absolute right-3 z-10 bg-white px-2 py-1 rounded-full shadow-sm border text-gray-700 font-bold ">
                                                    {orders.length}x
                                                </div>
                                                <div className="absolute left-3 z-10 bg-white px-2 py-1 rounded-full shadow-sm border text-gray-700 font-bold ">
                                                    {orders.reduce((acc, item) => acc + item.totalPrice, 0).toLocaleString()} تومان
                                                </div>

                                                <div className="absolute left-0 right-0 h-px bg-indigo-200" />
                                                <span className="relative z-10 bg-white px-6 py-1 rounded-full shadow-sm border text-gray-700 font-bold text-lg">
                                                    {label}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* --- Orders in this day --- */}
                                    {orders.map((o, i) => (
                                        <tr
                                            key={o.id}
                                            className={`hover:bg-gray-50 transition-all ${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                }`}
                                        >
                                            <td className="p-3 text-center font-bold text-gray-900">#{o.id}</td>
                                            <td className="p-3 text-center">{o.name || "—"}</td>
                                            <td className="p-3 text-center font-semibold text-gray-700">
                                                {o.totalPrice.toLocaleString()} تومان
                                            </td>

                                            {showPaid &&
                                                <td className="p-3 text-center">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-sm font-bold ${showPaid
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-600"
                                                            }`}
                                                    >
                                                        {o.paymentMethod}
                                                    </span>
                                                </td>}
                                            <td className="p-3 text-center text-gray-500 text-sm">
                                                {showPaid ? o.paidTime : o.time}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => setShowDetails(o)}
                                                    className="bg-amber-500 cursor-pointer hover:bg-amber-600 text-white px-5 py-2 rounded-lg shadow-md font-semibold transition-all"
                                                >
                                                    مشاهده جزئیات
                                                </button>
                                            </td>
                                            {!showPaid && (
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => submitPaidOrder(o)}
                                                        className="bg-green-500 cursor-pointer hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow-md font-medium transition-all"
                                                    >
                                                        پرداخت شد
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {showDetails && (
                <div className="fixed inset-0 z-50 flex items-center animate-fadeIn justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 relative">
                        <button
                            onClick={() => setShowDetails(null)}
                            className="absolute cursor-pointer top-4 left-4 text-gray-600 hover:text-red-500 transition-all"
                        >
                            <XIcon size={28} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 border-b pb-4 text-gray-800">
                            جزئیات سفارش #{showDetails.id}
                        </h2>

                        <div className="space-y-3 text-gray-700 leading-relaxed">
                            <p>
                                <span className="font-semibold text-indigo-600">نام:</span>{" "}
                                {showDetails.name || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-indigo-600">شماره تماس:</span>{" "}
                                {showDetails.phone || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-indigo-600">آدرس:</span>{" "}
                                {showDetails.address || "—"}
                            </p>
                            <p>
                                <span className="font-semibold text-indigo-600">توضیحات:</span>{" "}
                                {showDetails.description || "—"}
                            </p>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <h3 className="font-bold text-lg text-gray-800 mb-3">
                                اقلام سفارش:
                            </h3>
                            <ul className="divide-y divide-gray-200">
                                {showDetails.foods.map((food) => (
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
                            <span>{showDetails.totalQuantity}</span>
                        </div>

                        <div className="mt-2 flex justify-between text-lg font-bold text-green-600">
                            <span>مبلغ نهایی:</span>
                            <span>{showDetails.totalPrice.toLocaleString()} تومان</span>
                        </div>
                        <div className="flex justify-between">
                            <p className="mt-4 text-gray-500 text-sm text-left">
                                زمان سفارش: {showDetails.time}
                            </p>

                            {showDetails.paidTime && (

                                <p className="mt-4 text-gray-500 text-sm text-left">
                                    زمان پرداخت: {showDetails.paidTime}
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
                showPaymentSelect={modal.title === "تأیید پرداخت"} // ✅ Only show payment selector in paid confirmation
                onCancel={() => {setModal({ show: false })}}
                onConfirm={async (selectedAccount, selectedPaymentMethod) => {
                    await modal.action?.(selectedAccount ?? null, selectedPaymentMethod);
                    setModal({ show: false });
                }}
            />

        </div>
    );
};
