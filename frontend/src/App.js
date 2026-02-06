import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import LoginPage from "@/pages/LoginPage";
import PrescriptionForm from "@/pages/PrescriptionForm";
import PrescriptionHistory from "@/pages/PrescriptionHistory";
import PrescriptionView from "@/pages/PrescriptionView";
import AdminPage from "@/pages/AdminPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth context helper
export const getToken = () => localStorage.getItem("rheumacare_token");
export const setToken = (token) => localStorage.setItem("rheumacare_token", token);
export const removeToken = () => localStorage.removeItem("rheumacare_token");
export const isAuthenticated = () => !!getToken();

// User info helpers
export const getUserInfo = () => {
  const info = localStorage.getItem("rheumacare_user");
  return info ? JSON.parse(info) : null;
};
export const setUserInfo = (info) => localStorage.setItem("rheumacare_user", JSON.stringify(info));
export const isAdmin = () => getUserInfo()?.role === "admin";

// Axios interceptor for auth
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios response interceptor for handling token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear token and redirect to login
      removeToken();
      localStorage.removeItem("rheumacare_user");
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Protected Route component
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="App min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PrescriptionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <PrescriptionHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescription/:id"
            element={
              <ProtectedRoute>
                <PrescriptionView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prescription/:id/edit"
            element={
              <ProtectedRoute>
                <PrescriptionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
