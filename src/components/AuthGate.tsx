import * as React from "react";
import AuthPage from "./AuthPage";

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const [user, setUser] = React.useState<string | null>(() => {
    return localStorage.getItem("qa_current_user");
  });
  
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<string | null>(() => {
    return localStorage.getItem("qa_selected_restaurant") || null;
  });

  React.useEffect(() => {
    // Keep local state in sync if other tabs change auth
    function onStorage(e: StorageEvent) {
      if (e.key === "qa_current_user") setUser(e.newValue);
      if (e.key === "qa_selected_restaurant") setSelectedRestaurant(e.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleAuth(username: string) {
    setUser(username);
    // Already stored by AuthPage
  }

  function logout() {
    localStorage.removeItem("qa_current_user");
    localStorage.removeItem("qa_selected_restaurant");
    setUser(null);
    setSelectedRestaurant(null);
  }

  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-end p-3">
        <button
          onClick={logout}
          className="px-3 py-1 border rounded text-sm bg-white"
          title="התנתק"
        >
          התנתק ({user})
        </button>
      </div>
      <div>
        {selectedRestaurant && children}
      </div>
    </div>
  );
}
