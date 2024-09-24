"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  FaHome,
  FaSearch,
  FaCompass,
  FaBell,
  FaEnvelope,
  FaUser,
  FaBars,
  FaTimes,
} from "react-icons/fa";

export default function Sidebar() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { href: "/", icon: FaHome, text: "Home" },
    { href: "/search", icon: FaSearch, text: "Search" },
    { href: "/explore", icon: FaCompass, text: "Explore" }, // Add this line
    { href: "/notifications", icon: FaBell, text: "Notifications" },
    { href: "/messages", icon: FaEnvelope, text: "Messages" },
    { href: `/users/${user?.id}`, icon: FaUser, text: "Profile" },
  ];

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
      <div
        className={`fixed md:sticky top-0 left-0 h-screen bg-white w-64 p-4 border-r shadow-lg transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 z-40 overflow-y-auto`}
      >
        <ul className="space-y-2 mt-8">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center p-2 text-gray-700 rounded hover:bg-gray-100 transition-colors duration-200"
                onClick={() => isMobile && setIsOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3 text-gray-500" />
                <span>{item.text}</span>
              </Link>
            </li>
          ))}
        </ul>
        {user && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg shadow-inner">
            <div className="flex items-center">
              <img
                src={user.imageUrl}
                alt={user.username || "User"}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-semibold text-gray-700">{user.username}</p>
                <p className="text-sm text-gray-500">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}
