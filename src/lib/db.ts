import Database from "@tauri-apps/plugin-sql";
import type { MenuItem, Account, Transaction, OrderItem } from '../types'
// Hold one instance for reuse
let db: Database | null = null;

export async function initDB() {
    if (!db) {
        db = await Database.load("sqlite:restaurant.db");

        // --- Create tables if not exists ---
        await db.execute(`
            CREATE TABLE IF NOT EXISTS menu (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                price REAL NOT NULL,
                type TEXT DEFAULT 'food' NOT NULL,
                image TEXT
            )
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS pending_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                items TEXT NOT NULL, -- JSON string of items
                total_price REAL NOT NULL,
                total_quantity REAL NOT NULL,
                payment_method TEXT,
                customer_name TEXT,
                customer_phone TEXT,
                customer_address TEXT,
                description TEXT,
                paid INTEGER DEFAULT 0,
                order_time REAL NOT NULL
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS unpaid_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                items TEXT NOT NULL, -- JSON string of items
                total_price REAL NOT NULL,
                total_quantity REAL NOT NULL,
                customer_name TEXT,
                customer_phone TEXT,
                customer_address TEXT,
                description TEXT,
                order_time REAL NOT NULL
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS paid_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                items TEXT NOT NULL, -- JSON string of items
                total_price REAL NOT NULL,
                total_quantity REAL NOT NULL,
                customer_name TEXT,
                customer_phone TEXT,
                customer_address TEXT,
                description TEXT,
                payment_method TEXT NOT NULL DEFAULT 'کارتخوان',
                order_time REAL NOT NULL,
                paid_time REAL NOT NULL
            )
        `);
        await db.execute('PRAGMA foreign_keys = ON');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_name TEXT NOT NULL,
                description TEXT,
                total_debt REAL NOT NULL DEFAULT 0
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS account_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                items TEXT NOT NULL, -- JSON string of items
                total_price REAL NOT NULL,
                total_quantity REAL NOT NULL,
                customer_name TEXT,
                customer_phone TEXT,
                customer_address TEXT,
                description TEXT,
                order_time REAL NOT NULL,
                account_id INTEGER NOT NULL,
                FOREIGN KEY (account_id) REFERENCES accounts (id)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            )
        `);
        await db.execute(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                date TEXT NOT NULL DEFAULT (datetime('now')),
                note TEXT,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
            );

                `)

    }
    return db;
}

// ---------------------------
// MENU FUNCTIONS
// ---------------------------
export async function addMenuItem(title: string, price: number, image?: string, type?: string) {
    const database = await initDB();
    await database.execute(
        `INSERT INTO menu (title, price, image, type) VALUES (?, ?, ?, ?)`,
        [title, price, image || null, type || 'food']
    );
}

export async function getMenuItems(): Promise<MenuItem[]> {
    const database = await initDB();
    return await database.select("SELECT * FROM menu");
}

export async function updateMenuItem(id: number, title: string, price: number, image?: string, type?: string) {
    const db = await initDB();

    if (image) {
        await db.execute(`
            UPDATE menu
            SET title = ?, price = ?, image = ?, type=?
            WHERE id = ?
        `, [title, price, image, type || 'food', id]);
    } else {
        await db.execute(`
            UPDATE menu
            SET title = ?, price = ?, type=?
            WHERE id = ?
        `, [title, price, type || 'food', id]);
    }
}

export async function deleteMenuItem(id: number) {
    const database = await initDB();
    await database.execute(`DELETE FROM menu WHERE id = ?`, [id]);
}

