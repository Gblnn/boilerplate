import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types/pos";
import {
  getAllProducts,
  updateProduct,
  addProduct,
} from "@/services/firebase/pos";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/ui/icons";
import {
  getCachedProducts,
  saveProductsToCache,
  updateCachedProduct,
} from "@/services/pos/offlineProducts";
import { Barcode, Box, Package } from "lucide-react";
import Back from "@/components/back";

interface NewProduct {
  barcode: string;
  name: string;
  price: string;
  stock: string;
  category: string;
  minStock: string;
}

const initialNewProduct: NewProduct = {
  barcode: "",
  name: "",
  price: "",
  stock: "",
  category: "",
  minStock: "",
};

export const Inventory = () => {
  const { user, isOnline } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>(initialNewProduct);

  // Debounced search implementation without lodash
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const handleSearch = (value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Load products from cache and/or network
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        // First try to get cached products
        const cachedProducts = getCachedProducts();
        if (cachedProducts) {
          setProducts(cachedProducts);
          setLoading(false);
        }

        // If online, fetch fresh data
        if (isOnline) {
          const freshProducts = await getAllProducts();
          setProducts(freshProducts);
          saveProductsToCache(freshProducts);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [isOnline]);

  // Handle stock update
  const handleStockUpdate = async (
    productId: string,
    currentStock: number,
    change: number
  ) => {
    if (!isOnline) {
      toast.error("Cannot update stock while offline");
      return;
    }

    const newStock = Math.max(0, currentStock + change);
    try {
      setLoading(true);
      await updateProduct(productId, { stock: newStock });

      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );

      // Update cache
      const updatedProduct = products.find((p) => p.id === productId);
      if (updatedProduct) {
        updateCachedProduct({ ...updatedProduct, stock: newStock });
      }

      toast.success("Stock updated successfully");
    } catch (error) {
      toast.error("Failed to update stock");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLowStock = !filterLowStock || product.stock < 10;
      return matchesSearch && matchesLowStock;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const order = sortOrder === "asc" ? 1 : -1;
      return typeof aValue === "string"
        ? aValue.localeCompare(bValue as string) * order
        : ((aValue as number) - (bValue as number)) * order;
    });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast.error("Cannot add products while offline");
      return;
    }

    try {
      setLoading(true);
      const productData = {
        barcode: newProduct.barcode,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: newProduct.category,
        minStock: parseInt(newProduct.minStock),
      };

      await addProduct(productData);

      // Refresh products list
      const freshProducts = await getAllProducts();
      setProducts(freshProducts);
      saveProductsToCache(freshProducts);

      setShowAddModal(false);
      setNewProduct(initialNewProduct);
      toast.success("Product added successfully");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 space-y-4">
        <div
          style={{ justifyContent: "space-between" }}
          className="flex items-center"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Back />
            {/* <Package className="text-gray-800 dark:text-gray-200" /> */}
            <h1 className="font-semibold text-gray-800 dark:text-gray-200">
              Inventory
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {/* <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filterLowStock
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              Low Stock
            </button> */}
            {/* <select
              style={{ color: "black", background: "rgba(100 100 100/ 0.1)" }}
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "name" | "stock" | "price")
              }
              className="px-3 py-1.5 rounded text-sm border bg-white focus:outline-none "
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock</option>
              <option value="price">Sort by Price</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1.5 rounded hover:bg-gray-100"
            >
              {sortOrder === "asc" ? (
                <Icons.chevronRight className="h-4 w-4 rotate-[-90deg]" />
              ) : (
                <Icons.chevronRight className="h-4 w-4 rotate-90" />
              )}
            </button> */}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search products by name or barcode..."
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Products List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredAndSortedProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start w-full">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3
                        style={{ fontSize: "0.9rem" }}
                        className="font-medium text-gray-800 dark:text-gray-200 truncate"
                      >
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                        <Barcode
                          className="text-gray-800 dark:text-gray-200"
                          width={"1rem"}
                        />
                        {product.barcode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* <p style={{ color: "gray" }}>Stock</p> */}
                    <div style={{ fontWeight: "600" }}>
                      <div className="text-gray-800 dark:text-gray-200">
                        OMR {product.price.toFixed(3)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Box
                        className="text-gray-800 dark:text-gray-200"
                        width={"1.1rem"}
                      />
                      {/* <button
                        onClick={() =>
                          handleStockUpdate(product.id, product.stock, -1)
                        }
                        disabled={!isOnline || product.stock <= 0}
                        className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      >
                        <Icons.minus className="h-4 w-4" />
                      </button> */}

                      <span
                        className={`font-medium ${
                          product.stock < 10
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {product.stock}
                      </span>
                      {/* <button
                        onClick={() =>
                          handleStockUpdate(product.id, product.stock, 1)
                        }
                        disabled={!isOnline}
                        className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      >
                        <Icons.plus className="h-4 w-4" />
                      </button> */}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredAndSortedProducts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <Icons.search className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No products found</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}
        <button
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            margin: "2rem",
            padding: "0.75rem 1rem",
          }}
          onClick={() => setShowAddModal(true)}
          className="rounded text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900"
        >
          <Icons.plus className="h-4 w-4 inline-block mr-1" />
          Add Product
        </button>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-gray-900/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Add New Product
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Icons.close className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                {/* Form fields */}
                {[
                  "Barcode",
                  "Name",
                  "Price (OMR)",
                  "Initial Stock",
                  "Category",
                  "Minimum Stock Level",
                ].map((label) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {label}
                    </label>
                    <input
                      type={
                        label.includes("Price") || label.includes("Stock")
                          ? "number"
                          : "text"
                      }
                      step={label.includes("Price") ? "0.001" : "1"}
                      min="0"
                      value={
                        newProduct[
                          label.toLowerCase().split(" ")[0] as keyof NewProduct
                        ]
                      }
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          [label.toLowerCase().split(" ")[0]]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      required
                    />
                  </div>
                ))}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border dark:border-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <Icons.spinner className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      "Add Product"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
