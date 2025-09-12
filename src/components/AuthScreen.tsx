"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils"; // Import cn for conditional classes

interface AuthProps {
  onAuthSuccess?: () => void;
}

// Define response types from the Tauri backend
interface LoginResponse {
    message: string;
    token: string;
}

interface SignupResponse {
    message: string;
    user_id: string;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const router = useRouter();
  const [login, setLogin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  // NEW: Validation logic
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password: string) => {
    const re = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    return re.test(password);
  };

  const handleSubmit = async (e: React.FormEvent, mode: "login" | "signup") => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signup") {
      if (!validateEmail(signup.email)) {
        setError("Please enter a valid email address.");
        setLoading(false);
        return;
      }
      if (!validatePassword(signup.password)) {
        setError("Password must be at least 8 characters and include a number and a symbol.");
        setLoading(false);
        return;
      }
      if (signup.password !== signup.confirm) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === "login") {
        const data = await invoke<LoginResponse>("login_command", {
          email: login.email,
          password: login.password,
        });
        localStorage.setItem("jwt", data.token);
        toast.success(data.message);
        router.replace("/");
      } else { // Signup mode
        const data = await invoke<SignupResponse>("signup_command", {
            username: signup.username,
            email: signup.email,
            password: signup.password,
        });
        toast.success(`${data.message}. Please log in.`);
        setLogin({ email: signup.email, password: "" });
        setActiveTab("login");
      }
    } catch (err: any) {
        const errorMessage = typeof err === 'string' ? err.replace("API Error:", "").trim() : "An unknown error occurred.";
        setError(errorMessage);
        toast.error(errorMessage);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 bg-card shadow-lg rounded-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-card-foreground">Welcome to SmartMemo</h1>
          <p className="text-muted-foreground text-sm">Login or Sign up to continue</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* FIX: Added w-full to the grid to ensure it takes up available space */}
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={(e) => handleSubmit(e, "login")} className="space-y-4">
              <div>
                <Label htmlFor="email-login" className="mb-2">Email</Label>
                <Input
                  id="email-login"
                  type="email"
                  placeholder="you@example.com"
                  value={login.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password-login" className="mb-2">Password</Label>
                <div className="relative">
                  <Input
                    id="password-login"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={login.password}
                    onChange={(e) => setLogin({ ...login, password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {error && activeTab === 'login' && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={(e) => handleSubmit(e, "signup")} className="space-y-4">
              <div>
                <Label htmlFor="username-signup" className="mb-2">Username</Label>
                <Input
                  id="username-signup"
                  type="text"
                  placeholder="Your Name"
                  value={signup.username}
                  onChange={(e) => setSignup({ ...signup, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email-signup" className="mb-2">Email</Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="you@example.com"
                  value={signup.email}
                  onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                  className={cn(error && !validateEmail(signup.email) && "border-red-500")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password-signup" className="mb-2">Password</Label>
                 <div className="relative">
                    <Input
                        id="password-signup"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signup.password}
                        onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                        className={cn(error && (!validatePassword(signup.password) || signup.password !== signup.confirm) && "border-red-500")}
                        required
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password" className="mb-2">Confirm Password</Label>
                 <div className="relative">
                    <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signup.confirm}
                        onChange={(e) => setSignup({ ...signup, confirm: e.target.value })}
                        className={cn(error && signup.password !== signup.confirm && "border-red-500")}
                        required
                    />
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
              </div>
              {error && activeTab === 'signup' && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing up..." : "Sign Up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
