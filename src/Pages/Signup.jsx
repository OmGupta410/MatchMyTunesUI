import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userExists = users.some((user) => user.email === formData.email);

    if (userExists) {
      alert("Email already registered. Try logging in.");
      return;
    }

    users.push(formData);
    localStorage.setItem("users", JSON.stringify(users));
    alert("Signup successful! Please login.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl p-10">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Create Account
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-4 rounded-xl bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-300 text-white font-semibold py-3 rounded-xl shadow-lg"
          >
            Sign Up
          </button>
        </form>
        <p className="text-gray-400 mt-6 text-center">
          Already have an account?{" "}
          <span
            className="text-blue-500 hover:underline cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
