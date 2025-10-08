// src/pages/OrdersPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { OrderItem, FoodItem } from "../types";
import { getPendingOrders, addPaidOrder, deletePendingOrder, addUnpaidOrder } from "../lib/db";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";

export const OrdersPage = () => {
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const navigate = useNavigate();

    const [modal, setModal] = useState<{
        show: boolean;
        action?: () => void;
        title?: string;
        message?: string;
        confirmColor?: "red" | "green" | "amber";
    }>({ show: false });

    useEffect(() => {
        loadPendingOrders();
    }, []);

    async function loadPendingOrders() {
        try {
            const items = await getPendingOrders();
            items.map(item => {
                const time = new Date(item.date);
                item.time = time.getHours().toString()?.padStart(2, '0') + ":" + time.getMinutes().toString()?.padStart(2, '0') + ":" + time.getSeconds().toString()?.padStart(2, '0')
            })
            setOrderItems(items);
        } catch (error) {
            throw error;
        }
    }
    const submitPaidOrder = (item: any) => {
        setModal({
            show: true,
            title: "تأیید پرداخت",
            message: "آیا از پرداخت این سفارش مطمئن هستید؟",
            confirmColor: "green",
            action: async () => {
                try {
                    const date = new Date();
                    const paidDate = date.getTime();
                    item.paidDate = paidDate;
                    await addPaidOrder(item);
                    await loadPendingOrders();
                } catch (error) {
                    console.error(error);
                }
            },
        });
    };
    const submitUnpaidOrder = (item: any) => {
        setModal({
            show: true,
            title: "تأیید عدم پرداخت",
            message: "آیا مطمئن هستید که این سفارش پرداخت نشده است؟",
            confirmColor: "amber",
            action: async () => {
                try {
                    await addUnpaidOrder(item);
                    await loadPendingOrders();
                } catch (error) {
                    console.error(error);
                }
            },
        });
    };

    async function handleDelete(id: number) {
        setModal({
            show: true,
            title: "حذف سفارش",
            message: "آیا از حذف این سفارش مطمئن هستید؟",
            confirmColor: "red",
            action: async () => {
                try {
                    await deletePendingOrder(id);
                    await loadPendingOrders();
                } catch (err) {
                    console.error(err);
                    alert("خطا در حذف آیتم");
                }
            },
        });
    }

    return (
        <div className="p-6 flex flex-col items-center bg-gray-50 ">
            {/* Title / New Order Button */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">مدیریت سفارش‌ها</h1>
                <button
                    className="bg-amber-500 cursor-pointer hover:bg-amber-600 text-white px-6 py-2 rounded-xl shadow-md font-semibold transition-all"
                    onClick={() => navigate('/new-order')}
                >
                    سفارش جدید
                </button>
            </div>

            {/* Orders List */}
            {orderItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-lg font-medium">
                    در حال حاضر هیچ سفارشی وجود ندارد
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
                    {orderItems.map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-2xl relative shadow-md p-6 flex flex-col justify-between hover:shadow-xl transition-all"
                        >
                            {/* 🗑️ Delete Icon */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item.id);
                                }}
                                className="absolute top-2 cursor-pointer left-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                                title="حذف آیتم"
                            >
                                <Trash2 size={18} />
                            </button>

                            {/* <h1 className="font-bold absolute left-7 text-amber-500">{idx + 1}</h1> */}
                            <div className="mb-4">
                                <h3
                                    className="font-bold text-lg text-violet-800 mb-1"
                                >
                                    {item.name || "مشتری"}
                                </h3>
                            </div>

                            <div className="mb-4">
                                {item.foods.map((food: FoodItem, fIdx) => (
                                    <h3
                                        key={fIdx}
                                        className="font-bold text-lg text-gray-800 mb-1"
                                    >
                                        {food.quantity} × {food.title}
                                    </h3>
                                ))}
                            </div>

                            <div className="mt-auto flex flex-col gap-2">
                                <p className="text-green-600 font-semibold text-lg">
                                    مبلغ کل:{" "}
                                    <span className="text-xl">
                                        {item.totalPrice.toLocaleString()}
                                    </span>{" "}
                                    تومان
                                </p>
                                <p className="text-sm text-gray-500">
                                    زمان ثبت: {item.time}
                                </p>

                                <div className="flex gap-2 mt-3 flex-wrap">
                                    <button
                                        onClick={() => navigate('/new-order', { state: item })}
                                        className="w-full cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-medium shadow-sm transition-all">
                                        تغییر سفارش
                                    </button>
                                    <button
                                        onClick={() => submitPaidOrder(item)}
                                        className="flex-1 cursor-pointer bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium shadow-sm transition-all">
                                        پرداخت شد
                                    </button>
                                    <button
                                        onClick={() => submitUnpaidOrder(item)}
                                        className="flex-1 cursor-pointer bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium shadow-sm transition-all">
                                        پرداخت نشد
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ConfirmModal
                show={modal.show}
                title={modal.title}
                message={modal.message}
                confirmColor={modal.confirmColor}
                onCancel={() => setModal({ show: false })}
                onConfirm={() => {
                    modal.action?.();
                    setModal({ show: false });
                }}
            />

        </div>
    );
};
