export type MenuItem = {
    id: number;
    title: string;
    price: number;
    image: string;
    type: 'food' | 'drink';
};
export type OrderItem = {
    id: number;
    foods: FoodItem[];
    totalPrice: number;
    totalQuantity: number;
    name?: string;
    phone?: string;
    address?: string;
    isOutFood: boolean;
    description?: string;
    date: number;
    paidDate?: string;
    paidTime?: string;
    time?: string;
    paid?: 0 | 1;
    status?: 'paid' | 'unpaid';
    paymentMethod?: any;
}
export type FoodItem = {
    id: number;
    title: string;
    quantity: number;
    totalPrice: number;
    type: 'food' | 'drink';

}
export type MenuFood = {
    id: number;
    title: string;
    price: number;
    image?: string;
    quantity: number;
    totalPrice: number;
    type: 'food' | 'drink';

}
export type Stats = {
    id: number;
    totalQuantity: number;
    totalPrice: number;
    date: number;
    foods: FoodItem[];
}
export type Account = {
    id?: number;
    accountName: string;
    description?: string;
    totalDebt: number;
}
export type Transaction = {
    id?: number;
    amount: number;
    time: string;
    note?: string;
}
export interface Buy {
    id?: number;
    supplier: string;
    totalCost: number;
    unpaidQuantity:number;
    description?: string;
    products?: Product[];

}
export interface Product {
    id?: number;
    name: string;
    price: number;
    isPaid: boolean;
    description: string;
    date:number;
    time:string;
}
