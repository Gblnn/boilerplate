import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icons } from "@/components/ui/icons";
import { motion } from "framer-motion";
import "./Login.css";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await signIn(email, password);
      navigate("/");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
      <div style={{ display: "flex", padding: "1.25rem", height: "100svh" }}>
        <div
          className="desktop-only"
          style={{
            border: "",
            flex: 1,
            background:
              "linear-gradient(rgba(0 0 0/ 0%), rgba(100 100 100/ 10%) )",
            alignItems: "flex-end",
            borderRadius: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              border: "",
              alignItems: "center",
              margin: "2rem",
              gap: "0.5rem",
            }}
          >
            <img src="/arc-logo.png" style={{ width: "4rem", border: "" }} />
            <div style={{ display: "flex", flexFlow: "column" }}>
              <p style={{ fontWeight: 400, fontSize: "2.25rem" }}></p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            flexFlow: "column",
            border: "",
          }}
        >
          <div
            className="md:w-1/2"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexFlow: "column",
              border: "",
              borderRadius: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                border: "",
                borderRadius: "1rem",
                padding: "",
                flexFlow: "column",
                width: "100%",
                gap: "0.75rem",
                marginTop: "2rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <p
                  style={{
                    top: 0,
                    left: 0,
                    fontSize: "2rem",
                    fontWeight: "600",
                    border: "",
                    width: "",
                    paddingLeft: "0.5rem",
                    marginTop: "",
                  }}
                >
                  Sign In
                </p>
                {/* <p>v2.3</p> */}
              </div>

              <br />

              <input
                autoComplete="email"
                id="email"
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email Address"
              />

              <input
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
              />
              <p />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  justifyContent: "",
                  paddingRight: "1rem",
                  paddingLeft: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    border: "",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Link
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "crimson",
                      cursor: "pointer",
                    }}
                    to="/forgot-password"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <p />
              <button
                onClick={handleSubmit}
                className={isLoading ? "disabled" : ""}
                style={{
                  background: "crimson",
                  color: "white",
                  display: "flex",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  border: "none",

                  fontWeight: "500",
                }}
              >
                {isLoading ? (
                  <Icons.spinner className="h-4 w-4 animate-spin" />
                ) : null}
                LOGIN
                <Icons.chevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={signInWithGoogle}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",

                  fontWeight: "500",
                }}
              >
                <Icons.google className="h-4 w-4" />
                Continue with Google
              </button>
            </div>

            <br />
            <br />
            <br />

            <div
              style={{
                display: "flex",
                flexFlow: "column",
                gap: "0.5rem",
                bottom: 0,
                width: "100%",
              }}
            >
              <p style={{ opacity: 0.5, fontSize: "0.65rem", border: "" }}>
                If you do not have an account you can request for one. You will
                be granted access to create an account once your request is
                processed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
