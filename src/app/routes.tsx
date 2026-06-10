import { createBrowserRouter } from "react-router";
import { Root } from "./pages/Root";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { VerifyEmail } from "./pages/VerifyEmail";
import { Dashboard } from "./pages/Dashboard";
import { Pantry } from "./pages/Pantry";
import { Scanner } from "./pages/Scanner";
import { Recipes } from "./pages/Recipes";
import { Community } from "./pages/Community";
import { Profile } from "./pages/Profile";
import { Analytics } from "./pages/Analytics";
import { ShareFood } from "./pages/ShareFood";
import { Notifications } from "./pages/Notifications";
import { AdminDashboard } from "./pages/AdminDashboard";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "login", Component: Login },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "reset-password", Component: ResetPassword },
      { path: "verify-email", Component: VerifyEmail },
      { path: "dashboard", Component: Dashboard },
      { path: "pantry", Component: Pantry },
      { path: "scanner", Component: Scanner },
      { path: "recipes", Component: Recipes },
      { path: "community", Component: Community },
      { path: "profile", Component: Profile },
      { path: "analytics", Component: Analytics },
      { path: "share-food", Component: ShareFood },
      { path: "notifications", Component: Notifications },
      { path: "admin", Component: AdminDashboard },
      { path: "*", Component: NotFound },
    ],
  },
]);
