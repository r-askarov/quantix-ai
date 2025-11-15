import * as React from "react";
// Import the logo from your assets folder (adjust filename if different)
import logo from "../assets/logo.png";

type Props = {
  onAuth: (username: string) => void;
};

export default function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("שם משתמש וסיסמה נדרשים");
      return;
    }

    // Very small local "auth" simulation:
    // For signup store a simple record, for login validate it exists.
    const usersRaw = localStorage.getItem("qa_users");
    const users: Record<string, string> = usersRaw ? JSON.parse(usersRaw) : {};

    if (mode === "signup") {
      users[username] = password;
      localStorage.setItem("qa_users", JSON.stringify(users));
      localStorage.setItem("qa_current_user", username);
      onAuth(username);
      return;
    }

    // login
    if (users[username] && users[username] === password) {
      localStorage.setItem("qa_current_user", username);
      onAuth(username);
      return;
    }

    setError("שם משתמש או סיסמה שגויים");
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow text-right">
        {/* centered logo at the top */}
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo" className="h-12 w-auto" />
        </div>
        <h2 className="text-2xl mb-4">{mode === "login" ? "התחברות" : "הרשמה"}</h2>
        <form onSubmit={submit} className="space-y-4 text-right">
          <div>
            <label className="block text-sm text-right">שם משתמש</label>
            <input
              dir="rtl"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border px-3 py-2 rounded text-right"
            />
          </div>
          <div>
            <label className="block text-sm text-right">סיסמה</label>
            <input
              dir="rtl"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded text-right"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex items-center justify-between flex-row-reverse gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              {mode === "login" ? "התחבר" : "הירשם"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="text-sm text-blue-600"
            >
              {mode === "login" ? "אין לך חשבון? הירשם" : "יש לך חשבון? התחבר"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
