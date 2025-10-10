import { useEffect, useState } from "react";
import { getDataFromYesterday } from "../lib/db";
import type { Stats } from "../types";

export const DashboardPage = () => {
    const [todayStats, setTodayStats] = useState<Stats[]>([]);
    const [yesterdayStats, setYesterdayStats] = useState<Stats[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getDataFromYesterday();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayUnix = Math.floor(today.getTime());

        const todayData = data.filter(item => item.date >= todayUnix);
        const yesterdayData = data.filter(item => item.date < todayUnix);

        setTodayStats(todayData);
        setYesterdayStats(yesterdayData);
    };

    const calcTotalPrice = (stats: Stats[]) =>
        stats.reduce((acc, item) => acc + item.totalPrice, 0);

    const calcTotalQuantity = (stats: Stats[]) =>
        stats.reduce((acc, item) => acc + item.totalQuantity, 0);

    const getTopSellingFood = (stats: Stats[]) => {
        const foodMap: Record<string, number> = {};
        stats.forEach(stat => {
            stat.foods.forEach(food => {
                if (food.type === "food") {
                    foodMap[food.title] = (foodMap[food.title] || 0) + food.quantity;
                }
            });
        });
        const sorted = Object.entries(foodMap).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0
            ? `${sorted[0][0]} (${sorted[0][1]} عدد)`
            : "هیچ غذایی فروخته نشده";
    };

    const getLowestSellingFood = (stats: Stats[]) => {
        const foodMap: Record<string, number> = {};
        stats.forEach(stat => {
            stat.foods.forEach(food => {
                if (food.type === "food") {
                    foodMap[food.title] = (foodMap[food.title] || 0) + food.quantity;
                }
            });
        });
        const sorted = Object.entries(foodMap).sort((a, b) => a[1] - b[1]);
        return sorted.length > 0
            ? `${sorted[0][0]} (${sorted[0][1]} عدد)`
            : "هیچ غذایی فروخته نشده";
    };

    const todayTotal = calcTotalPrice(todayStats);
    const yesterdayTotal = calcTotalPrice(yesterdayStats);
    const todayQty = calcTotalQuantity(todayStats);
    const yesterdayQty = calcTotalQuantity(yesterdayStats);

    const priceChange =
        yesterdayTotal === 0 ? 0 : ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
    const qtyChange =
        yesterdayQty === 0 ? 0 : ((todayQty - yesterdayQty) / yesterdayQty) * 100;

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 آمار فروش</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Sales */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg">
                    <p className="text-lg mb-2">فروش امروز</p>
                    <p className="text-3xl font-bold mb-1">
                        {todayTotal.toLocaleString()} تومان
                    </p>
                    <p className="text-sm opacity-90">
                        دیروز: {yesterdayTotal.toLocaleString()} تومان
                    </p>
                    <p
                        className={`mt-2 font-semibold ${priceChange >= 0 ? "text-green-200" : "text-red-200"
                            }`}
                    >
                        {priceChange >= 0 ? "⬆️ افزایش" : "⬇️ کاهش"}{" "}
                        {Math.abs(priceChange).toFixed(1)}٪
                        نسبت به دیروز
                    </p>
                </div>

                {/* Quantity */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
                    <p className="text-lg mb-2">تعداد غذاهای فروخته‌شده</p>
                    <p className="text-3xl font-bold mb-1">{todayQty} عدد</p>
                    <p className="text-sm opacity-90">دیروز: {yesterdayQty} عدد</p>
                    <p
                        className={`mt-2 font-semibold ${qtyChange >= 0 ? "text-green-200" : "text-red-200"
                            }`}
                    >
                        {qtyChange >= 0 ? "⬆️ افزایش" : "⬇️ کاهش"}{" "}
                        {Math.abs(qtyChange).toFixed(1)}٪
                        نسبت به دیروز
                    </p>
                </div>

                {/* Top & Lowest */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-500 to-pink-500 text-white shadow-lg">
                    <p className="text-lg">پرفروش‌ترین غذای امروز</p>
                    <p className="text-xl font-bold mt-1">{getTopSellingFood(todayStats)}</p>
                    <hr className="my-3 border-white/30" />
                    <p className="text-lg">کم‌فروش‌ترین غذای امروز</p>
                    <p className="text-xl font-bold mt-1">{getLowestSellingFood(todayStats)}</p>
                </div>
            </div>
        </div>
    );
};
