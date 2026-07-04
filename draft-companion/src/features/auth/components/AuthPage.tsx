import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

type Mode = "sign-in" | "sign-up";

const AuthPage = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(mode === "sign-in" ? "Signed in successfully." : "Check your inbox to confirm your account.");
      if (mode === "sign-in") {
        navigate("/", { replace: true });
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f4eb] p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[#e6e2da] bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#7a756d]">Draft Companion</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#222]">
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-[#6b655d]">
            {mode === "sign-in"
              ? "Sign in to continue working on your drafts."
              : "Sign up with Supabase to start securing your documents."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <div className="mt-4 text-sm text-[#6b655d]">
          {mode === "sign-in" ? (
            <p>
              New here?{" "}
              <button type="button" className="font-medium text-[#222] underline" onClick={() => setMode("sign-up")}>
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button type="button" className="font-medium text-[#222] underline" onClick={() => setMode("sign-in")}>
                Sign in
              </button>
            </p>
          )}
        </div>

        {message ? <p className="mt-4 text-sm text-[#4f4a41]">{message}</p> : null}
      </div>
    </div>
  );
};

export default AuthPage;
