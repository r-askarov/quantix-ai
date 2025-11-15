import * as React from "react";
import AuthPage from "./AuthPage";

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const [user, setUser] = React.useState<string | null>(() => {
    return localStorage.getItem("qa_current_user");
  });
  const [restaurants, setRestaurants] = React.useState<string[]>(() => {
    // Mocked restaurant list for the user
    return ["מסעדה 1", "מסעדה 2", "מסעדה 3"];
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

  function handleRestaurantChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const restaurant = e.target.value;
    setSelectedRestaurant(restaurant);
    localStorage.setItem("qa_selected_restaurant", restaurant);
  }

  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-between items-center p-3">
        <div>
          <label htmlFor="restaurant-select" className="mr-2 ml-1 text-sm">
            בחר מסעדה:
          </label>
          <select
            id="restaurant-select"
            value={selectedRestaurant || ""}
            onChange={handleRestaurantChange}
            className="py-1 border rounded text-sm"
          >
            <option value="" disabled>
              בחר מסעדה
            </option>
            {restaurants.map((restaurant) => (
              <option key={restaurant} value={restaurant}>
                {restaurant}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={logout}
          className="px-3 py-1 border rounded text-sm bg-white"
          title="התנתק"
        >
          התנתק ({user})
        </button>
      </div>
      <div>
        {!selectedRestaurant && <div className="p-3 text-sm text-red-600">אנא בחר מסעדה כדי להמשיך.</div>}
        {selectedRestaurant && children}
      </div>
    </div>
  );
}
