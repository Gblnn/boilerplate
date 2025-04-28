import Back from "@/components/back";
import Directive from "@/components/directive";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { addSupplier, getAllSuppliers } from "@/services/firebase/supplier";
import { Supplier } from "@/types/supplier";
import { Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getAllSuppliers();
      setSuppliers(data);
    } catch (error) {
      toast.error("Failed to load suppliers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async () => {
    try {
      setLoading(true);
      await addSupplier(newSupplier);
      toast.success("Supplier added successfully");
      setShowAddSupplier(false);
      setNewSupplier({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
      });
      await loadSuppliers();
    } catch (error) {
      toast.error("Failed to add supplier");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDrawer(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Back />
          <h1 style={{ fontSize: "1.25" }}>Suppliers</h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative p-3 border-b dark:border-gray-800">
        <Input
          type="text"
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      {/* Suppliers List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {suppliers
          .filter(
            (supplier) =>
              supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              supplier.contactPerson
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
          )
          .map((supplier) => (
            <Directive
              key={supplier.id}
              title={supplier.name}
              subtext={supplier.contactPerson}
              tag={supplier.status}
              onClick={() => handleSupplierClick(supplier)}
              icon={<Truck />}
            />
          ))}
      </div>

      <div
        style={{ position: "absolute", bottom: 0, right: 0, margin: "1.5rem" }}
        className="flex items-center gap-4"
      >
        <Button onClick={() => setShowAddSupplier(true)}>
          <Icons.plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Supplier Details Drawer */}
      <Drawer open={showDrawer} onOpenChange={setShowDrawer}>
        <DrawerContent className="bg-white dark:bg-gray-950">
          <DrawerHeader>
            <DrawerTitle>{selectedSupplier?.name}</DrawerTitle>
            <DrawerDescription>
              Contact: {selectedSupplier?.contactPerson}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                {selectedSupplier?.email}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">
                {selectedSupplier?.phone}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Address</p>
              <p className="text-sm text-muted-foreground">
                {selectedSupplier?.address}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {selectedSupplier?.status}
              </p>
            </div>
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setShowDrawer(false)}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Add Supplier Dialog */}
      <Drawer open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add New Supplier</DrawerTitle>
            <DrawerDescription>
              Enter the supplier's details below.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6 space-y-4">
            <Input
              placeholder="Supplier Name"
              value={newSupplier.name}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, name: e.target.value })
              }
            />
            <Input
              placeholder="Contact Person"
              value={newSupplier.contactPerson}
              onChange={(e) =>
                setNewSupplier({
                  ...newSupplier,
                  contactPerson: e.target.value,
                })
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={newSupplier.email}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, email: e.target.value })
              }
            />
            <Input
              placeholder="Phone"
              type="tel"
              value={newSupplier.phone}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, phone: e.target.value })
              }
            />
            <Input
              placeholder="Address"
              value={newSupplier.address}
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, address: e.target.value })
              }
            />
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setShowAddSupplier(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier} disabled={loading}>
              {loading ? "Adding..." : "Add Supplier"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
