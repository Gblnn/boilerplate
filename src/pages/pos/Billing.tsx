import IndexDropDown from "@/components/index-dropdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import { getAllProducts, getProductByBarcode } from "@/services/firebase/pos";
import {
  getCachedProducts,
  saveProductsToCache,
  updateCachedProduct,
} from "@/services/pos/offlineProducts";
import { BillItem, Product } from "@/types/pos";
import { AnimatePresence, motion } from "framer-motion";
import { Box, MinusCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Billing = () => {
  const { user, userData, isOnline } = useAuth();
  const effectiveUser = user || (userData ? { uid: userData.uid } : null);

  const [items, setItems] = useState<BillItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTaxEnabled, setIsTaxEnabled] = useState(true);
  const [productsCache, setProductsCache] = useState<Record<string, Product>>(
    {}
  );
  const [isCacheLoading, setIsCacheLoading] = useState(true);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Initialize products cache from localStorage and fetch fresh data if online
  useEffect(() => {
    console.log(isCacheLoading);
    const initializeProducts = async () => {
      try {
        // First, try to get cached products
        const cachedProducts = getCachedProducts();
        if (cachedProducts) {
          const cache: Record<string, Product> = {};
          cachedProducts.forEach((product) => {
            cache[product.barcode] = product;
          });
          setProductsCache(cache);
          setIsCacheLoading(false);
        }

        // If online, fetch fresh data
        if (isOnline) {
          const products = await getAllProducts();
          const cache: Record<string, Product> = {};
          products.forEach((product) => {
            cache[product.barcode] = product;
          });
          setProductsCache(cache);
          saveProductsToCache(products); // Update the cache with fresh data
        }
      } catch (error) {
        console.error("Error initializing products:", error);
        toast.error("Failed to load products. Some features may be slower.");
      } finally {
        setIsCacheLoading(false);
      }
    };

    if (effectiveUser) {
      initializeProducts();
    }
  }, [effectiveUser, isOnline]);

  // Focus barcode input on mount and after each scan
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [items]);

  // Handle barcode scanner input
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      let product: Product | null = productsCache[barcode];

      if (!product && isOnline) {
        // Only try to fetch from network if we're online
        setLoading(true);
        product = await getProductByBarcode(barcode);

        if (product) {
          // Update both in-memory and localStorage cache
          setProductsCache((prev) => ({
            ...prev,
            [barcode]: product!,
          }));
          updateCachedProduct(product);
        }
      }

      if (!product) {
        toast.error(
          isOnline ? "Product not found" : "Product not found in offline cache"
        );
        return;
      }

      if (product.stock <= 0) {
        toast.error("Product out of stock");
        return;
      }

      // Check if item already exists in bill
      const existingItemIndex = items.findIndex(
        (item) => item.barcode === barcode
      );

      if (existingItemIndex >= 0) {
        // Update quantity if stock allows
        const newQuantity = items[existingItemIndex].quantity + 1;
        if (newQuantity > product.stock) {
          toast.error("Insufficient stock");
          return;
        }

        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity,
          subtotal: product.price * newQuantity,
        };
        setItems(updatedItems);
      } else {
        // Add new item
        const newItem: BillItem = {
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
        };
        setItems([...items, newItem]);
      }

      // Clear barcode input
      setBarcode("");
    } catch (error) {
      toast.error("Error adding product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      subtotal: updatedItems[index].price * quantity,
    };
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCheckout = async (paymentMethod: "cash" | "card") => {
    if (!effectiveUser) {
      toast.error("Please log in");
      return;
    }

    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (paymentMethod === "cash") {
      toast.error("Cash payment is not available");
      return;
    }

    try {
      setLoading(true);
      // const billId = await createBill(items, effectiveUser.uid, paymentMethod);
      toast.success("Bill created successfully");
      setItems([]);
    } catch (error: any) {
      toast.error(error.message || "Error creating bill");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = isTaxEnabled ? subtotal * 0.05 : 0; // 5% tax when enabled
  const total = subtotal + tax;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side - Items List */}
        <div className="flex-1 md:w-2/3 flex flex-col overflow-hidden">
          <div
            style={{
              boxShadow: "1px 1px 10px rgba(0 0 0/ 10%)",
              padding: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(100 100 100/ 40%)",
            }}
            className="px-3 py-2 "
          >
            {/* <Back /> */}
            <h2
              style={{ marginLeft: "0.75rem" }}
              className="text-lg font-semibold"
            >
              Billing
            </h2>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <button>
                <Box />
              </button>
              <IndexDropDown />
            </div>
          </div>

          {/* Scrollable Items List */}
          <div className="flex-1 overflow-y-auto p-2">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={`${item.barcode}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex items-center border rounded-lg mb-2 hover:shadow-sm transition-shadow"
                >
                  <button
                    style={{ marginLeft: "0.75rem", marginRight: "0.25rem" }}
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 text-red-500 hover:text-red-600"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </button>
                  {/* Item Details */}
                  <div className="flex-1 min-w-0 p-2">
                    <h3
                      style={{ fontSize: "0.8rem" }}
                      className="font-medium truncate"
                    >
                      {item.name}
                    </h3>
                    <p
                      style={{ fontSize: "0.8rem", opacity: 0.5 }}
                      className="text-sm "
                    >
                      {item.price.toFixed(3)} each
                    </p>
                  </div>

                  {/* Quantity Controls and Price */}
                  <div className="flex items-center gap-2 px-2">
                    <div
                      style={{ marginRight: "0.25rem" }}
                      className="text-right min-w-[80px] text-sm font-medium "
                    >
                      OMR {item.subtotal.toFixed(3)}
                    </div>
                    <div className="flex items-center rounded-lg">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            index,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        className="p-1.5 text-gray-600 hover:text-gray-800 disabled:text-gray-300"
                        disabled={item.quantity <= 1}
                      >
                        <Icons.minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium text-sm ">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(index, item.quantity + 1)
                        }
                        className="p-1.5 text-gray-600 hover:text-gray-800"
                      >
                        <Icons.plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Icons.banknote className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No items added to bill</p>
              </div>
            )}
          </div>
          {/* Bottom Bar with Barcode Input */}
          <div
            style={{ boxShadow: "1px 1px 10px rgba(0, 0, 0, 0.2)" }}
            className="sticky bottom-0 w-full  border-t"
          >
            <form
              onSubmit={handleBarcodeSubmit}
              className="p-3"
              style={{ borderBottom: "1px solid rgba(100 100 100/ 50%)" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
                className=""
              >
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan barcode or enter product code..."
                  className="w-full pl-8 pr-3 py-2 border rounded focus:outline-none focus:border-blue-500 text-sm"
                  disabled={loading}
                />
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Summary and Actions */}
        <div className="md:w-[350px] bg-white dark:bg-gray-800 md:border-l dark:border-gray-700">
          <div className="p-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Bill Summary
            </h3>
          </div>

          <div className="p-3 space-y-4">
            {/* Summary Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-800 dark:text-gray-200">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal
                </span>
                <span>OMR {subtotal.toFixed(3)}</span>
              </div>

              {/* Tax Toggle and Amount */}
              <div className="flex items-center justify-between text-gray-800 dark:text-gray-200">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isTaxEnabled}
                    onCheckedChange={() => setIsTaxEnabled(!isTaxEnabled)}
                    id="tax-toggle"
                  />
                  <label
                    htmlFor="tax-toggle"
                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  >
                    Tax (5%)
                  </label>
                </div>
                <span>OMR {tax.toFixed(3)}</span>
              </div>

              <div className="h-px bg-gray-200 dark:bg-gray-700" />
              <div className="flex justify-between text-lg font-bold text-gray-800 dark:text-gray-200">
                <span>Total</span>
                <span>OMR {total.toFixed(3)}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="default"
                  onClick={() => handleCheckout("cash")}
                  disabled={loading || items.length === 0}
                >
                  <Icons.banknote className="h-4 w-4" />
                  {loading ? (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    "Checkout"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCheckout("card")}
                  disabled={loading || items.length === 0}
                >
                  <Icons.creditCard className="h-4 w-4" />
                  {loading ? (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    "Credit"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
