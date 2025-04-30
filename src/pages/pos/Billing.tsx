import Back from "@/components/back";
import IndexDropDown from "@/components/index-dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icons";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  createCustomer,
  createCustomerPurchase,
  getAllProducts,
  getProductByBarcode,
  searchCustomers,
  updateCustomerPurchaseStats,
  updateProductStock,
} from "@/services/firebase/pos";
import {
  getCachedCustomers,
  saveCustomersToCache,
  updateCachedCustomer,
} from "@/services/pos/offlineCustomers";
import {
  getCachedProducts,
  saveProductsToCache,
  updateCachedProduct,
} from "@/services/pos/offlineProducts";
import { BillItem, Customer, CustomerPurchase, Product } from "@/types/pos";
import { collection, getDocs } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftToLine,
  Barcode,
  Box,
  Check,
  ChevronUp,
  LoaderCircle,
  MinusCircle,
  UserPlus,
} from "lucide-react";
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
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  // const [stockSortBy, setStockSortBy] = useState<"name" | "stock" | "price">(
  //   "name"
  // );
  // const [stockSortOrder, setStockSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>(
    []
  );
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerSuggestionsRef = useRef<HTMLDivElement>(null);
  const [customersCache, setCustomersCache] = useState<
    Record<string, Customer>
  >({});
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

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

  // Initialize customers cache from localStorage and fetch fresh data if online
  useEffect(() => {
    const initializeCustomers = async () => {
      try {
        // Load from cache first
        const cachedCustomers = getCachedCustomers();
        setCustomersCache(cachedCustomers);

        // If online, fetch fresh data
        if (isOnline) {
          const customersRef = collection(db, "customers");
          const snapshot = await getDocs(customersRef);
          const customers: Record<string, Customer> = {};

          snapshot.forEach((doc) => {
            customers[doc.id] = { id: doc.id, ...doc.data() } as Customer;
          });

          setCustomersCache(customers);
          saveCustomersToCache(customers);
        }
      } catch (error) {
        console.error("Error initializing customers:", error);
        toast.error("Failed to load customers");
      } finally {
      }
    };

    initializeCustomers();
  }, [isOnline]);

  // Focus barcode input on mount and after each scan
  useEffect(() => {
    const handleFocus = () => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };

    // Only focus when items are added or removed, not when quantity changes
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      if (lastItem.quantity === 1) {
        handleFocus();
      }
    } else {
      handleFocus();
    }
  }, [items.length]); // Only depend on items.length, not the entire items array

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

  // Handle customer search
  const handleCustomerSearch = async (value: string) => {
    setCustomerName(value);
    if (value.length > 0) {
      try {
        // First check cache
        const cachedMatches = Object.values(customersCache).filter((customer) =>
          customer.name.toLowerCase().includes(value.toLowerCase())
        );

        if (cachedMatches.length > 0) {
          setCustomerSuggestions(cachedMatches.slice(0, 5));
          setShowCustomerSuggestions(true);
          return;
        }

        // If no matches in cache and online, search database
        if (isOnline) {
          const dbMatches = await searchCustomers(value);
          setCustomerSuggestions(dbMatches);
          setShowCustomerSuggestions(true);
        }
      } catch (error) {
        console.error("Error searching customers:", error);
        toast.error("Failed to search customers");
      }
    } else {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setShowCustomerSuggestions(false);
  };

  // Handle customer creation
  const handleCustomerCreate = async () => {
    if (!customerName.trim()) return;

    try {
      setLoading(true);
      const newCustomer = await createCustomer(customerName.trim());
      setSelectedCustomer(newCustomer);
      setCustomerName(newCustomer.name);

      // Update cache
      updateCachedCustomer(newCustomer);
      setCustomersCache((prev) => ({
        ...prev,
        [newCustomer.id]: newCustomer,
      }));

      toast.success("New customer added");
      setLoading(false);
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Failed to create customer");
    }
  };

  // Close customer suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerSuggestionsRef.current &&
        !customerSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowCustomerSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle input change for search
  const handleSearchChange = (value: string) => {
    setBarcode(value);
    if (value.length > 0) {
      const matches = Object.values(productsCache).filter(
        (product) =>
          product.name.toLowerCase().includes(value.toLowerCase()) ||
          product.barcode.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matches.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Product out of stock");
      return;
    }

    // Check if item already exists in bill
    const existingItemIndex = items.findIndex(
      (item) => item.barcode === product.barcode
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

    // Clear barcode input and suggestions
    setBarcode("");
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter and sort products for stock dialog
  const filteredAndSortedProducts = Object.values(productsCache).filter(
    (product) =>
      product.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(stockSearchQuery.toLowerCase())
  );
  // .sort((a, b) => {
  //   if (stockSortBy === "name") {
  //     return stockSortOrder === "asc"
  //       ? a.name.localeCompare(b.name)
  //       : b.name.localeCompare(a.name);
  //   } else if (stockSortBy === "stock") {
  //     return stockSortOrder === "asc" ? a.stock - b.stock : b.stock - a.stock;
  //   } else {
  //     return stockSortOrder === "asc" ? a.price - b.price : b.price - a.price;
  //   }
  // });

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [stockSearchQuery]);

  // Modify handleCheckout to include customer information
  const handleCheckout = async (paymentMethod: "cash" | "card") => {
    if (!effectiveUser) {
      toast.error("Please log in");
      return;
    }

    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!selectedCustomer) {
      toast.error("Please select or create a customer");
      return;
    }

    try {
      setLoading(true);

      // Create customer purchase record
      const purchase: Omit<CustomerPurchase, "id"> = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        items,
        subtotal,
        tax,
        total,
        paymentMethod,
        date: new Date(),
        userId: effectiveUser.uid,
        userName: userData?.displayName || "Unknown",
      };

      // Update inventory for each item
      for (const item of items) {
        // Update local cache first for instant UI update
        const product = productsCache[item.barcode];
        if (product) {
          const updatedProduct = {
            ...product,
            stock: Math.max(0, product.stock - item.quantity),
          };

          // Update in-memory cache
          setProductsCache((prev) => ({
            ...prev,
            [item.barcode]: updatedProduct,
          }));

          // Update localStorage cache
          updateCachedProduct(updatedProduct);

          if (isOnline) {
            // Update database
            try {
              await updateProductStock(item.productId, item.quantity);
            } catch (error) {
              console.error("Error updating product stock:", error);
              toast.error("Failed to update product stock in database");
            }
          }
        }
      }

      // Create purchase record and update customer stats
      if (isOnline) {
        await createCustomerPurchase(purchase);
        await updateCustomerPurchaseStats(selectedCustomer.id, total);
      } else {
        // In offline mode, store the purchase in local storage
        const offlinePurchases = JSON.parse(
          localStorage.getItem("offlinePurchases") || "[]"
        );
        offlinePurchases.push(purchase);
        localStorage.setItem(
          "offlinePurchases",
          JSON.stringify(offlinePurchases)
        );
      }

      toast.success("Purchase recorded successfully");
      setItems([]);
      setCustomerName("");
      setSelectedCustomer(null);
    } catch (error: any) {
      toast.error(error.message || "Error processing purchase");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = isTaxEnabled ? subtotal * 0.05 : 0; // 5% tax when enabled
  const total = subtotal + tax;

  const handleClearItems = () => {
    if (items.length === 0) return;
    setItems([]);
    toast.success("All items cleared from bill");
  };

  return (
    <div
      style={{ height: "" }}
      className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200"
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side - Items List */}
        <div className="flex-1 md:w-2/3 flex flex-col overflow-hidden">
          <div
            style={{
              boxShadow: "1px 1px 10px rgba(0 0 0/ 10%)",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(100 100 100/ 40%)",
              position: "sticky",
              top: 0,
              zIndex: 40,
            }}
            className="px-3 py-2 dark:bg-gray-950"
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {userData?.role === "admin" && <Back />}
              {/* <Target color="crimson" /> */}
              <h2 style={{ marginLeft: "", fontSize: "1.5rem" }} className=" ">
                Billing
              </h2>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                border: "",
              }}
            >
              <button
                style={{ height: "2.5rem", width: "2.5rem" }}
                onClick={() => setShowStockDialog(true)}
                className=" hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Box className="h-5 w-5" />
              </button>
              <IndexDropDown />
            </div>
          </div>

          {/* Scrollable Items List */}
          <div
            style={{
              height: "calc(100vh - 12rem)",
              paddingTop: "0.5rem",
              paddingBottom: "0.5rem",
              padding: "0.75rem",
            }}
            className="overflow-y-auto"
          >
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
                      {item.price.toFixed(3)}
                    </p>
                  </div>

                  {/* Quantity Controls and Price */}
                  <div className="flex items-center gap-2 px-2">
                    <div
                      style={{ marginRight: "0.25rem" }}
                      className="text-right min-w-[80px] text-sm font-medium "
                    >
                      {item.subtotal.toFixed(3)}
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
                      <input
                        type="number"
                        min="1"
                        max={productsCache[item.barcode]?.stock || 999}
                        value={item.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          // Allow empty string for typing
                          if (value === "") {
                            handleQuantityChange(index, 1);
                            return;
                          }
                          const newQuantity = parseInt(value);
                          if (
                            !isNaN(newQuantity) &&
                            newQuantity > 0 &&
                            newQuantity <=
                              (productsCache[item.barcode]?.stock || 999)
                          ) {
                            handleQuantityChange(index, newQuantity);
                          }
                        }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          // Ensure a valid value when input loses focus
                          const value = e.target.value;
                          if (value === "" || parseInt(value) < 1) {
                            handleQuantityChange(index, 1);
                          }
                        }}
                        className="w-12 text-center font-medium text-sm border-none focus:outline-none focus:ring-0 bg-transparent"
                      />
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
            style={{
              boxShadow: "1px 1px 10px rgba(0, 0, 0, 0.2)",
              borderTop: "1px solid rgba(100 100 100/ 20%)",
              borderBottom: "1px solid rgba(100 100 100/ 20%)",
              position: "fixed",
              padding: "0.5rem",
              // marginBottom: "1.5rem",
              marginBottom: "env(safe-area-inset-bottom)",
              bottom: 0,
              left: 0,
              right: 0,
              background: "",
              zIndex: 30,
            }}
            className={`md:relative dark:bg-gray-950 ${
              isSummaryVisible ? "md:w-[calc(100%-350px)]" : "md:w-full"
            } md:transition-all md:duration-300 md:ease-in-out`}
          >
            <form onSubmit={handleBarcodeSubmit} className="p-2 space-y-2">
              {/* Customer Input */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                className="relative"
              >
                <input
                  ref={customerInputRef}
                  type="text"
                  value={customerName}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full pl-8 pr-3 py-1.5 border rounded focus:outline-none focus:border-blue-500 text-sm"
                />
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div
                    ref={customerSuggestionsRef}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50"
                  >
                    {customerSuggestions.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.totalPurchases} purchases • OMR{" "}
                          {customer.totalSpent.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {customerName && (
                  <button
                    style={{
                      paddingLeft: "1rem",
                      paddingRight: "1rem",
                      fontSize: "0.8rem",
                      width: "10rem",
                    }}
                    type="button"
                    onClick={handleCustomerCreate}
                    className=" text-sm text-blue-500 hover:text-blue-600"
                  >
                    {loading ? (
                      <LoaderCircle className="animate-spin" width={"1rem"} />
                    ) : (
                      <UserPlus width={"1rem"} />
                    )}
                    Add New
                  </button>
                )}
              </div>

              {/* Barcode Input */}
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Scan barcode or search by product name..."
                  className="w-full pl-8 pr-3 py-1.5 border rounded focus:outline-none focus:border-blue-500 text-sm"
                  disabled={loading}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50"
                  >
                    {suggestions.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSuggestionClick(product)}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            OMR {product.price.toFixed(3)}
                          </div>
                        </div>
                        {/* <div className="text-sm font-medium">
                        Barcode: {product.barcode}
                        </div> */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Summary and Actions */}
        <div
          style={{ marginBottom: "1rem" }}
          className={`${
            isSummaryVisible ? "md:w-[350px]" : "md:w-0"
          } bg-white dark:bg-gray-950 md:border-l dark:border-gray-700 transition-all duration-300 ease-in-out ${
            isSummaryVisible ? "translate-y-0" : "translate-y-[100vh]"
          } fixed md:relative bottom-0 left-0 right-0 md:left-auto md:right-auto md:bottom-auto z-30 overflow-hidden`}
        >
          <div
            style={{ display: "flex", alignItems: "center" }}
            className="p-3 flex gap-2 align-middle justify-between"
          >
            <h3
              style={{ fontSize: "1.25rem" }}
              className=" font-semibold text-gray-800 dark:text-gray-200"
            >
              Bill Summary
            </h3>
            <div className="flex items-center gap-2">
              <button
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                  fontSize: "0.8rem",
                  height: "2rem",
                  opacity: items.length === 0 ? 0.5 : 1,
                }}
                onClick={handleClearItems}
                disabled={items.length === 0}
              >
                <MinusCircle width={"1rem"} />
                Clear Bill
              </button>
              <button
                onClick={() => setIsSummaryVisible(!isSummaryVisible)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronUp
                  className={`h-4 w-4 transition-transform ${
                    isSummaryVisible ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
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
                <div
                  onClick={() => setIsTaxEnabled(!isTaxEnabled)}
                  style={{ alignItems: "center" }}
                  className="flex items-center gap-2"
                >
                  <div
                    style={{
                      display: "flex",
                      width: "1.25rem",
                      height: "1.25rem",
                      borderRadius: "0.25rem",
                      background: "rgba(100 100 100/ 20%)",
                      justifyContent: "center",
                      alignItems: "center",
                      transition: "0.3s",
                    }}
                  >
                    {isTaxEnabled && <Check width={"0.8rem"} />}
                  </div>
                  <label
                    htmlFor="tax-toggle"
                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  >
                    Tax (5%)
                  </label>
                </div>
                <span>OMR {tax.toFixed(3)}</span>
              </div>

              <div
                style={{ opacity: 0.5, marginTop: "0.5rem" }}
                className="h-px bg-gray-200 dark:bg-gray-700"
              />

              <div
                style={{
                  fontSize: "1.25rem",
                  border: "",
                  letterSpacing: "0.05rem",
                }}
              >
                <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
                  <span>Total</span>
                  <span>OMR {total.toFixed(3)}</span>
                </div>
              </div>

              {/* Clear Items Button */}
            </div>

            {/* Payment Methods */}
            <div style={{}} className="">
              <div
                style={{ marginBottom: "0.35rem" }}
                className="flex grid-cols-2 gap-2 h-11"
              >
                <button
                  style={{ flex: 1 }}
                  onClick={() => handleCheckout("card")}
                  disabled={loading || items.length === 0}
                >
                  <Icons.creditCard className="h-4 w-4" />
                  {loading ? (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    "Credit"
                  )}
                </button>
                <button
                  style={{ flex: 1, background: "crimson", color: "white" }}
                  onClick={() => handleCheckout("cash")}
                  disabled={loading || items.length === 0}
                >
                  <Icons.banknote className="h-4 w-4" />
                  {loading ? (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  ) : (
                    "Checkout"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="bg-gray-50 dark:bg-gray-950 max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Current Stock</DialogTitle>
          </DialogHeader>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex flex-col gap-4 p-4">
              {paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div>
                    <h3 style={{ width: "12rem" }} className="font-medium">
                      {product.name}
                    </h3>
                    <p
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        alignItems: "center",
                      }}
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      <Barcode width={"1rem"} />
                      {product.barcode}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Stock
                      </p>
                      <p
                        className={`font-medium ${
                          product.stock <= (product.minStock || 10)
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {product.stock}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search and Pagination Controls */}
          <div className="flex flex-col gap-4 bg-gray-50 dark:bg-gray-950 p-4 border-t">
            <div className="relative">
              <input
                type="text"
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-8 pr-3 py-2 border rounded focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {paginatedProducts.length} of{" "}
                  {filteredAndSortedProducts.length} products
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
                  >
                    <Icons.chevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
                  >
                    <Icons.chevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <DialogDescription />
        </DialogContent>
      </Dialog>

      {/* Add persistent toggle button when summary is hidden */}
      {!isSummaryVisible && (
        <div
          style={{
            border: "",

            position: "absolute",
            bottom: 0,
            right: 0,
          }}
        >
          <button
            style={{
              margin: "1.25rem",
              marginBottom: "9rem",
            }}
            onClick={() => setIsSummaryVisible(true)}
            className=" bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-20"
          >
            <ArrowLeftToLine className="h-6 w-6 rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
};
