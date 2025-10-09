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
    description?: string;
    date: string;
    paidDate?: string;
    paidTime?: string;
    time?: string;
    paid?: 0 | 1;
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
