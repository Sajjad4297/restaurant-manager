// src/App.tsx
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { OrdersPage } from "./pages/OrdersPage";
import { MenuPage } from "./pages/MenuPage";
import { HistoryPage } from "./pages/HistoryPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewOrderPage } from "./pages/NewOrderPage";
import { AccountsPage } from "./pages/AccountsPage";
import { AccountHistoryPage } from "./pages/AccountHistoryPage";
import { BuysPage } from "./pages/BuysPage";
import { BuyHistoryPage } from "./pages/BuysHistory";
import { RawMaterialsPage } from "./pages/RawMaterialsPage";

const Layout = () => {


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
                    </div>
                    <NavLink
                        to="/accounts"
                        className={({ isActive }) =>
                            `hover:underline ${isActive ? "font-bold text-yellow-400" : ""}`
                        }
                    >
                        حساب ها
                    </NavLink>
                    <NavLink
                        to="/buys"
                        className={({ isActive }) =>
                            `hover:underline ${isActive ? "font-bold text-yellow-400" : ""}`
                        }
                    >
                        خرید ها
                    </NavLink>
                    <NavLink
                        to="/raw-materials"
                        className={({ isActive }) =>
                            `hover:underline ${isActive ? "font-bold text-yellow-400" : ""}`
                        }
                    >
                        مواد اولیه
                    </NavLink>

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
                    <Route path="/accounts" element={<AccountsPage />} />
                    <Route path="/accounts/:id/history" element={<AccountHistoryPage />} />
                    <Route path="/buys" element={<BuysPage />} />
                    <Route path="/buys/:id/history" element={<BuyHistoryPage />} />
                    <Route path="/raw-materials" element={<RawMaterialsPage />} />

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
