import { createContext, useContext, useState, useEffect } from "react";
import {
  authApi,
  getStoredToken,
  persistToken,
  removeStoredToken,
} from "../lib/api.js";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { token, userId, displayName } = await authApi.login({
        email,
        password,
      });
      const userData = { userId, displayName };
      persistToken(token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error?.message || "Login failed",
      };
    }
  };

  const register = async (displayName, email, password) => {
    try {
      await authApi.register({ displayName, email, password });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    removeStoredToken();
    setUser(null);
  };

  const handleSpotifyLogin = () => {
    window.location.href = authApi.spotifyLoginUrl();
  };

  const value = {
    user,
    login,
    register,
    logout,
    handleSpotifyLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
