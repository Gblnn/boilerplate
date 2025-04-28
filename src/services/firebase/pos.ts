import { db } from "@/config/firebase";
import {
  Bill,
  BillItem,
  InventoryTransaction,
  Product,
  Customer,
  CustomerPurchase,
} from "@/types/pos";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  getDoc,
  limit,
} from "firebase/firestore";

// Products
export const getProductByBarcode = async (
  barcode: string
): Promise<Product | null> => {
  const q = query(collection(db, "products"), where("barcode", "==", barcode));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Product;
};

export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, "products");
    const productsSnapshot = await getDocs(productsRef);
    return productsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Product)
    );
  } catch (error) {
    console.error("Error fetching all products:", error);
    throw error;
  }
};

export const addProduct = async (
  product: Omit<Product, "id">
): Promise<string> => {
  const docRef = await addDoc(collection(db, "products"), {
    ...product,
    lastRestocked: serverTimestamp(),
  });
  return docRef.id;
};

export const updateProduct = async (
  id: string,
  data: Partial<Product>
): Promise<void> => {
  await updateDoc(doc(db, "products", id), data);
};

// Bills
export const createBill = async (
  items: BillItem[],
  cashierId: string,
  paymentMethod: Bill["paymentMethod"]
): Promise<string> => {
  return await runTransaction(db, async (transaction) => {
    // First, perform all reads
    const productReads = items.map(async (item) => {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const currentStock = productSnap.data().stock;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.name}`);
      }

      return {
        ref: productRef,
        currentStock,
        item,
      };
    });

    // Wait for all reads to complete
    const productData = await Promise.all(productReads);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Create bill reference
    const billRef = doc(collection(db, "bills"));
    const bill: Omit<Bill, "id"> = {
      items,
      subtotal,
      tax,
      total,
      createdAt: new Date(),
      cashierId,
      paymentMethod,
      status: "pending",
    };

    // Now perform all writes
    transaction.set(billRef, bill);

    // Update product stock
    productData.forEach(({ ref, currentStock, item }) => {
      transaction.update(ref, {
        stock: currentStock - item.quantity,
      });

      // Create inventory transaction
      const inventoryTransactionRef = doc(
        collection(db, "inventory_transactions")
      );
      transaction.set(inventoryTransactionRef, {
        productId: item.productId,
        type: "out",
        quantity: item.quantity,
        reason: "sale",
        date: new Date(),
        userId: cashierId,
        billId: billRef.id,
      } as InventoryTransaction);
    });

    return billRef.id;
  });
};

export const completeBill = async (billId: string): Promise<void> => {
  await updateDoc(doc(db, "bills", billId), {
    status: "completed",
  });
};

export const cancelBill = async (billId: string): Promise<void> => {
  return await runTransaction(db, async (transaction) => {
    // First, perform all reads
    const billRef = doc(db, "bills", billId);
    const billSnap = await transaction.get(billRef);

    if (!billSnap.exists()) {
      throw new Error("Bill not found");
    }

    const bill = billSnap.data() as Bill;
    if (bill.status === "cancelled") {
      throw new Error("Bill is already cancelled");
    }

    // Read all product data first
    const productReads = bill.items.map(async (item) => {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Product ${item.productId} not found`);
      }

      return {
        ref: productRef,
        currentStock: productSnap.data().stock,
        item,
      };
    });

    // Wait for all reads to complete
    const productData = await Promise.all(productReads);

    // Now perform all writes
    transaction.update(billRef, { status: "cancelled" });

    // Update product stock and create inventory transactions
    productData.forEach(({ ref, currentStock, item }) => {
      transaction.update(ref, {
        stock: currentStock + item.quantity,
      });

      const inventoryTransactionRef = doc(
        collection(db, "inventory_transactions")
      );
      transaction.set(inventoryTransactionRef, {
        productId: item.productId,
        type: "in",
        quantity: item.quantity,
        reason: "return",
        date: new Date(),
        userId: bill.cashierId,
        billId: billId,
      } as InventoryTransaction);
    });
  });
};

// Inventory
export const restockProduct = async (
  productId: string,
  quantity: number,
  userId: string
): Promise<void> => {
  return await runTransaction(db, async (transaction) => {
    // First, perform read
    const productRef = doc(db, "products", productId);
    const productSnap = await transaction.get(productRef);

    if (!productSnap.exists()) {
      throw new Error("Product not found");
    }

    const currentStock = productSnap.data().stock;

    // Now perform writes
    transaction.update(productRef, {
      stock: currentStock + quantity,
      lastRestocked: new Date(),
    });

    const inventoryTransactionRef = doc(
      collection(db, "inventory_transactions")
    );
    transaction.set(inventoryTransactionRef, {
      productId,
      type: "in",
      quantity,
      reason: "restock",
      date: new Date(),
      userId,
    } as InventoryTransaction);
  });
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  const snapshot = await getDocs(
    query(collection(db, "products"), where("stock", "<=", "minStock"))
  );
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
};

export const getInventoryTransactions = async (
  productId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<InventoryTransaction[]> => {
  let q = query(
    collection(db, "inventory_transactions"),
    orderBy("date", "desc")
  );

  if (productId) {
    q = query(q, where("productId", "==", productId));
  }

  if (startDate) {
    q = query(q, where("date", ">=", startDate));
  }

  if (endDate) {
    q = query(q, where("date", "<=", endDate));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as InventoryTransaction)
  );
};

// Customer functions
export const searchCustomers = async (
  searchTerm: string
): Promise<Customer[]> => {
  const customersRef = collection(db, "customers");
  const q = query(
    customersRef,
    where("name", ">=", searchTerm.toLowerCase()),
    where("name", "<=", searchTerm.toLowerCase() + "\uf8ff"),
    orderBy("name"),
    limit(5)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Customer)
  );
};

export const createCustomer = async (name: string): Promise<Customer> => {
  const customersRef = collection(db, "customers");
  const newCustomer: Omit<Customer, "id"> = {
    name: name.toLowerCase(),
    totalPurchases: 0,
    totalSpent: 0,
    createdAt: new Date(),
  };
  const docRef = await addDoc(customersRef, newCustomer);
  return { id: docRef.id, ...newCustomer };
};

export const updateCustomerPurchaseStats = async (
  customerId: string,
  purchaseAmount: number
) => {
  const customerRef = doc(db, "customers", customerId);
  const customerDoc = await getDoc(customerRef);

  if (customerDoc.exists()) {
    const customer = customerDoc.data() as Customer;
    await updateDoc(customerRef, {
      totalPurchases: customer.totalPurchases + 1,
      totalSpent: customer.totalSpent + purchaseAmount,
      lastPurchaseDate: new Date(),
    });
  }
};

export const createCustomerPurchase = async (
  purchase: Omit<CustomerPurchase, "id">
) => {
  const billsRef = collection(db, "bills");
  const docRef = await addDoc(billsRef, purchase);
  return { id: docRef.id, ...purchase };
};
