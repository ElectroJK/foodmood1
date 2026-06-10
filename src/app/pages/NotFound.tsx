import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-[#B2D2A4] mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-[#4A5568] mb-4">
          {t("pages.notFound.title")}
        </h2>
        <p className="text-[#4A5568]/60 mb-8">
          {t("pages.notFound.description")}
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-[#B2D2A4] text-[#4A5568]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("pages.notFound.goBack")}
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568]"
          >
            <Home className="w-4 h-4 mr-2" />
            {t("pages.notFound.goHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
