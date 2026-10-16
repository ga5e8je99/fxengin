import { useEffect, useState } from "react";
import { TradingPage } from "./pages/TradingPage.tsx";
import { AdminPage } from "./pages/AdminPage.tsx";
import { useAuthStore as useAppAuth } from "./services/auth.ts";
import { useAuthStore, useTradingStore } from "./services/store.tsx";
import { AuthModal } from "./components/AuthModal.tsx";

/**
 * Trading MiniApp entry point with Unified Web & Telegram Auth and Admin Routing.
 */
export function App() {
  const [ready, setReady] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return (
      window.location.pathname.startsWith("/admin") ||
      window.location.hash.startsWith("#admin")
    );
  });

  const demoLogin = useAuthStore((s) => s.demoLogin);
  const loadSymbols = useTradingStore((s) => s.loadSymbols);
  const loadAccounts = useTradingStore((s) => s.loadAccounts);
  const initAppAuth = useAppAuth((s) => s.initAuth);

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(
        window.location.pathname.startsWith("/admin") ||
        window.location.hash.startsWith("#admin")
      );
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        await demoLogin();
        // Run auth sync in parallel so it never blocks terminal mount
        initAppAuth().catch((err) => console.warn("Auth initialization fallback:", err));
      } catch (err) {
        console.warn("Auth initialization fallback:", err);
      } finally {
        localStorage.setItem("is_demo", "false");
        useAuthStore.setState({ isDemo: false });
        await Promise.all([loadSymbols(), loadAccounts()]).catch((e) =>
          console.warn("Symbol/account load warning:", e)
        );
        if (!cancelled) setReady(true);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, [demoLogin, loadSymbols, loadAccounts, initAppAuth]);

  if (isAdminRoute) {
    return <AdminPage />;
  }

  if (!ready) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#01071E] text-white gap-4 select-none">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 border-3 border-[#0488F8]/20 border-t-[#0488F8] rounded-full animate-spin" />
          <span className="text-[#FB8704] font-black text-xs">FX</span>
        </div>
        <p className="text-xs font-bold text-[#A7AFBF] tracking-wide">جاري تشغيل منصة التداول والشارت...</p>
      </div>
    );
  }

  return (
    <>
      <TradingPage />
      <AuthModal />
    </>
  );
}
