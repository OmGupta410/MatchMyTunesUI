import React, { useState } from "react";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message sent! We'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-6 py-16">
      <h2 className="text-4xl font-bold mb-6">Contact Us</h2>
      <p className="text-gray-300 mb-10 text-center max-w-xl">
        Have questions, suggestions, or need support? Send us a message and
        we'll get back to you quickly.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-4 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-4 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          name="message"
          placeholder="Your Message"
          value={formData.message}
          onChange={handleChange}
          required
          className="w-full p-4 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="6"
        ></textarea>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 w-full py-3 rounded-lg font-bold transition duration-300"
        >
          Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactUs;