// ---------------------------
// PENDING ORDER FUNCTIONS
// ---------------------------
export async function addPendingOrder(items: any[], totalPrice: number, totalQuantity: number, time: number, name: string, phone: string, address: string, description: string) {
    const database = await initDB();
    await database.execute(
        `INSERT INTO pending_orders (items, total_price,total_quantity, order_time, customer_name, customer_phone, customer_address, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [JSON.stringify(items), totalPrice, totalQuantity, time, name, phone, address, description]
    );
}

export async function getPendingOrders() {
    const database = await initDB();
    const result: any[] = await
        database.select(`
            SELECT
            id,
            items AS foods,
            total_price AS totalPrice,
            total_quantity AS totalQuantity,
            payment_method AS paymentMethod,
            customer_name AS name,
            customer_phone AS phone,
            customer_address AS address,
            description,
            paid,
            order_time AS date FROM pending_orders ORDER BY order_time `);
    result.map(order => {
        order.foods = JSON.parse(order.foods);
    })
    return result;
}
export async function updatePendingOrder(id: number, items: any[], totalPrice: number, totalQuantity: number, name: string, phone: string, address: string, description: string) {
    try {
        const database = await initDB();
        await
            database.execute(`
            UPDATE pending_orders SET
            items=?,
            total_price=?,
            total_quantity=?,
            customer_name=?,
            customer_phone=?,
            customer_address=?,
            description=?
            WHERE id = ? `, [JSON.stringify(items), totalPrice, totalQuantity, name, phone, address, description, id]);
    }
    catch (error) {
        throw error;
    }

}
export async function deletePendingOrder(id: number) {
    const database = await initDB();
    await database.execute(`DELETE FROM pending_orders WHERE id = ?`, [id]);
}

// UNPAID ORDER FUNCTIONS
// ---------------------------
export async function addUnpaidOrder(data: any) {
    const database = await initDB();
    const { id, foods, totalPrice, totalQuantity, date, name, phone, address, description } = data
    await database.execute(
        `INSERT INTO unpaid_orders (items, total_price,total_quantity, order_time, customer_name, customer_phone, customer_address, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [JSON.stringify(foods), totalPrice, totalQuantity, date, name, phone, address, description]
    );
    await database.execute(`DELETE FROM pending_orders WHERE id = ?`, [id]);

}

export async function getUnpaidOrders() {
    const database = await initDB();
    const result: any[] = await
        database.select(`
            SELECT
            id,
            items AS foods,
            total_price AS totalPrice,
            total_quantity AS totalQuantity,
            customer_name AS name,
            customer_phone AS phone,
            customer_address AS address,
            description,
            order_time AS date FROM unpaid_orders ORDER By id DESC `);
    result.map(order => {
        order.foods = JSON.parse(order.foods);
    })
    return result;
}

export async function getUnpaidCount() {
    const database = await initDB();
    const result = await database.select<{ count: number }[]>("SELECT COUNT(*) as count FROM unpaid_orders");
    return result[0]?.count || 0;
}



// PAID ORDER FUNCTIONS
// ---------------------------
export async function addPaidOrder(data: any) {
    try {
        const database = await initDB();
        const { id, foods, paymentMethod, totalPrice, totalQuantity, date, paidDate, name, phone, address, description } = data
        await database.execute(
            `INSERT INTO paid_orders (items, total_price, total_quantity, payment_method, order_time, paid_time, customer_name, customer_phone, customer_address, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [JSON.stringify(foods), totalPrice, totalQuantity, paymentMethod, date, paidDate, name, phone, address, description]
        );
        console.log(id, paymentMethod)
        await database.execute(`UPDATE pending_orders SET paid = 1, payment_method = ? WHERE id = ?`, [paymentMethod, id]);


    } catch (error) {
        throw error;
    }
}
export async function addPaidOrderFromUnpaid(data: any) {
    const database = await initDB();
    const { id, foods, paymentMethod, totalPrice, totalQuantity, date, paidDate, name, phone, address, description } = data;
    console.log(paymentMethod)
    await database.execute(
        `INSERT INTO paid_orders (items, total_price, total_quantity, payment_method, order_time, paid_time, customer_name, customer_phone, customer_address, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [JSON.stringify(foods), totalPrice, totalQuantity, paymentMethod, date, paidDate, name, phone, address, description]
    );
    await database.execute(`DELETE FROM unpaid_orders WHERE id = ?`, [id]);

}

export async function getPaidOrders() {
    const database = await initDB();
    const result: any[] = await
        database.select(`
            SELECT
            id,
            items AS foods,
            total_price AS totalPrice,
            total_quantity AS totalQuantity,
            payment_method AS paymentMethod,
            customer_name AS name,
            customer_phone AS phone,
            customer_address AS address,
            description,
            order_time AS date,
            paid_time AS paidDate FROM paid_orders ORDER By id DESC; `);
    result.map(order => {
        order.foods = JSON.parse(order.foods);
    })
    return result;
}
// DASHBOARD FUNCTIONS
// ---------------------------
export async function getDataFromYesterday() {
    const database = await initDB();
    // Today at 00:00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // const todayUnix = Math.floor(today.getTime());

    // Yesterday at 00:00:00
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayUnix = Math.floor(yesterday.getTime());

    const result: any[] = await
        database.select(`
            SELECT
            id,
            items AS foods,
            total_price AS totalPrice,
            total_quantity AS totalQuantity,
            paid_time AS date FROM paid_orders WHERE paid_time >= ? ORDER By id DESC; `, [yesterdayUnix]);
    result.map(order => {
        order.foods = JSON.parse(order.foods);
    })
    return result;
}
export async function getDataFromCurrentMonth() {
    const database = await initDB();

    // Get current Persian date
    const now = new Date();
    const persianDate = new Intl.DateTimeFormat('en-u-ca-persian', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }).format(now);

    // Parse the Persian date string (format: YYYY/M/D)
    const [persianYear, persianMonth, persianDay] : any = persianDate.split('/').map(Number);

    // First day of current Persian month
    const firstDayOfMonth = new Date(
        parseInt(persianYear),
        parseInt(persianMonth) - 1, // Persian months are 0-based in this API
        1
    );

    // Convert to Unix timestamp (start of the month)
    const startOfMonthUnix = Math.floor(firstDayOfMonth.getTime());

    const result: any[] = await database.select(`
        SELECT
        id,
        items AS foods,
        total_price AS totalPrice,
        total_quantity AS totalQuantity,
        paid_time AS date
        FROM paid_orders
        WHERE paid_time >= ?
        ORDER BY id DESC;`, [startOfMonthUnix]);

    result.map(order => {
        order.foods = JSON.parse(order.foods);
    });

    return result;
}
// ACCOUNTS FUNCTIONS
export const getAccounts = async (): Promise<Account[]> => {
    try {
        const database = await initDB();
        const result = await database.select('SELECT id, account_name AS accountName, description, total_debt AS totalDebt FROM accounts');
        return result as Account[];

    } catch (error) {
        throw error;
    }
};

export const addAccount = async (account: Partial<Account>) => {
    try {
        const database = await initDB();
        const { accountName, description, totalDebt } = account;

        await database.execute(
            `INSERT INTO accounts (account_name, description, total_debt) VALUES (?, ?, ?)`,
            [accountName, description, totalDebt]
        );

    } catch (error) {
        throw error;
    }
};

export const updateAccount = async (id: number, account: Partial<Account>) => {
    try {
        const database = await initDB();
        const { accountName, description } = account;
        await
            database.execute(`
            UPDATE accounts SET
            account_name=?,
            description=?
            WHERE id = ? `, [accountName, description, id]);


    } catch (error) {
        throw error;
    }
};

export const deleteAccount = async (id: number) => {
    try {
        const database = await initDB();
        await database.execute('DELETE FROM accounts WHERE id = ?', [id])
    } catch (error) {
        throw error;
    }
};
export async function addAccountOrder(accountId: number, data: OrderItem) {
    try {
        const database = await initDB();
        const { id, foods, totalPrice, totalQuantity, date, name, phone, address, description } = data
        await database.execute(
            `INSERT INTO account_orders (items, total_price, total_quantity, order_time, customer_name, customer_phone, customer_address, description, account_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [JSON.stringify(foods), totalPrice, totalQuantity, date, name, phone, address, description, accountId]
        );
        await database.execute(`DELETE FROM pending_orders WHERE id = ?`, [id]);
        await database.execute('UPDATE accounts SET total_debt = total_debt + ? WHERE id = ?', [totalPrice, accountId])
    } catch (error) {
        throw error;
    }
}

export async function getAccountOrders(accountId: number) {
    try {
        const database = await initDB();
        const result: any[] = await database.select(
            `SELECT
                id,
                items AS foods,
                total_price AS totalPrice,
                total_quantity AS totalQuantity,
                customer_name AS name,
                customer_phone AS phone,
                customer_address AS address,
                description,
                order_time AS date
                FROM account_orders
                WHERE account_id = ?
                ORDER BY order_time DESC`,
            [accountId]
        );

        result.forEach((order) => {
            order.foods = JSON.parse(order.foods);
        });
        return result;

    } catch (error) {
        throw error;
    }
}
export async function getAccountTransactions(accountId: number) {
    try {
        const database = await initDB();
        const rows: Transaction[] = await database.select("SELECT * FROM transactions WHERE account_id = ? ORDER BY id DESC", [accountId]);
        return rows;
    } catch (error) {
        throw error;
    }
}

export async function addTransaction(accountId: number, amount: number) {
    try {
        const database = await initDB();
        await database.execute("INSERT INTO transactions (account_id, amount) VALUES (?, ?)", [accountId, amount]);
    } catch (error) {
        throw error;
    }
}
export async function updateTransactionNote(id: number, note: string) {
    try {
        const database = await initDB();
        await database.execute("UPDATE transactions SET note = ? WHERE id = ?", [note, id]);
    } catch (error) {
        throw error;
    }
}

export async function updateAccountDebt(accountId: number, paidDebt: number) {
    try {
        const database = await initDB();
        await database.execute("UPDATE accounts SET total_debt = total_debt - ? WHERE id = ?", [paidDebt, accountId]);
    } catch (error) {
        throw error;
    }
}
