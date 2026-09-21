import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { apiRequest } from "../../apiClient";

export function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Activation de votre compte...");

  useEffect(() => {
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");

    console.log("=== ACTIVATION COMPTE ===");
    console.log("UID :", uid);
    console.log("TOKEN :", token ? "PRÉSENT" : "ABSENT");

    if (!uid || !token) {
      setStatus("error");
      setMessage("Le lien d'activation est invalide ou incomplet.");
      return;
    }

    const activateAccount = async () => {
      try {
        const response = await apiRequest("/v1/auth/activate-account/", {
          method: "POST",
          body: JSON.stringify({
            uid,
            token,
          }),
        });

        console.log("=== ACTIVATION RÉUSSIE ===", response);

        setStatus("success");
        setMessage(
          "Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter."
        );
      } catch (error) {
        console.error("=== ERREUR ACTIVATION ===", error);

        setStatus("error");
        setMessage(
          "Impossible d'activer votre compte. Le lien est peut-être expiré ou invalide."
        );
      }
    };

    activateAccount();
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            marginBottom: "16px",
            fontSize: "28px",
            fontWeight: 700,
          }}
        >
          Activation du compte
        </h1>

        <p
          style={{
            color: status === "error" ? "#dc2626" : "#475569",
            marginBottom: "28px",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>

        {status === "success" && (
          <button
            onClick={() => navigate("/login")}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Aller à la connexion
          </button>
        )}

        {status === "error" && (
          <button
            onClick={() => navigate("/login")}
            style={{
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retour à la connexion
          </button>
        )}
      </div>
    </div>
  );
}