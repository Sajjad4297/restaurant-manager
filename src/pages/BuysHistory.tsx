// src/pages/BuyHistoryPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, XIcon, CreditCard, CheckCircle, PlusIcon, Edit3Icon, SaveIcon } from "lucide-react";
import {
    getBuyProducts,
    getSuppliers,
    addProductToBuy,
    updateProduct,
    getBuyTransactions,
    addBuyTransaction,
    updateBuyTransactionNote,
    updateBuyDebt
} from "../lib/db";
import type { Buy, Product, Transaction } from "../types";
import { ConfirmModal } from "../components/ConfirmModal";

const groupProductsByMonth = (products: Product[]) => {
    const groups: Record<string, Product[]> = {};

    products.forEach((product) => {
        const productDate = new Date(product.date || new Date());

        // Get month name
        const monthName = new Intl.DateTimeFormat("fa-IR-u-nu-latn", { month: "long" }).format(productDate);
        // Get year
        const year = new Intl.DateTimeFormat("fa-IR-u-nu-latn", { year: "numeric" }).format(productDate);

        const monthLabel = `${monthName} ${year}`;

        if (!groups[monthLabel]) groups[monthLabel] = [];
        groups[monthLabel].push(product);
    });

    // Sort months newest first
    return Object.entries(groups).sort(
        (a, b) => new Date(b[1][0].date || new Date()).getTime() - new Date(a[1][0].date || new Date()).getTime()
    );
};

