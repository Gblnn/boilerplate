import Back from "@/components/back";
import Directive from "@/components/directive";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserManagement() {
  const navigate = useNavigate();
  return (
    <>
      <div
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
            height: "4rem",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "1px 1px 20px rgba(0 0 0/ 20%)",
            borderBottom: "1px solid rgba(100 100 100/ 50%)",
          }}
        >
          <div style={{ border: "", marginLeft: "1rem" }}>
            <Back />
          </div>
        </div>
        <div
          style={{
            border: "",
            height: "100%",
            display: "flex",
            flexFlow: "column",
            padding: "1.25rem",
          }}
        >
          <Directive
            onClick={() => navigate("/user-management")}
            title={"Manage Users"}
            icon={<Users width={"1.25rem"} />}
          />
        </div>
      </div>
    </>
  );
}
