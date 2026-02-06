import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { API, setToken, setUserInfo } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stethoscope, Lock, User } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      setToken(response.data.token);
      setUserInfo({
        user: response.data.user,
        role: response.data.role,
        doctor_id: response.data.doctor_id,
        location: response.data.location
      });
      
      if (response.data.role === "admin") {
        toast.success("Welcome, Admin!");
        navigate("/admin");
      } else {
        toast.success(`Welcome back, ${response.data.user}!`);
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" data-testid="login-page">
      <Card className="login-card border-0 shadow-xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 bg-[#6B9A9A]/10 rounded-full flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-[#6B9A9A]" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Rheuma<span className="text-[#6B9A9A]">CARE</span>
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              E-Prescription Portal
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-600 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="username"
                  data-testid="username-input"
                  type="text"
                  placeholder="Enter username"
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-600 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  data-testid="password-input"
                  type="password"
                  placeholder="Enter password"
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-[#6B9A9A] focus:ring-[#6B9A9A]/20"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              data-testid="login-submit-btn"
              className="w-full h-11 bg-[#6B9A9A] hover:bg-[#5A8888] text-white font-medium mt-6"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-6">
            RheumaCARE E-Prescription Portal
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
