import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import moment from "moment-jalaali";
import type { OrderItem, FoodItem } from "../types";

type ChartData = {
    name: string;
    foodSales: number;
    drinkSales: number;
    breakdown: {
        [title: string]: { quantity: number; type: "food" | "drink"; totalPrice?: number };
    };
};

export const MonthlySalesChart = ({ sales }: { sales: OrderItem[] }) => {
    const [chartData, setChartData] = useState<ChartData[]>([]);

    useEffect(() => {
        if (!sales || sales.length === 0) return;

        const now = moment();
        const currentYear = now.jYear();
        const currentMonth = now.jMonth();
        const daysInMonth = moment.jDaysInMonth(currentYear, currentMonth);

        const dailySummary: Record<number, ChartData> = {};
        for (let d = 1; d <= daysInMonth; d++) {
            dailySummary[d] = {
                name: d.toString(),
                foodSales: 0,
                drinkSales: 0,
                breakdown: {},
            };
        }

        for (const order of sales) {
            const m = moment(order.date);
            const orderDay = m.jDate();
            const summary = dailySummary[orderDay];
            if (!summary) continue;

            for (const item of order.foods as FoodItem[]) {
                // Fix missing type
                const itemType: "food" | "drink" =
                    item.type || (item.title?.includes("چلو") ? "food" : "drink");

                if (itemType === "food") summary.foodSales += item.totalPrice;
                else summary.drinkSales += item.totalPrice;

                if (summary.breakdown[item.title]) {
                    summary.breakdown[item.title].quantity += item.quantity;
                    summary.breakdown[item.title].totalPrice! += item.totalPrice;
                } else {
                    summary.breakdown[item.title] = {
                        quantity: item.quantity,
                        type: itemType,
                        totalPrice: item.totalPrice,
                    };
                }
            }
        }

        setChartData(Object.values(dailySummary));
    }, [sales]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || payload.length === 0) return null;

        const data: ChartData = payload[0].payload;
        const total = data.foodSales + data.drinkSales;

        const items = Object.entries(data.breakdown);
        const foodItems = items
            .filter(([, d]) => d.type === "food")
            .sort((a, b) => b[1].quantity - a[1].quantity); // sort by quantity descending
        const drinkItems = items
            .filter(([, d]) => d.type === "drink")
            .sort((a, b) => b[1].quantity - a[1].quantity);

        return (
            <div className="bg-white border border-gray-300 rounded-lg shadow-md p-3 min-w-[240px]">
                <p className="font-bold text-gray-800 mb-2">روز {label} ام</p>
                <p className="text-gray-700 mb-1">کل فروش: {total.toLocaleString()} تومان</p>
                <p className="text-green-600 mb-1">غذا: {data.foodSales.toLocaleString()} تومان</p>
                <p className="text-blue-600 mb-2">نوشیدنی: {data.drinkSales.toLocaleString()} تومان</p>
                <hr className="my-2" />

                {foodItems.length > 0 && (
                    <div className="mb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <span className="font-semibold text-gray-700">غذاها</span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {foodItems.map(([title, d]) => (
                                <li key={title} className="flex justify-between">
                                    <span>{title}</span>
                                    <span>
                                        {d.quantity} عدد | {d.totalPrice?.toLocaleString()} تومان
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {drinkItems.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                            <span className="font-semibold text-gray-700">نوشیدنی‌ها</span>
                        </div>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {drinkItems.map(([title, d]) => (
                                <li key={title} className="flex justify-between">
                                    <span>{title}</span>
                                    <span>
                                        {d.quantity} عدد | {d.totalPrice?.toLocaleString()} تومان
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full p-4 bg-white rounded-2xl shadow">
            <h2 className="text-xl font-semibold mb-3 text-center">
                فروش روزانه ماه جاری
            </h2>

            {chartData.length === 0 ? (
                <p className="text-center text-gray-500">داده‌ای برای نمایش وجود ندارد</p>
            ) : (
                <>
                    <p className="text-left text-gray-500 text-sm mb-1">واحد: میلیون تومان</p>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 20, left: 60, bottom: 20 }} // <-- left margin added
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis
                                tick={{ fill: "#6B7280", textAnchor: "start" }} // <-- right-align

                                tickFormatter={(v) => (v / 1_000_000).toLocaleString("fa-IR")}


                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="foodSales" stackId="a" fill="#22c55e" name="غذا" />
                            <Bar dataKey="drinkSales" stackId="a" fill="#3b82f6" name="نوشیدنی" />
                        </BarChart>
                    </ResponsiveContainer>
                </>
            )}
        </div>
    );
};
