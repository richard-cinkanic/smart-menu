import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { setAuthToken } from "../utils/authStorage";

type RouteState = {
  from?: {
    pathname?: string;
  };
};

export default function Login() {
  const [email, setEmail] = useState("admin@smartmenu.ai");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = (location.state as RouteState | null)?.from?.pathname ?? "/admin/dashboard";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const response = await api.post("/auth/login", { email, password });
      setAuthToken(response.data.token);
      navigate(redirectTo, { replace: true });
    } catch {
      setError("Nesprávny email alebo heslo pre admin účet.");
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <h1>Prihlásenie</h1>
      <p className="auth-helper">Admin prístup je určený iba pre majiteľa alebo obsluhu.</p>
      <label>
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        Heslo
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button>Prihlásiť sa</button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
