// src/pages/NewOrderPage.tsx
import { useEffect, useState, type ChangeEvent } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useNavigate, useLocation } from "react-router-dom";
import { getMenuItems, addPendingOrder, updatePendingOrder } from "../lib/db";
import type { FoodItem, MenuFood } from "../types";
export const NewOrderPage = () => {
    const [menuFoods, setMenuFoods] = useState<MenuFood[]>([]);
    const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [totalQuantity, setTotalQuantity] = useState<number>(0);
    const [customerData, setCustomerData] = useState<{ name: string, phone: string, address: string, description: string }>({
        name: "",
        phone: "",
        address: "",
        description: ""
    }
    )
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        loadMenu();
    }, []);

    useEffect(() => {
        let totalPrice = 0;
        let totalQuantity = 0;

        const selectedFoods: MenuFood[] = menuFoods.filter(menuFood => menuFood.quantity > 0)
            .map((food: MenuFood) => ({ id: food.id, title: food.title, quantity: food.quantity, price: food.price, totalPrice: food.totalPrice, type: food.type }))
            .sort((a, b) => a.id - b.id);
        selectedFoods.forEach(menuFood => {
            totalPrice += menuFood.totalPrice;
            if (menuFood.type === 'food') {
                totalQuantity += menuFood.quantity;
            }
        });

        setSelectedFoods(selectedFoods);
        setTotalPrice(totalPrice);
        setTotalQuantity(totalQuantity);
    }, [menuFoods]);

    async function loadMenu() {
        try {
            const items = await getMenuItems();

            if (location.state) {
                const order = location.state;
                const orderFoods = order.foods; // array of foods in the order

                // pre-fill customer data
                setCustomerData({
                    name: order.name,
                    phone: order.phone,
                    address: order.address,
                    description: order.description
                });

                const processedItems = items.map((item) => {
                    const matched = orderFoods.find((food: MenuFood) => food.id === item.id);

                    const quantity = matched ? matched.quantity : 0;
                    const totalPrice = matched ? matched.totalPrice : 0;

                    return {
                        ...item,
                        image: item.image.startsWith("tauri://") || item.image.startsWith("http")
                            ? item.image
                            : convertFileSrc(item.image),
                        quantity,
                        totalPrice
                    };
                });

                setMenuFoods(processedItems.sort((a, b) => a.id - b.id));

            } else {
                const processedItems = items.map((item) => ({
                    ...item,
                    image: item.image.startsWith("tauri://") || item.image.startsWith("http")
                        ? item.image
                        : convertFileSrc(item.image),
                    quantity: 0,
                    totalPrice: 0
                }));

                setMenuFoods(processedItems.sort((a, b) => a.id - b.id));
            }

        } catch (error) {
            console.error("Error loading menu:", error);
        }
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>, id: number, price: number) => {
        const inputData = Number(e.target.value);
        if (isNaN(inputData)) {
            e.preventDefault();
        } else {
            const selectedFood: any = menuFoods.find((food) => food.id == id);
            const unselectedFoods = menuFoods.filter((food) => food.id != id);
            setMenuFoods(([...unselectedFoods, {
                ...selectedFood,
                quantity: inputData,
                totalPrice: inputData * price
            }]).sort((a, b) => a.id - b.id));
        }
    };

    const handleClickOnFoods = (id: number, price: number) => {
        const selectedFood: any = menuFoods.find((food) => food.id == id);
        const unselectedFoods = menuFoods.filter((food) => food.id != id);
        setMenuFoods(([...unselectedFoods, {
            ...selectedFood,
            quantity: selectedFood.quantity + 1,
            totalPrice: (selectedFood.quantity + 1) * price
        }]).sort((a, b) => a.id - b.id));
    };
    const handleCustomerData = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
        const inputName = e.target.name;
        const inputValue = e.target.value;
        if (inputName == 'phone' && isNaN(Number(inputValue))) {
            e.preventDefault();
        }
        else {
            setCustomerData({
                ...customerData,
                [inputName]: inputValue
            })
        }

    }
    const submitOrder = async () => {
        try {
            if (selectedFoods.length === 0 || totalPrice === 0 || totalQuantity === 0) {
                return alert('هیچ غذایی انتخاب نشده!');
            }
            const { name, phone, address, description } = customerData;
            const date = new Date();
            const time = date.getTime();
            if (location.state) {
                await updatePendingOrder(location.state.id, selectedFoods, totalPrice, totalQuantity, name, phone, address, description);
                return navigate('/orders');
            }
            await addPendingOrder(selectedFoods, totalPrice, totalQuantity, time, name, phone, address, description);
            return navigate('/orders');
        } catch (error) {
            throw error;
        }
    };

    return (
        <div className="p-6 flex flex-col gap-10 items-center bg-gray-50 min-h-screen">

            {/* Customer Info Form */}
            <div className="w-full max-w-5xl bg-white shadow-md rounded-2xl p-6 flex flex-wrap justify-between gap-6">
                <div className="flex flex-col flex-1 min-w-[250px]">
                    <label htmlFor="name" className="font-semibold text-gray-700 mb-2">
                        نام مشتری:
                    </label>
                    <input
                        id="name"
                        onChange={handleCustomerData}
                        name="name"
                        value={customerData.name}
                        type="text"
                        className="border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none rounded-lg px-4 py-2 text-gray-700 placeholder-gray-400 transition-all"
                    />
                </div>

                <div className="flex flex-col flex-1 min-w-[250px]">
                    <label htmlFor="phone" className="font-semibold text-gray-700 mb-2">
                        شماره مشتری:
                    </label>
                    <input
                        id="phone"
                        onChange={handleCustomerData}
                        name="phone"
                        value={customerData.phone}
                        type="text"
                        className="border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none rounded-lg px-4 py-2 text-gray-700 placeholder-gray-400 transition-all"
                    />
                </div>

                <div className="flex flex-col flex-1 min-w-[500px]">
                    <label htmlFor="address" className="font-semibold text-gray-700 mb-2">
                        آدرس مشتری:
                    </label>
                    <input
                        id="address"
                        onChange={handleCustomerData}
                        name="address"
                        value={customerData.address}
                        type="text"
                        className="border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none rounded-lg px-4 py-2 text-gray-700 placeholder-gray-400 transition-all"
                    />
                </div>
                <div className="flex flex-col flex-1 min-w-[500px]">
                    <label htmlFor="address" className="font-semibold text-gray-700 mb-2">
                        توضیحات:
                    </label>
                    <textarea
                        id="description"
                        onChange={handleCustomerData}
                        name="description"
                        value={customerData.description}
                        className="border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none rounded-lg px-4 py-2 text-gray-700 placeholder-gray-400 transition-all"
                    />
                </div>

            </div>

            {/* لیست غذاها و نوشیدنی‌ها */}
            {menuFoods.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-lg font-medium">
                    هیچ موردی در منو وجود ندارد
                </div>
            ) : (
                <div className="w-full max-w-6xl flex flex-col gap-14">
                    {/* 🍽️ غذاها */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="inline-block w-1.5 h-6 bg-orange-500 rounded"></span>
                            <h3 className="text-xl font-bold text-gray-800">🍽️ غذاها</h3>
                            <span className="text-sm text-gray-500">
                                ({menuFoods.filter(i => i.type === 'food').length})
                            </span>
                        </div>
                        {menuFoods.filter(i => i.type === 'food').length === 0 ? (
                            <p className="text-gray-400 text-center py-10 border rounded-lg bg-gray-50">
                                هیچ غذایی ثبت نشده است
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-6 justify-center">
                                {menuFoods
                                    .filter(i => i.type === 'food')
                                    .map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={
                                                "relative w-56 rounded-2xl shadow-md bg-white pb-16 p-6 flex flex-col items-center hover:shadow-2xl transition-all duration-300 cursor-pointer border border-orange-300 " +
                                                (item.quantity > 0 ? "ring-4 ring-orange-300" : "")
                                            }
                                        >
                                            <div
                                                onClick={() => handleClickOnFoods(item.id, item.price)}
                                                className="absolute top-0 bottom-0 right-0 left-0 cursor-pointer z-0"
                                            ></div>

                                            <div className="w-40 h-40 mb-4 flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <h3 className="font-bold text-lg text-center mb-1 text-gray-800">
                                                {item.title}
                                            </h3>
                                            <p className="text-green-600 font-semibold">
                                                <span className="text-xl">{item.price?.toLocaleString()}</span> تومان
                                            </p>
                                            {item.quantity > 0 && (
                                                <input
                                                    dir="ltr"
                                                    type="text"
                                                    value={item.quantity}
                                                    onChange={(e) => handleInputChange(e, item.id, item.price)}
                                                    className="w-14 z-10 absolute bottom-3 text-center text-xl text-orange-700 font-bold border border-orange-400 rounded-md bg-white shadow-sm"
                                                />
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* 🥤 نوشیدنی‌ها */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="inline-block w-1.5 h-6 bg-blue-500 rounded"></span>
                            <h3 className="text-xl font-bold text-gray-800">🥤 نوشیدنی‌ها</h3>
                            <span className="text-sm text-gray-500">
                                ({menuFoods.filter(i => i.type === 'drink').length})
                            </span>
                        </div>
                        {menuFoods.filter(i => i.type === 'drink').length === 0 ? (
                            <p className="text-gray-400 text-center py-10 border rounded-lg bg-gray-50">
                                هیچ نوشیدنی‌ای ثبت نشده است
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-6 justify-center">
                                {menuFoods
                                    .filter(i => i.type === 'drink')
                                    .map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={
                                                "relative w-56 rounded-2xl shadow-md bg-white pb-16 p-6 flex flex-col items-center hover:shadow-2xl transition-all duration-300 cursor-pointer border border-blue-300 " +
                                                (item.quantity > 0 ? "ring-4 ring-blue-300" : "")
                                            }
                                        >
                                            <div
                                                onClick={() => handleClickOnFoods(item.id, item.price)}
                                                className="absolute top-0 bottom-0 right-0 left-0 cursor-pointer z-0"
                                            ></div>

                                            <div className="w-40 h-40 mb-4 flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <h3 className="font-bold text-lg text-center mb-1 text-gray-800">
                                                {item.title}
                                            </h3>
                                            <p className="text-green-600 font-semibold">
                                                <span className="text-xl">{item.price?.toLocaleString()}</span> تومان
                                            </p>
                                            {item.quantity > 0 && (
                                                <input
                                                    dir="ltr"
                                                    type="text"
                                                    value={item.quantity}
                                                    onChange={(e) => handleInputChange(e, item.id, item.price)}
                                                    className="w-14 z-10 absolute bottom-3 text-center text-xl text-blue-700 font-bold border border-blue-400 rounded-md bg-white shadow-sm"
                                                />
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* سفارش‌ها */}
            {selectedFoods?.length > 0 && (
                <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-6 flex flex-col gap-4">
                    <h2 className="font-bold text-xl mb-2 border-b pb-2">سفارش شما</h2>
                    <div className="flex flex-col gap-2">
                        {selectedFoods.map((food) => (
                            <p key={food.id} className="text-lg text-gray-800">
                                <span className="font-bold text-indigo-700">{food.quantity}</span> × {food.title}
                            </p>
                        ))}
                    </div>
                    <h1 className="font-semibold text-xl text-gray-900 border-t pt-3">
                        مبلغ نهایی:{" "}
                        <span className="text-green-600 font-bold">{totalPrice.toLocaleString()}</span> تومان
                    </h1>
                </div>
            )}

            <button
                className={" text-white px-8 py-3 rounded-xl shadow-lg text-xl font-bold transition-all " +
                    (selectedFoods.length == 0 ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer")}
                onClick={submitOrder}
                disabled={selectedFoods.length == 0}
            >
                ثبت سفارش
            </button>
        </div>
    );
};
