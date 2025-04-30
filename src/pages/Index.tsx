import Directive from "@/components/directive";
import IndexDropDown from "@/components/index-dropdown";
// import IndexDropDown from "@/components/index-dropdown";
import {
  Book,
  Box,
  DollarSign,
  Target,
  Ticket,
  Truck,
  UserRoundCog,
} from "lucide-react";
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
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
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
              padding: "1rem",
              width: "100%",
              marginLeft: "0.5rem",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Target color="crimson" />
              <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>PointSale</p>
              <p style={{ fontSize: "0.8rem", fontWeight: 400, opacity: 0.5 }}>
                v1.1
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                style={{
                  fontSize: "0.8rem",
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                }}
                onClick={() => navigate("/user-management")}
              >
                <UserRoundCog width={"1.25rem"} />
                Users
              </button>
              <IndexDropDown />
            </div>
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
          {/* <Directive
            onClick={() => navigate("/user-management")}
            title={"Manage Users"}
            icon={<Users width={"1.25rem"} />}
          /> */}
          <Directive
            onClick={() => navigate("/billing")}
            title={"Billing"}
            icon={<DollarSign color="crimson" />}
          />
          <Directive
            onClick={() => navigate("/inventory")}
            title={"Inventory"}
            icon={<Box color="crimson" />}
          />
          <Directive
            onClick={() => navigate("/suppliers")}
            title={"Suppliers"}
            icon={<Truck color="crimson" />}
          />
          <Directive
            onClick={() => navigate("/credit-book")}
            title={"Credit Book"}
            icon={<Book color="crimson" />}
            tag={""}
          />
          <Directive
            onClick={() => navigate("/bills")}
            title={"Bills"}
            icon={<Ticket color="crimson" />}
          />
        </div>
      </div>
    </>
  );
}
