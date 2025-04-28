import Directive from "@/components/directive";
import IndexDropDown from "@/components/index-dropdown";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Index() {
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
          <div
            style={{
              display: "flex",
              border: "1px solid red",
              width: "100%",
              marginLeft: "1rem",
              marginRight: "1rem",
              justifyContent: "space-between",
            }}
          >
            <p>mk</p>
            <IndexDropDown />
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
