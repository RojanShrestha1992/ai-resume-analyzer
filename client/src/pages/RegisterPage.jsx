import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await API.post("/auth/register", { name, email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Register failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="text-2xl">🔐</span>
            </div>

            <h1 className="text-3xl font-bold text-white">Welcome</h1>

            <p className="text-slate-400 mt-2 text-sm">Create a new account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jhon Doe"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Password
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 pr-12 text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing up...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Register */}
          <p className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/"
              className="font-medium text-blue-400 hover:text-blue-300 transition"
            >
              Login
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          © 2026 Your App. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