export const BuyHistoryPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [supplier, setSupplier] = useState<Buy>();
    const [products, setProducts] = useState<Product[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [activeTab, setActiveTab] = useState<"products" | "transactions">("products");
    const [modal, setModal] = useState<{ show: boolean; action?: () => void; title?: string; message?: string; confirmColor?: "red" | "green" | "amber" }>({ show: false });
    const [showProductModal, setShowProductModal] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
        name: "",
        price: 0,
        description: "",
        isPaid: true
    });
    const [isLoading, setIsLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});
    const [payAmount, setPayAmount] = useState("");
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [noteInput, setNoteInput] = useState("");

    useEffect(() => {
        if (!id) return;
        loadSupplier();
        loadProducts();
        loadTransactions();
    }, [id]);

    async function loadSupplier() {
        const data = await getSuppliers();
        const thisSupplier = data.find((buy: Buy) => buy.id == id)
        if (thisSupplier) {
            setSupplier(thisSupplier);
        }
    }

    async function loadProducts() {
        const data = await getBuyProducts(Number(id));
        const formatted = data.map((p: Product) => {
            const productDate = new Date(p.date || new Date());
            const JTime = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
                dateStyle: "long",
                timeStyle: "medium",
            }).format(productDate);
            return { ...p, time: JTime };
        });
        setProducts(formatted);
    }

    async function loadTransactions() {
        const data = await getBuyTransactions(Number(id));
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
        if (!id || !supplier) return;
        const amount = Number(payAmount);
        if (!amount || amount <= 0) return alert("مبلغ نامعتبر است");

        setModal({
            show: true,
            title: `پرداخت بدهی`,
            message: `آیا از پرداخت مبلغ ${amount.toLocaleString()} تومان برای "${supplier.supplier}" مطمئن هستید؟`,
            confirmColor: "green",
            action: async () => {
                setIsLoading(true);
                try {
                    // Process payment and add transaction
                    await updateBuyDebt(supplier.id!, amount);
                    await addBuyTransaction(Number(id), amount, "پرداخت بدهی");
                    setPayAmount("");
                    await loadProducts();
                    await loadSupplier();
                    await loadTransactions();
                } catch (error) {
                    console.error("Error processing payment:", error);
                    alert("خطا در پردازش پرداخت");
                } finally {
                    setIsLoading(false);
                }
            },
        });
    }

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProduct.name?.trim()) {
            alert("نام محصول الزامی است");
            return;
        }
        if (!currentProduct.price || currentProduct.price <= 0) {
            alert("قیمت محصول باید بیشتر از صفر باشد");
            return;
        }
        if (!supplier) return;

        setIsLoading(true);
        try {
            const time = new Date();
            // Add product to the supplier
            await addProductToBuy(supplier.id!, {
                ...currentProduct,
                price: currentProduct.price!,
                name: currentProduct.name!,
                description: currentProduct.description || "",
                isPaid: currentProduct.isPaid !== false,
                date: time.getTime()
            } as Product);

            setShowProductModal(false);
            setCurrentProduct({ name: "", price: 0, description: "", isPaid: true });
            await loadProducts();
            await loadSupplier();
        } catch (error) {
            console.error("Error adding product:", error);
            alert("خطا در افزودن محصول");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditProduct = async (product: Product) => {
        if (!editForm.name?.trim()) {
            alert("نام محصول الزامی است");
            return;
        }
        if (!editForm.price || editForm.price <= 0) {
            alert("قیمت محصول باید بیشتر از صفر باشد");
            return;
        }

        setIsLoading(true);
        try {
            await updateProduct(product.id!, editForm);
            setEditingProduct(null);
            setEditForm({});
            await loadProducts();
            await loadSupplier();
        } catch (error) {
            console.error("Error updating product:", error);
            alert("خطا در ویرایش محصول");
        } finally {
            setIsLoading(false);
        }
    };

    const startEditing = (product: Product) => {
        setEditingProduct(product);
        setEditForm({
            name: product.name,
            price: product.price,
            description: product.description,
            isPaid: product.isPaid
        });
    };

    const cancelEditing = () => {
        setEditingProduct(null);
        setEditForm({});
    };

    // Calculate totals
    const totalAmount = products.reduce((sum, product) => sum + product.price, 0);
    const paidAmount = products.filter(p => p.isPaid).reduce((sum, product) => sum + product.price, 0) + transactions.reduce((sum, tr) => sum + tr.amount, 0);

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
                    خریدها از {supplier?.supplier}
                </h1>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-2xl shadow p-5 mb-6 border border-gray-100">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {supplier?.totalCost! >= 0 ?
                        <div className="text-lg text-gray-800 font-semibold">
                            بدهی کل:{" "}
                            <span className="text-red-600">
                                {supplier?.totalCost.toLocaleString()} تومان
                            </span>
                        </div> :
                        <div className="text-lg text-gray-800 font-semibold">
                            طلب کل:{" "}
                            <span className="text-green-600">
                                {(supplier?.totalCost! * -1).toLocaleString()} تومان
                            </span>
                        </div>

                    }                    <div className="flex flex-col sm:flex-row items-center gap-3 min-w-40 sm:w-auto">
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
                                }}
                                className="border rounded-lg px-3 py-2 text-gray-700 min-w-[300px] sm:w-36 text-center"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handlePay}
                                disabled={isLoading || !payAmount || Number(payAmount) <= 0}
                                className="bg-green-500 cursor-pointer hover:bg-green-600 text-white px-4 py-2 rounded-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                پرداخت
                            </button>
                        </div>

                        {/* Remaining debt info */}
                        {payAmount && (
                            <div className="text-sm mt-2 sm:mt-0 text-gray-700 text-center sm:text-right">
                                {Number(payAmount) > supplier?.totalCost! ? (
                                    <span>
                                        پرداخت اضافی:{" "}
                                        <strong className="text-green-600">
                                            {(Number(payAmount) - supplier?.totalCost!).toLocaleString()} تومان
                                        </strong>
                                    </span>
                                ) : (
                                    <span>
                                        بدهی پس از پرداخت:{" "}
                                        <strong className="text-red-600">
                                            {(supplier?.totalCost! - Number(payAmount)).toLocaleString()} تومان
                                        </strong>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">مجموع خریدها</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {totalAmount.toLocaleString()} تومان
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">پرداخت شده</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {paidAmount.toLocaleString()} تومان
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">تعداد محصولات</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">
                                {products.length} عدد
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <span className="text-purple-600 font-bold">#</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Product Button */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex-1"></div>
                <button
                    onClick={() => setShowProductModal(true)}
                    disabled={isLoading}
                    className="flex items-center cursor-pointer gap-2 bg-gradient-to-l from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    <PlusIcon size={20} />
                    افزودن خرید جدید
                </button>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-6">
                <div className="bg-white rounded-full shadow flex">
                    <button
                        onClick={() => setActiveTab("products")}
                        className={`px-6 py-2 rounded-full font-semibold ${activeTab === "products"
                            ? "bg-green-500 text-white"
                            : "text-gray-600 hover:text-green-600"
                            }`}
                    >
                        محصولات
                    </button>
                    <button
                        onClick={() => setActiveTab("transactions")}
                        className={`px-6 py-2 rounded-full font-semibold ${activeTab === "transactions"
                            ? "bg-green-500 text-white"
                            : "text-gray-600 hover:text-green-600"
                            }`}
                    >
                        تراکنش‌ها
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === "products" ? (
                <div className="bg-white rounded-2xl shadow p-4 border border-gray-100">
                    {products.length === 0 ? (
                        <p className="text-center text-gray-500">خریدی ثبت نشده است.</p>
                    ) : (
                        <div className="overflow-x-auto flex justify-center pb-10">
                            <table className="w-full max-w-7xl bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                                <thead className="bg-green-100 text-gray-700 font-semibold">
                                    <tr>
                                        <th className="p-3 text-center">شناسه</th>
                                        <th className="p-3 text-center">نام محصول</th>
                                        <th className="p-3 text-center">قیمت</th>
                                        <th className="p-3 text-center">توضیحات</th>
                                        <th className="p-3 text-center">وضعیت پرداخت</th>
                                        <th className="p-3 text-center">زمان</th>
                                        <th className="p-3 text-center">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupProductsByMonth(products).map(([monthLabel, monthProducts]) => (
                                        <React.Fragment key={monthLabel}>
                                            {/* Month Header */}
                                            <tr>
                                                <td colSpan={7} className="py-3 bg-gradient-to-r from-green-100 via-green-50 to-green-100">
                                                    <div className="flex items-center justify-center relative">
                                                        <div className="absolute right-3 z-10 bg-white px-2 py-1 rounded-full shadow-sm border text-gray-700 font-bold ">
                                                            {monthProducts.length}x
                                                        </div>
                                                        <div className="absolute left-3 z-10 bg-white px-2 py-1 rounded-full shadow-sm border text-gray-700 font-bold ">
                                                            {monthProducts.reduce((acc, product) => acc + product.price, 0).toLocaleString()} تومان
                                                        </div>

                                                        <div className="absolute left-0 right-0 h-px bg-green-200" />
                                                        <span className="relative z-10 bg-white px-6 py-1 rounded-full shadow-sm border text-gray-700 font-bold text-lg">
                                                            {monthLabel}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Products in this month */}
                                            {monthProducts.map((product) => (
                                                <tr key={product.id} className="hover:bg-gray-50">
                                                    <td className="p-3 text-center font-bold">#{product.id}</td>
                                                    <td className="p-3 text-center font-medium">
                                                        {editingProduct?.id === product.id ? (
                                                            <input
                                                                type="text"
                                                                value={editForm.name || ""}
                                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                                className="w-full border border-gray-300 rounded-lg p-2 text-center"
                                                                disabled={isLoading}
                                                            />
                                                        ) : (
                                                            product.name
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center font-semibold">
                                                        {editingProduct?.id === product.id ? (
                                                            <input
                                                                type="number"
                                                                value={editForm.price || 0}
                                                                onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                                                className="w-full border border-gray-300 rounded-lg p-2 text-center"
                                                                disabled={isLoading}
                                                            />
                                                        ) : (
                                                            `${product.price.toLocaleString()} تومان`
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center text-sm text-gray-600 max-w-xs">
                                                        {editingProduct?.id === product.id ? (
                                                            <textarea
                                                                value={editForm.description || ""}
                                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                                className="w-full border border-gray-300 rounded-lg p-2"
                                                                rows={2}
                                                                disabled={isLoading}
                                                            />
                                                        ) : (
                                                            product.description || "—"
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {product.isPaid ? (
                                                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                                                پرداخت شده
                                                            </span>
                                                        ) : (
                                                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                                                پرداخت نشده
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center text-sm text-gray-500">{product.time}</td>
                                                    <td className="p-3 text-center">
                                                        {editingProduct?.id === product.id ? (
                                                            <div className="flex gap-1 justify-center">
                                                                <button
                                                                    onClick={() => handleEditProduct(product)}
                                                                    disabled={isLoading}
                                                                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-lg text-sm flex items-center gap-1"
                                                                >
                                                                    <SaveIcon size={14} />
                                                                    ذخیره
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditing}
                                                                    disabled={isLoading}
                                                                    className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded-lg text-sm"
                                                                >
                                                                    لغو
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-1 justify-center">
                                                                <button
                                                                    onClick={() => startEditing(product)}
                                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg text-sm flex items-center gap-1"
                                                                >
                                                                    <Edit3Icon size={14} />
                                                                    ویرایش
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedProduct(product)}
                                                                    className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded-lg text-sm"
                                                                >
                                                                    جزئیات
                                                                </button>
                                                            </div>
                                                        )}
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
                                        <td className="p-3 text-center">
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

            {/* Add Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="border-b border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        افزودن خرید جدید
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        فروشنده: {supplier?.supplier}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setShowProductModal(false); }}
                                    disabled={isLoading}
                                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                >
                                    <XIcon size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <form className="space-y-5" onSubmit={handleProductSubmit}>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2">
                                        نام محصول
                                        <span className="text-red-500 mr-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={currentProduct.name || ""}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        placeholder="نام محصول را وارد کنید"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2">
                                        قیمت محصول
                                        <span className="text-red-500 mr-1">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={currentProduct.price}
                                        onChange={(e) => {
                                            if (isNaN(Number(e.target.value)))
                                                e.preventDefault()
                                            else
                                                setCurrentProduct({
                                                    ...currentProduct, price: parseFloat(e.target.value) || 0

                                                })
                                        }}
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        placeholder="قیمت محصول را وارد کنید"
                                        disabled={isLoading}
                                    />
                                    <p className="text-sm mt-1 mr-2 text-red-500">
                                        {currentProduct.price?.toLocaleString()} تومان
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2">
                                        توضیحات محصول
                                    </label>
                                    <textarea
                                        value={currentProduct.description || ""}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                                        placeholder="توضیحات محصول (اختیاری)"
                                        rows={3}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="isPaid"
                                        checked={currentProduct.isPaid !== false}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, isPaid: e.target.checked })}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                        disabled={isLoading}
                                    />
                                    <label htmlFor="isPaid" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        پرداخت شده
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowProductModal(false); }}
                                        disabled={isLoading}
                                        className="px-6 py-3 cursor-pointer rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                                    >
                                        لغو
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || !currentProduct.name?.trim() || !currentProduct.price || currentProduct.price <= 0}
                                        className="px-6 py-3 cursor-pointer rounded-xl bg-gradient-to-l from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? "در حال ذخیره..." : "افزودن خرید"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative">
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="absolute cursor-pointer top-4 left-4 text-gray-600 hover:text-red-500 transition-all"
                        >
                            <XIcon size={24} />
                        </button>

                        <h2 className="text-xl font-bold mb-4 border-b pb-3 text-gray-800">
                            جزئیات محصول #{selectedProduct.id}
                        </h2>

                        <div className="space-y-4 text-gray-700">
                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-600">نام محصول:</span>
                                <span>{selectedProduct.name}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="font-semibold text-gray-600">قیمت:</span>
                                <span className="font-bold text-green-600">{selectedProduct.price.toLocaleString()} تومان</span>
                            </div>

                            <div className="flex justify-between items-start">
                                <span className="font-semibold text-gray-600">وضعیت پرداخت:</span>
                                {selectedProduct.isPaid ? (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                        پرداخت شده
                                    </span>
                                ) : (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                                        پرداخت نشده
                                    </span>
                                )}
                            </div>

                            <div>
                                <span className="font-semibold text-gray-600 block mb-2">توضیحات:</span>
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-[80px]">
                                    {selectedProduct.description || "توضیحاتی ثبت نشده است"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>زمان ثبت:</span>
                                <span>{selectedProduct.time}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    startEditing(selectedProduct);
                                    setSelectedProduct(null);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Edit3Icon size={16} />
                                ویرایش محصول
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Note Modal */}
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
                                    await updateBuyTransactionNote(editingTransaction.id!, noteInput);
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
