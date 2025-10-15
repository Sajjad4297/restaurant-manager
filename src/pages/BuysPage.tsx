import { useEffect, useState } from "react";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier, addProductToBuy } from "../lib/db";
import { useNavigate } from "react-router-dom";
import type { Buy, Product } from "../types";
import { XIcon, PlusIcon, Edit3Icon, Trash2Icon, ShoppingBag } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";

export const BuysPage = () => {
    const [buys, setBuys] = useState<Buy[]>([]);
    const [form, setForm] = useState<Partial<Buy>>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState<{ show: boolean; action?: () => void; title?: string; message?: string; confirmColor?: "red" | "green" | "amber" }>({ show: false });
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Buy | null>(null);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
        name: "",
        price: 0,
        description: "",
        isPaid: true // Default to true
    });
    const navigate = useNavigate();

    useEffect(() => {
        loadBuys();
    }, []);

    const loadBuys = async () => {
        setIsLoading(true);
        try {
            const data = await getSuppliers();
            setBuys(data);
        } catch (error) {
            console.error("Error loading buys:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.supplier?.trim()) {
            alert("نام فروشنده الزامی است");
            return;
        }
        if (!form.totalCost) form.totalCost = 0;

        setIsLoading(true);
        try {
            if (editingId) await updateSupplier(editingId, form);
            else await addSupplier(form);

            setForm({});
            setEditingId(null);
            setShowForm(false);
            await loadBuys();
        } catch (error) {
            console.error("Error saving buy:", error);
            alert("خطا در ذخیره‌سازی فروشنده");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (buy: Buy) => {
        setForm(buy);
        setEditingId(buy.id!);
        setShowForm(true);
    };

    const handleDelete = (buy: Buy) => {
        setModal({
            show: true,
            title: "حذف فروشنده",
            message: `آیا از حذف فروشنده "${buy.supplier}" مطمئن هستید؟ این عمل غیرقابل بازگشت است.`,
            confirmColor: "red",
            action: async () => {
                setIsLoading(true);
                try {
                    await deleteSupplier(buy.id!);
                    await loadBuys();
                } catch (error) {
                    console.error("Error deleting buy:", error);
                    alert("خطا در حذف فروشنده");
                } finally {
                    setIsLoading(false);
                }
            },
        });
    };

    const handleAddProduct = (buy: Buy) => {
        setSelectedSupplier(buy);
        setCurrentProduct({
            name: "",
            price: 0,
            description: "",
            isPaid: true
        });
        setShowProductModal(true);
    };

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
        if (!selectedSupplier) return;

        setIsLoading(true);
        try {
            const time = new Date();
            // Add product to the supplier
            await addProductToBuy(selectedSupplier.id!, {
                ...currentProduct,
                price: currentProduct.price!,
                name: currentProduct.name!,
                description: currentProduct.description || "",
                isPaid: currentProduct.isPaid !== false, // Default to true if undefined,
                date: time.getTime()
            } as Product);


            setShowProductModal(false);
            setSelectedSupplier(null);
            setCurrentProduct({ name: "", price: 0, description: "", isPaid: true });
            await loadBuys();
        } catch (error) {
            console.error("Error adding product:", error);
            alert("خطا در افزودن محصول");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/30 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-l from-green-600 to-emerald-700 bg-clip-text text-transparent mb-3">
                        مدیریت فروشندگان
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        مدیریت و پیگیری خریدهای خود از فروشندگان مختلف
                    </p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">تعداد فروشندگان</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{buys.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>


                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        {buys.reduce((sum, buy) => sum + buy.totalCost, 0) >= 0 ?
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">مجموع پرداخت نشده</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">
                                        {buys.reduce((sum, buy) => sum + buy.totalCost, 0).toLocaleString()} تومان
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <ShoppingBag className="w-6 h-6 text-red-600" />
                                </div>
                            </div> :
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">مجموع طلب</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {(buys.reduce((sum, buy) => sum + buy.totalCost, 0) * -1).toLocaleString()} تومان
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <ShoppingBag className="w-6 h-6 text-green-600" />
                                </div>
                            </div>

                        }

                    </div>
                </div>

                {/* Add Supplier Button */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex-1"></div>
                    <button
                        onClick={() => { setShowForm(true); setForm({}); setEditingId(null); }}
                        disabled={isLoading}
                        className="flex items-center cursor-pointer gap-2 bg-gradient-to-l from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        <PlusIcon size={20} />
                        افزودن فروشنده جدید
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && buys.length === 0 && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                )}

                {/* Suppliers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {buys.length === 0 && !isLoading && (
                        <div className="col-span-full text-center py-12">
                            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">فروشنده‌ای وجود ندارد</h3>
                            <p className="text-gray-500 mb-4">برای شروع، اولین فروشنده خود را ایجاد کنید</p>
                        </div>
                    )}

                    {buys.map((buy) => {

                        return (
                            <div
                                key={buy.id}
                                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group cursor-pointer"
                                onClick={() => navigate(`/buys/${buy.id}/history`)}
                            >
                                {/* Supplier Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-bold text-xl text-gray-900 truncate group-hover:text-green-600 transition-colors">
                                            {buy.supplier}
                                        </h2>
                                        {buy.description && (
                                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                                {buy.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div
                                        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={() => handleAddProduct(buy)}
                                            disabled={isLoading}
                                            className="p-2 rounded-lg cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50"
                                            title="افزودن خرید"
                                        >
                                            <PlusIcon size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(buy)}
                                            disabled={isLoading}
                                            className="p-2 rounded-lg cursor-pointer bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors disabled:opacity-50"
                                        >
                                            <Edit3Icon size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(buy)}
                                            disabled={isLoading}
                                            className="p-2 rounded-lg cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                                        >
                                            <Trash2Icon size={16} />
                                        </button>
                                    </div>
                                </div>
                                {/* Purchase Info */}
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">

                                    {buy.totalCost >= 0 ?
                                        <div className="flex justify-between items-center bg-red-50 rounded-lg p-2">
                                            <span className="text-sm font-medium text-red-700">بدهی پرداخت نشده:</span>
                                            <span className="font-bold text-red-700">
                                                {buy.totalCost.toLocaleString()} تومان
                                            </span>
                                        </div>:
                                        <div className="flex justify-between items-center bg-green-50 rounded-lg p-2">
                                            <span className="text-sm font-medium text-green-700">طلب:</span>
                                            <span className="font-bold text-green-700">
                                                {(buy.totalCost * -1).toLocaleString()} تومان
                                            </span>
                                        </div>

                                    }

                                    <div className="flex justify-between items-center text-sm text-gray-500">
                                        <span>تعداد خریدهای پرداخت نشده:</span>
                                        <span>{buy.unpaidQuantity || 0} عدد</span>
                                    </div>
                                </div>


                            </div>
                        );
                    })}
                </div>

                {/* Add/Edit Supplier Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                        <div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="border-b border-gray-100 p-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editingId ? "ویرایش فروشنده" : "افزودن فروشنده جدید"}
                                    </h2>
                                    <button
                                        onClick={() => { setShowForm(false); setEditingId(null); }}
                                        disabled={isLoading}
                                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                    >
                                        <XIcon size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto">
                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-2">
                                            نام فروشنده
                                            <span className="text-red-500 mr-1">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.supplier || ""}
                                            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                            placeholder="نام فروشنده را وارد کنید"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-2">
                                            توضیحات
                                        </label>
                                        <textarea
                                            value={form.description || ""}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                                            placeholder="توضیحات اختیاری"
                                            rows={3}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => { setShowForm(false); setEditingId(null); }}
                                            disabled={isLoading}
                                            className="px-6 py-3 cursor-pointer rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                                        >
                                            لغو
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading || !form.supplier?.trim()}
                                            className="px-6 py-3 cursor-pointer rounded-xl bg-gradient-to-l from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? "در حال ذخیره..." : editingId ? "ویرایش فروشنده" : "افزودن فروشنده"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Product Modal */}
                {showProductModal && selectedSupplier && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
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
                                            فروشنده: {selectedSupplier.supplier}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setShowProductModal(false); setSelectedSupplier(null); }}
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
                                            onClick={() => { setShowProductModal(false); setSelectedSupplier(null); }}
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
        </div>
    );
};
