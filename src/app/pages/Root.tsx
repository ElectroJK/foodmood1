import { Outlet } from "react-router";
import { FoodMoodProvider } from "../context/FoodMoodContext";
import { LanguageProvider } from "../context/LanguageContext";
import { Toaster } from "../components/ui/sonner";

export function Root() {
  return (
    <LanguageProvider>
      <FoodMoodProvider>
        <Outlet />
        <Toaster />
      </FoodMoodProvider>
    </LanguageProvider>
  );
}
