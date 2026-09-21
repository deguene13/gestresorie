import { RouterProvider } from "react-router";
import { router } from "./routes";
import { LanguageProvider } from "./context/LanguageContext";
import { AppDataProvider } from "./context/AppDataContext";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <LanguageProvider>
          <RouterProvider router={router} />
        </LanguageProvider>
      </AppDataProvider>
    </AuthProvider>
  );
}
