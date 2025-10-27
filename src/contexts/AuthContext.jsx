import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "https://matchmytunes.onrender.com/api/account/login",
        {
          email,
          password,
        }
      );
      const { token, userId, displayName } = response.data;
      const userData = { userId, displayName };
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (displayName, email, password) => {
    try {
      await axios.post(
        "https://matchmytunes.onrender.com/api/account/register",
        {
          displayName,
          email,
          password,
        }
      );
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleSpotifyLogin = () => {
    window.location.href =
      "https://matchmytunes.onrender.com/api/auth/spotify/login";
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
