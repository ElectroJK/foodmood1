import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, Leaf } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { api } from "../../lib/api";
import { useLanguage } from "../context/LanguageContext";

// Hit by the link inside the password-reset email. Reads ?token=... from the
// URL, asks the user for a new password, and submits both to the backend.
export function ResetPassword() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F0F7EC] to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#2D3748] mb-2">{t("pages.auth.invalidLink", "Invalid link")}</h1>
          <p className="text-sm text-[#4A5568]/70 mb-6">
            {t("pages.auth.invalidResetText", "The reset link is missing its token. Open the link from your email directly, or request a new one.")}
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#2D3748] font-semibold text-sm transition-colors"
          >
            {t("pages.auth.requestNewLink", "Request a new link")}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error(t("pages.auth.passwordMin", "Password must be at least 8 characters."));
      return;
    }
    if (password !== confirm) {
      toast.error(t("pages.auth.passwordsDontMatch", "Passwords don't match."));
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      toast.success(t("pages.auth.passwordResetSuccess", "Password reset successfully."));
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      toast.error(err?.message || t("pages.auth.resetFailed", "Could not reset password. The link may have expired."));
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-12 h-12 rounded-xl bg-[#B2D2A4]/15 flex items-center justify-center mb-6">
            <Leaf className="w-6 h-6 text-[#7FB069]" />
          </div>

          {done ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-[#2D3748] mb-2">{t("pages.auth.passwordUpdated", "Password updated")}</h1>
              <p className="text-sm text-[#4A5568]/70">
                {t("pages.auth.redirectingSignIn", "Redirecting you to the sign-in page...")}
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[#2D3748] mb-2">
                {t("pages.auth.setNewPassword", "Set a new password")}
              </h1>
              <p className="text-sm text-[#4A5568]/70 mb-6">
                {t("pages.auth.newPasswordHint", "Choose a strong password you have not used elsewhere. Minimum 8 characters.")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4A5568] mb-2">
                    {t("pages.auth.newPassword", "New password")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]/40" />
                    <Input
                      type={show ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("pages.auth.strongPasswordPlaceholder", "Enter a strong password")}
                      className="pl-10 pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5568]/50 hover:text-[#4A5568]"
                      aria-label={show ? t("pages.auth.hidePassword", "Hide password") : t("pages.auth.showPassword", "Show password")}
                    >
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4A5568] mb-2">
                    {t("pages.auth.confirmPassword", "Confirm password")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]/40" />
                    <Input
                      type={show ? "text" : "password"}
                      required
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder={t("pages.auth.repeatPassword", "Repeat the password")}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#2D3748] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? t("pages.auth.updating", "Updating...") : t("pages.auth.updatePassword", "Update password")}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
