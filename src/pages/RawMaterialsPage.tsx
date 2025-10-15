import { useState, useEffect } from "react";
import { getRawMaterials, addRawMaterial, updateRawMaterial } from "../lib/db";
import type { RawMaterial } from "../types";

export const RawMaterialsPage = () => {
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [newMat, setNewMat] = useState<RawMaterial>({ id: undefined, name: "", quantity: 0, unit: "عدد" });
    const [editingId, setEditingId] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quickAddQuantity, setQuickAddQuantity] = useState<{ [key: number]: number }>({});

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setIsLoading(true);
        try {
            const mats = await getRawMaterials();
            setMaterials(mats);
        } catch (error) {
            console.error("Error loading materials:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function add() {
        if (!newMat.name.trim() || newMat.quantity <= 0) {
            alert("لطفاً نام و مقدار معتبر وارد کنید");
            return;
        }

        setIsSubmitting(true);
        try {
            await addRawMaterial(newMat.name, newMat.quantity, newMat.unit);
            setNewMat({ name: "", quantity: 0, unit: "عدد" });
            await load();
        } catch (error) {
            console.error("Error adding material:", error);
            alert("خطا در افزودن ماده اولیه");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function update() {
        if (!newMat.name.trim() || newMat.quantity <= 0 || !editingId) {
            alert("لطفاً نام و مقدار معتبر وارد کنید");
            return;
        }

        setIsSubmitting(true);
        try {
            await updateRawMaterial(editingId, newMat.name, newMat.quantity, newMat.unit);
            setNewMat({ name: "", quantity: 0, unit: "عدد" });
            setEditingId(undefined);
            await load();
        } catch (error) {
            console.error("Error updating material:", error);
            alert("خطا در به‌روزرسانی ماده اولیه");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function quickAdd(material: RawMaterial) {
        const quantityToAdd = quickAddQuantity[material.id!] || 0;
        if (quantityToAdd <= 0) {
            alert("لطفاً مقدار معتبر وارد کنید");
            return;
        }

        setIsSubmitting(true);
        try {
            const newQuantity = material.quantity + quantityToAdd;
            await updateRawMaterial(material.id!, material.name, newQuantity, material.unit);
            setQuickAddQuantity(prev => ({ ...prev, [material.id!]: 0 }));
            await load();
        } catch (error) {
            console.error("Error updating material quantity:", error);
            alert("خطا در افزودن مقدار");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function quickSubtract(material: RawMaterial) {
        const quantityToSubtract = quickAddQuantity[material.id!] || 0;
        if (quantityToSubtract <= 0) {
            alert("لطفاً مقدار معتبر وارد کنید");
            return;
        }

        if (material.quantity < quantityToSubtract) {
            alert("مقدار کسر شده نمی‌تواند بیشتر از موجودی باشد");
            return;
        }

        setIsSubmitting(true);
        try {
            const newQuantity = material.quantity - quantityToSubtract;
            await updateRawMaterial(material.id!, material.name, newQuantity, material.unit);
            setQuickAddQuantity(prev => ({ ...prev, [material.id!]: 0 }));
            await load();
        } catch (error) {
            console.error("Error updating material quantity:", error);
            alert("خطا در کسر مقدار");
        } finally {
            setIsSubmitting(false);
        }
    }

    function startEdit(material: RawMaterial) {
        setNewMat({
            id: material.id,
            name: material.name,
            quantity: material.quantity,
            unit: material.unit
        });
        setEditingId(material.id);
    }

    function cancelEdit() {
        setNewMat({ name: "", quantity: 0, unit: "عدد" });
        setEditingId(undefined);
    }


    const handleSubmit = () => {
        if (editingId) {
            update();
        } else {
            add();
        }
    };

    const handleQuickAddKeyPress = (e: React.KeyboardEvent, material: RawMaterial) => {
        if (e.key === "Enter") {
            quickAdd(material);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">مدیریت مواد اولیه</h1>
                    <p className="text-gray-600">مدیریت و پیگیری موجودی مواد اولیه تولید</p>
                </div>

                {/* Add/Edit Material Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {editingId ? "ویرایش ماده اولیه" : "افزودن ماده اولیه جدید"}
                        </h2>
                        {editingId && (
                            <button
                                onClick={cancelEdit}
                                className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
                            >
                                انصراف
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">نام ماده</label>
                            <input
                                placeholder="مثلاً: کباب"
                                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={newMat.name}
                                onChange={e => setNewMat({ ...newMat, name: e.target.value })}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">مقدار</label>
                            <input
                                placeholder="0"
                                type="text"
                                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-left"
                                value={newMat.quantity}
                                onChange={e => {
                                    if (isNaN(Number(e.target.value))) return;
                                    setNewMat({ ...newMat, quantity: Number(e.target.value) })
                                }}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">واحد اندازه‌گیری</label>
                            <select
                                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={newMat.unit}
                                onChange={e => setNewMat({ ...newMat, unit: e.target.value })}
                                disabled={isSubmitting}
                            >
                                <option>عدد</option>
                                <option>کیلو</option>
                                <option>بسته</option>
                                <option>متر</option>
                                <option>لیتر</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`flex-1 px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-[52px] ${editingId
                                        ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                                    }`}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {editingId ? "در حال ویرایش..." : "در حال افزودن..."}
                                    </span>
                                ) : (
                                    editingId ? "ذخیره تغییرات" : "افزودن ماده اولیه"
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Materials Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">لیست مواد اولیه</h2>
                    </div>

                    {isLoading && materials.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="animate-pulse text-gray-500">در حال بارگذاری...</div>
                        </div>
                    ) : materials.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                            </svg>
                            <p className="mt-2">هنوز ماده اولیه‌ای اضافه نکرده‌اید</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-right font-semibold text-gray-700 border-b border-gray-200">نام ماده</th>
                                        <th className="px-6 py-4 text-right font-semibold text-gray-700 border-b border-gray-200">موجودی</th>
                                        <th className="px-6 py-4 text-right font-semibold text-gray-700 border-b border-gray-200">واحد</th>
                                        <th className="px-6 py-4 text-right font-semibold text-gray-700 border-b border-gray-200">افزودن/کسر موجودی</th>
                                        <th className="px-6 py-4 text-right font-semibold text-gray-700 border-b border-gray-200">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {materials.map((m, i) => (
                                        <tr key={i} className={`hover:bg-gray-50 transition-colors ${editingId === m.id ? "bg-blue-50" : ""
                                            }`}>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {m.name}
                                                {editingId === m.id && (
                                                    <span className="mr-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        در حال ویرایش
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${m.quantity > 50
                                                        ? "bg-green-100 text-green-800"
                                                        : m.quantity > 10
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}>
                                                    {m.quantity.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{m.unit}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2 min-w-[200px]">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="مقدار"
                                                            className="flex-1 border border-gray-300 rounded-lg p-2 text-left text-sm w-20"
                                                            value={quickAddQuantity[m.id!] || ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (value === "" || !isNaN(Number(value))) {
                                                                    setQuickAddQuantity(prev => ({
                                                                        ...prev,
                                                                        [m.id!]: value === "" ? 0 : Number(value)
                                                                    }));
                                                                }
                                                            }}
                                                            onKeyPress={(e) => handleQuickAddKeyPress(e, m)}
                                                            disabled={isSubmitting}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => quickAdd(m)}
                                                            disabled={isSubmitting || !quickAddQuantity[m.id!] || quickAddQuantity[m.id!] <= 0}
                                                            className="bg-green-500 flex-1 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            افزودن
                                                        </button>

                                                        <button
                                                            onClick={() => quickSubtract(m)}
                                                            disabled={isSubmitting || !quickAddQuantity[m.id!] || quickAddQuantity[m.id!] <= 0 || m.quantity < quickAddQuantity[m.id!]}
                                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                                        >
                                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                            </svg>
                                                            کسر
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => startEdit(m)}
                                                        disabled={isSubmitting}
                                                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        ویرایش
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
