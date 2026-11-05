"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { cloudConfigured, supabase, authMessage } from "@/lib/cloud/client";
type Account = {
  user: User | null;
  ready: boolean;
  configured: boolean;
  recovery: boolean;
  error: string;
  finishRecovery: () => void;
};
const AccountContext = createContext<Account | null>(null);
export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("Kontotjenesten mangler.");
  return value;
}
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!cloudConfigured);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    if (!cloudConfigured) return;
    let active = true;
    const {
      data: { subscription },
    } = supabase().auth.onAuthStateChange((event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setReady(true);
      setError("");
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
    });
    void supabase()
      .auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(authMessage(error));
        setUser(data.session?.user ?? null);
        setReady(true);
      })
      .catch((error) => {
        if (active) {
          setError(authMessage(error));
          setReady(true);
        }
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  return (
    <AccountContext.Provider
      value={{
        user,
        ready,
        configured: cloudConfigured,
        recovery,
        error,
        finishRecovery: () => setRecovery(false),
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}
