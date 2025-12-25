import { useState, useEffect } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { getAccountOrdersForReceipt } from "../lib/db";
import type { FoodItem, OrderItem } from "../types";
import "react-multi-date-picker/styles/layouts/mobile.css"; // Optional: better for small windows
import "react-multi-date-picker/styles/layouts/prime.css";
// OR the standard one:
import "react-multi-date-picker/styles/colors/purple.css";
// Convert Unix (ms) to Persian date string
const unixToPersianDate = (unix: string): string => {
    const date = new Date(unix);
    const persianDate = new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
    const time = new Intl.DateTimeFormat("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
    return `${persianDate} ساعت ${time}`;
};

// Format price with Persian/Arabic digits and commas
const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("fa-IR").format(Math.round(price));
};

// Format Persian date without time

export default function ReceiptModal({
    accountName,
    accountId,
}: {
    accountName: string;
    accountId: number;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [dateRange, setDateRange] = useState<any>([]);
    const [printData, setPrintData] = useState<{
        accountName: string;
        accountId: number;
        from: string;
        to: string;
        orders: OrderItem[];
        totals: {
            totalItems: number;
            totalQuantity: number;
            totalPrice: number;
            orderCount: number;
        };
    } | null>(null);

    const getTimestamps = () => {
        if (!dateRange || dateRange.length !== 2) return null;
        const from = dateRange[0].toDate().getTime();
        const to = new Date(
            dateRange[1].toDate().setHours(23, 59, 59, 999)
        ).getTime();
        return { from, to };
    };

    const handleConfirm = async () => {
        const ts = getTimestamps();
        if (!ts) return alert("لطفاً بازه تاریخ را انتخاب کنید");

        const orders = await getAccountOrdersForReceipt(accountId, ts.from, ts.to);

        if (orders.length === 0) {
            alert("هیچ سفارشی در این بازه یافت نشد.");
            return;
        }

        // Calculate totals
        const totals = {
            totalItems: orders.reduce((sum, order) => sum + order.foods.length, 0),
            totalQuantity: orders.reduce((sum, order) => sum + order.totalQuantity, 0),
            totalPrice: orders.reduce((sum, order) => sum + order.totalPrice, 0),
            orderCount: orders.length,
        };

        setPrintData({
            accountName,
            accountId,
            from: dateRange[0].format("YYYY/MM/DD"),
            to: dateRange[1].format("YYYY/MM/DD"),
            orders,
            totals,
        });

        setIsOpen(false);
    };
    const handleClose = () => {
        setIsOpen(false);
        setDateRange([]);
    };
    useEffect(() => {
        if (printData) {
            setTimeout(() => {
                window.print();
                setPrintData(null);
                setDateRange([]);
            }, 200);
        }
    }, [printData]);

    return (
        <>
            {/* Printable Receipt */}
            {printData && (
                <div className="print-wrapper">
                    <div className="print-receipt font-sans text-xs p-1 w-[80mm]">
                        <div className="text-center mb-1">
                            <div className="font-bold text-sm">رستوران سینا</div>
                            <div>حساب {printData.accountName}</div>
                            <div>تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}</div>
                            <hr className="my-1" />
                        </div>

                        {/* جدول تیتر */}
                        <div className="text-right text-[9px] mb-1">*قیمت‌ها به تومان هستند</div>
                        <table className="w-full border-collapse text-xs mb-1">
                            <thead>
                                <tr>
                                    <th className="border px-1 text-center">تاریخ</th>
                                    <th className="border px-1 text-center">نام غذا</th>
                                    <th className="border px-1 text-center">تعداد</th>
                                    <th className="border px-1 text-center">قیمت واحد</th>
                                    <th className="border px-1 text-center">جمع</th>
                                    <th className="border px-1 text-center">جمع سفارش</th>
                                </tr>
                            </thead>
                            <tbody>
                                {printData.orders.map((order, idx) =>
                                    order.foods.map((item: FoodItem, itemIdx) => (
                                        <tr
                                            key={`${idx}-${itemIdx}`}
                                            className={" " + (idx % 2 === 0 ? "bg-gray-200" : "bg-white")}

                                        >
                                            {itemIdx === 0 && (
                                                <td className="border-thin px-1 text-center" rowSpan={order.foods.length}>
                                                    {unixToPersianDate(order.time as any)}
                                                </td>
                                            )}

                                            <td className="border-thin px-1 text-center">{item.title}</td>
                                            <td className="border-thin px-1 text-center">{item.quantity?.toLocaleString('fa-IR')}</td>
                                            <td className="border-thin px-1 text-center">{formatPrice(item.totalPrice / item.quantity)}</td>
                                            <td className="border-thin px-1 text-center">{formatPrice(item.totalPrice)}</td>
                                            {itemIdx === 0 && (
                                                <td className="border-thin px-1 text-center font-bold" rowSpan={order.foods.length}>
                                                    {formatPrice(order.totalPrice)}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* فاصله بین سفارش‌ها */}
                        <div className="mb-2"></div>

                        <hr className="my-1" />
                        <div className="text-center text-sm font-bold">
                            جمع کل سفارش‌ها:{" "}
                            {formatPrice(printData.orders.reduce((sum, o) => sum + o.totalPrice, 0))} تومان
                        </div>
                        <div className="mt-1 text-center text-[9px]">
                            با تشکر از انتخاب شما - رستوران سینا
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Trigger */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex cursor-pointer items-center gap-2 bg-linear-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V8.414a1 1 0 00-.293-.707l-3.414-3.414A1 1 0 0011.586 4H5zm1 11V6h4v2a1 1 0 001 1h2v6H6z" clipRule="evenodd" />
                </svg>
                دریافت رسید
            </button>

            {/* Date Picker Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-96 max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">انتخاب بازه تاریخ</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <DatePicker
                            range
                            calendar={persian}
                            locale={persian_fa}
                            value={dateRange}
                            onChange={setDateRange}
                            calendarPosition="bottom-right"
                            inputClass="w-full px-4 py-3 border-2 cursor-pointer border-gray-200 rounded-xl text-center text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                            placeholder="📅 انتخاب بازه تاریخ"
                        />

                        {dateRange && dateRange.length === 2 && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-green-700 font-medium">بازه انتخاب شده:</span>
                                    <span className="text-gray-700 font-semibold">
                                        {dateRange[0].format("YYYY/MM/DD")} تا {dateRange[1].format("YYYY/MM/DD")}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                            <button
                                onClick={handleClose}
                                className="px-5 py-2.5 cursor-pointer text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            >
                                لغو
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!dateRange || dateRange.length !== 2}
                                className="px-5 py-2.5 cursor-pointer bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                مشاهده و چاپ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Styles */}
            <style {...{ jsx: true } as any}>{`
        @media screen { .print-wrapper { display: none; } }
        @media print {
        border-thin {
            border-width: thin; /* typically 0.5px */
        }
          body * { visibility: hidden; }
          @page {
              margin: 0; /* This hides the URL, Date, and Title */
              size: 80mm auto; /* Sets width to 80mm and height to auto-expand */
          }
          .print-wrapper, .print-wrapper * { visibility: visible; }
          .print-wrapper { position: absolute; top: 0; left: 0; width: 80mm; font-size: 10pt; line-height: 1.2;margin: 0; }
          table { width: 100%; border-collapse: collapse; }
          td, th { border: 1px solid #000; padding: 2px 4px; }
          .page-break-avoid { page-break-inside: avoid; }
          .gray-row {background-color:gray}
        }
      `}</style>
        </>
    );
}
