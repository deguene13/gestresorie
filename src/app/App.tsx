import { RouterProvider } from "react-router";
import { router } from "./routes";
import { LanguageProvider } from "./context/LanguageContext";
import { AppDataProvider } from "./context/AppDataContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "next-themes";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="app_theme">
      <AuthProvider>
        <AppDataProvider>
          <LanguageProvider>
            <RouterProvider router={router} />
          </LanguageProvider>
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
