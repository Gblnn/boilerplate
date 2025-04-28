export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  minStock?: number;
  lastRestocked?: Date;
}

export interface BillItem {
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Bill {
  id: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  cashierId: string;
  paymentMethod: "cash" | "card";
  status: "pending" | "completed" | "cancelled";
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: "in" | "out";
  quantity: number;
  reason: "sale" | "restock" | "return" | "adjustment";
  date: Date;
  userId: string;
  billId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
}

export interface CustomerPurchase {
  id: string;
  customerId: string;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card";
  date: Date;
  userId: string;
  userName: string;
}
