// src/App.tsx
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { OrdersPage } from "./pages/OrdersPage";
import { MenuPage } from "./pages/MenuPage";
import { HistoryPage } from "./pages/HistoryPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewOrderPage } from "./pages/NewOrderPage";
import { getUnpaidCount } from "./lib/db"; // <-- add this import
import { useEffect, useState } from "react";

const Layout = () => {
    const [historyCount, setHistoryCount] = useState<number>(0);

    useEffect(() => {
        const loadCount = async () => {
            const count = await getUnpaidCount();
            setHistoryCount(count);
        };
        loadCount();
        const interval = setInterval(loadCount, 5000); // every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-screen flex flex-col bg-gray-100 font-[Vazirmatn]" dir="rtl">
            <header className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center flex-row-reverse">
                <h1 className="text-2xl font-bold">🍽 مدیریت رستوران</h1>
                <nav className="flex gap-6 text-lg">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `hover:underline ${isActive ? "font-bold text-yellow-400" : ""}`
                        }
                    >
                        داشبورد
                    </NavLink>
                    <NavLink
                        to="/orders"
                        className={({ isActive }) =>
                            `hover:underline ${isActive ? "font-bold text-yellow-400" : ""}`
                        }
                    >
                        سفارش‌ها
                    </NavLink>
                    <NavLink
                        to="/menu"
                        className={({ isActive }) =>
                            `hover:underline ${isActive ? "font-bold text-yellow-400" : ""}`
                        }
                    >
                        منو
                    </NavLink>

                    {/* تاریخچه + badge */}
                    <div className="relative">
                        <NavLink
                            to="/history"
                            className={({ isActive }) =>
                                `hover:underline ${isActive ? "font-bold text-yellow-400" : ""}`
                            }
                        >
                            تاریخچه
                        </NavLink>
                        {historyCount > 0 && (
                            <span className="absolute -top-2 -left-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {historyCount}
                            </span>
                        )}
                    </div>
                </nav>
            </header>

            {/* محتوای اصلی */}
            <main className="flex-1 p-6 overflow-y-auto font-[Vazirmatn]">
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/new-order" element={<NewOrderPage />} />
                    <Route path="/menu" element={<MenuPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="*" element={<h2 className="text-red-600">صفحه پیدا نشد (۴۰۴)</h2>} />
                </Routes>
            </main>
        </div>
    );
};

export default function App() {
    return (
        <Router>
            <Layout />
        </Router>
    );
}
