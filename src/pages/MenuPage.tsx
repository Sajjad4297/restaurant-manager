// src/pages/MenuPage.tsx
import { useEffect, useState } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import type { MenuItem } from '../types'
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from "../lib/db";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";

export const MenuPage = () => {
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState<{ title: string; price: number; imageFile: File | null; type: 'food' | 'drink' }>({
        title: "",
        price: 0,
        imageFile: null,
        type: 'food'
    });
    const [imagePreview, setImagePreview] = useState<string>("");
    const [modal, setModal] = useState<{
        show: boolean;
        action?: () => void;
        title?: string;
        message?: string;
        confirmColor?: "red" | "green" | "amber";
    }>({ show: false });

    useEffect(() => { loadMenu(); }, []);

    // Image preview
    useEffect(() => {
        if (formData.imageFile) {
            const url = URL.createObjectURL(formData.imageFile);
            setImagePreview(url);
            return () => URL.revokeObjectURL(url);
        } else setImagePreview("");
    }, [formData.imageFile]);

    async function loadMenu() {
        const items = await getMenuItems();
        const processed = items.map(i => ({
            ...i,
            image: i.image.startsWith("tauri://") || i.image.startsWith("http") ? i.image : convertFileSrc(i.image),
        }));
        setMenu(processed);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file && file.type.startsWith("image/")) {
            setFormData({ ...formData, imageFile: file });
        }
    };

    async function saveItem() {
        try {
            if (editingItem) {
                let imagePath: any = null;
                if (formData.imageFile) {
                    const arrayBuffer = await formData.imageFile.arrayBuffer();
                    const bytes = Array.from(new Uint8Array(arrayBuffer));
                    const ext = formData.imageFile.name.split(".").pop() || "png";
                    const fileName = `food_${Date.now()}.${ext}`;
                    imagePath = await invoke("save_food_image", { fileName, bytes });
                }
                await updateMenuItem(editingItem.id, formData.title, formData.price, imagePath, formData.type);
                setEditingItem(null);
            } else {
                if (!formData.imageFile) return alert("Please select an image");
                const arrayBuffer = await formData.imageFile.arrayBuffer();
                const bytes = Array.from(new Uint8Array(arrayBuffer));
                const ext = formData.imageFile.name.split(".").pop() || "png";
                const fileName = `food_${Date.now()}.${ext}`;
                const imagePath: any = await invoke("save_food_image", { fileName, bytes });
                await addMenuItem(formData.title, formData.price, imagePath, formData.type);
            }

            setFormData({ title: "", price: 0, imageFile: null, type: 'food' });
            setImagePreview("");
            await loadMenu();
        } catch (err) {
            console.error(err);
            alert("خطا در ذخیره تغییرات");
        }
    }

    async function handleDelete(id: number) {
        setModal({
            show: true,
            title: "حذف آیتم منو",
            message: "آیا از حذف این آیتم مطمئن هستید؟",
            confirmColor: "red",
            action: async () => {
                try {
                    await deleteMenuItem(id);
                    await loadMenu();
                } catch (err) {
                    console.error(err);
                    alert("خطا در حذف آیتم");
                }
            },
        });
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">مدیریت منو</h2>

            {/* Add/Edit Form */}
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-md border border-gray-200">
                <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-6 bg-blue-600 rounded"></span>
                    {editingItem ? "ویرایش غذا" : "افزودن غذای جدید"}
                </h3>

                <div className="flex flex-wrap items-start gap-6">
                    {/* Inputs */}
                    <div className="flex flex-col gap-3 w-56">
                        <input
                            type="text"
                            placeholder="نام غذا"
                            className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all rounded-lg p-2 text-right outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />

                        <input
                            type="number"
                            placeholder="قیمت (تومان)"
                            className="border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all rounded-lg p-2 text-right outline-none"
                            value={formData.price || ""}
                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        />
                        <div className="flex items-center gap-2">
                            <input id="type" className="accent-blue-600 " type="checkbox" checked={formData.type === 'drink'} onChange={(e) => setFormData({ ...formData, type: e.target.checked ? 'drink' : 'food' })} />
                            <label htmlFor="type">نوشیدنی</label>

                        </div>

                    </div>

                    {/* Upload */}
                    <div className="flex flex-col gap-3 items-center">
                        <label
                            htmlFor="file"
                            className="bg-linear-to-r from-green-500 to-emerald-600 text-white font-medium px-5 py-2 rounded-lg shadow hover:opacity-90 cursor-pointer transition-all"
                        >
                            آپلود عکس
                        </label>
                        <input type="file" accept="image/*" id="file" onChange={handleFileChange} className="hidden" />
                        {imagePreview && (
                            <img
                                src={imagePreview}
                                className="w-28 h-28 object-cover rounded-lg border border-gray-300 shadow-sm hover:scale-105 transition-transform"
                            />
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-3 mt-2">
                        {editingItem && (
                            <button
                                onClick={() => {
                                    setEditingItem(null);
                                    setFormData({ title: "", price: 0, imageFile: null, type: 'food' });
                                    setImagePreview("");
                                }}
                                className="bg-gray-500 cursor-pointer text-white px-5 py-2 rounded-lg hover:bg-gray-600 shadow transition-all"
                            >
                                لغو
                            </button>
                        )}
                        <button
                            onClick={saveItem}
                            className="bg-blue-600 cursor-pointer text-white px-5 py-2 rounded-lg font-medium shadow hover:bg-blue-700 transition-all"
                        >
                            {editingItem ? "ذخیره تغییرات" : "افزودن به منو"}
                        </button>
                    </div>
                </div>
            </div>
            {/* Foods Section */}
            <div className="mb-10">
                <div className="w-full max-w-3xl mx-auto mb-6">
                    <input
                        type="text"
                        placeholder="جستجو در منو..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none rounded-xl px-4 py-2 text-gray-700 placeholder-gray-400 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <span className="inline-block w-1.5 h-6 bg-orange-500 rounded"></span>
                    <h3 className="text-xl font-bold text-gray-800">🍽️ غذاها</h3>
                    <span className="text-sm text-gray-500">({menu.filter(i => i.type === 'food').length})</span>
                </div>

                {menu.filter(i => i.type === 'food').length === 0 ? (
                    <p className="text-gray-400 text-center py-10 border rounded-lg bg-gray-50">
                        هیچ غذایی ثبت نشده است
                    </p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {menu
                            .filter(i => i.type === 'food' && i.title.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((item) => (
                                <div
                                    key={item.id}
                                    className="relative bg-white rounded-xl shadow-md p-4 flex flex-col items-center border border-orange-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                                >
                                    {/* Delete */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.id);
                                        }}
                                        className="absolute cursor-pointer top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    {/* Content */}
                                    <div
                                        onClick={() => {
                                            setEditingItem(item);
                                            setFormData({ title: item.title, price: item.price, imageFile: null, type: item.type });
                                            setImagePreview(item.image);
                                        }}
                                        className="cursor-pointer flex flex-col items-center"
                                    >
                                        <div className="w-32 h-32 mb-3 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <h3 className="font-bold text-lg text-center text-gray-800">{item.title}</h3>
                                        <p className="text-green-600 font-semibold text-center mt-1">
                                            {item.price.toLocaleString()} تومان
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Drinks Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <span className="inline-block w-1.5 h-6 bg-blue-500 rounded"></span>
                    <h3 className="text-xl font-bold text-gray-800">🥤 نوشیدنی‌ها</h3>
                    <span className="text-sm text-gray-500">({menu.filter(i => i.type === 'drink').length})</span>
                </div>

                {menu.filter(i => i.type === 'drink' && i.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <p className="text-gray-400 text-center py-10 border rounded-lg bg-gray-50">
                        هیچ نوشیدنی‌ای ثبت نشده است
                    </p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {menu
                            .filter(i => i.type === 'drink')
                            .map((item) => (
                                <div
                                    key={item.id}
                                    className="relative bg-white rounded-xl shadow-md p-4 flex flex-col items-center border border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                                >
                                    {/* Delete */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.id);
                                        }}
                                        className="absolute cursor-pointer top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    {/* Content */}
                                    <div
                                        onClick={() => {
                                            setEditingItem(item);
                                            setFormData({ title: item.title, price: item.price, imageFile: null, type: item.type });
                                            setImagePreview(item.image);
                                        }}
                                        className="cursor-pointer flex flex-col items-center"
                                    >
                                        <div className="w-32 h-32 mb-3 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <h3 className="font-bold text-lg text-center text-gray-800">{item.title}</h3>
                                        <p className="text-green-600 font-semibold text-center mt-1">
                                            {item.price.toLocaleString()} تومان
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
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
