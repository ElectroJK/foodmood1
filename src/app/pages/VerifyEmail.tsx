import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2, Leaf } from "lucide-react";
import { api } from "../../lib/api";
import { useLanguage } from "../context/LanguageContext";

// Landing page hit by the link inside the verification email.
// Reads `?token=...` from the URL, calls GET /api/auth/verify-email/:token,
// and shows a success / failure state. No user interaction required.
export function VerifyEmail() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t("pages.auth.verifyTokenMissing", "Verification token is missing from the link."));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await api.verifyEmail(token);
        if (!cancelled) {
          setStatus("success");
          setMessage(t("pages.auth.emailVerifiedMessage", "Your email has been verified successfully."));
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err?.message || t("pages.auth.verifyFailedMessage", "The verification link is invalid or has expired."));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7EC] to-white flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#B2D2A4]/15 flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-6 h-6 text-[#7FB069]" />
          </div>

          {status === "loading" && (
            <>
              <Loader2 className="w-8 h-8 text-[#7FB069] animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-[#2D3748] mb-2">
                {t("pages.auth.verifyingEmail", "Verifying your email...")}
              </h1>
              <p className="text-sm text-[#4A5568]/70">
                {t("pages.auth.oneMoment", "One moment, this should only take a second.")}
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-[#2D3748] mb-2">{t("pages.auth.emailVerified", "Email verified")}</h1>
              <p className="text-sm text-[#4A5568]/70 mb-6">{message}</p>
              <Link
                to="/dashboard"
                className="inline-block px-5 py-2.5 rounded-xl bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#2D3748] font-semibold text-sm transition-colors"
              >
                {t("pages.auth.goToDashboard", "Go to dashboard")}
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-[#2D3748] mb-2">
                {t("pages.auth.verificationFailed", "Verification failed")}
              </h1>
              <p className="text-sm text-[#4A5568]/70 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block text-sm font-medium text-[#7FB069] hover:text-[#5a8a4d]"
              >
                {t("pages.auth.backToSignIn", "Back to sign in")} →
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
