import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Mail, ArrowLeft, Leaf, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { api } from "../../lib/api";
import { useLanguage } from "../context/LanguageContext";

// Standalone forgot-password screen.
// Sends POST /api/auth/forgot-password — on the server this always returns
// `{ ok: true }` (to avoid leaking which emails are registered) and, if the
// account exists, asynchronously triggers an email with a 1-hour reset link.
export function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      // The backend never throws here for security reasons; this catch is just
      // a safety net for network failures.
      toast.error(err?.message || t("pages.auth.resetSendFailed", "Could not send reset link. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7EC] to-white flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-[#4A5568]/70 hover:text-[#4A5568] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("pages.auth.backToSignIn")}
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-12 h-12 rounded-xl bg-[#B2D2A4]/15 flex items-center justify-center mb-6">
            <Leaf className="w-6 h-6 text-[#7FB069]" />
          </div>

          {!submitted ? (
            <>
              <h1 className="text-2xl font-bold text-[#2D3748] mb-2">
                {t("pages.auth.forgotTitle", "Forgot your password?")}
              </h1>
              <p className="text-sm text-[#4A5568]/70 mb-6">
                {t("pages.auth.forgotText", "Enter the email associated with your FoodMood account and we will send you a link to reset your password.")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4A5568] mb-2">
                    {t("pages.auth.emailAddress", "Email address")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]/40" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hello@example.com"
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#2D3748] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? t("pages.auth.sendingLink", "Sending link...") : t("pages.auth.sendResetLink", "Send reset link")}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-[#2D3748] mb-2">
                {t("pages.auth.checkInbox", "Check your inbox")}
              </h1>
              <p className="text-sm text-[#4A5568]/70 mb-6">
                {t("pages.auth.resetSentPrefix", "If")} <span className="font-medium text-[#4A5568]">{email}</span> {t("pages.auth.resetSentSuffix", "is registered with FoodMood, a password reset link has just been sent. The link is valid for 1 hour.")}
              </p>
              <Link
                to="/login"
                className="inline-block text-sm font-medium text-[#7FB069] hover:text-[#5a8a4d]"
              >
                {t("pages.auth.backToSignIn", "Back to sign in")} →
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#4A5568]/50 mt-6">
          {t("pages.auth.noEmailHint", "Didn't get an email? Check your spam folder, then try again in a few minutes.")}
        </p>
      </motion.div>
    </div>
  );
}
