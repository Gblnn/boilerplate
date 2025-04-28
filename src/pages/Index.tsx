import Directive from "@/components/directive";
import IndexDropDown from "@/components/index-dropdown";
// import IndexDropDown from "@/components/index-dropdown";
import { Book, Box, DollarSign, Truck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const navigate = useNavigate();
  return (
    <>
      <div
        className="bg-white dark:bg-gray-950"
        style={{
          display: "flex",
          background: "",
          height: "100svh",
          flexFlow: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            border: "",
            height: "",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "1px 1px 20px rgba(0 0 0/ 20%)",
            borderBottom: "1px solid rgba(100 100 100/ 20%)",
          }}
        >
          <div
            style={{
              display: "flex",
              // border: "1px solid red",
              padding: "0.75rem",
              width: "100%",
              marginLeft: "1rem",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>PointSale</p>
            <IndexDropDown />
          </div>
        </div>
        <div
          className="bg-gray-50 dark:bg-gray-950"
          style={{
            border: "",
            height: "100%",
            display: "flex",
            flexFlow: "column",
            padding: "1.25rem",
            gap: "0.5rem",
          }}
        >
          <Directive
            onClick={() => navigate("/user-management")}
            title={"Manage Users"}
            icon={<Users width={"1.25rem"} />}
          />
          <Directive
            onClick={() => navigate("/billing")}
            title={"Billing"}
            icon={<DollarSign width={"1.25rem"} />}
          />
          <Directive
            onClick={() => navigate("/inventory")}
            title={"Inventory"}
            icon={<Box width={"1.25rem"} />}
          />
          <Directive
            onClick={() => navigate("/billing")}
            title={"Suppliers"}
            icon={<Truck width={"1.25rem"} />}
          />
          <Directive
            onClick={() => navigate("/billing")}
            title={"Credit Book"}
            icon={<Book width={"1.25rem"} />}
          />
        </div>
      </div>
    </>
  );
}
