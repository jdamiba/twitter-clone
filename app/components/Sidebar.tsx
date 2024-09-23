import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function Sidebar() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-20 bg-blue-500 text-white p-2 rounded-full shadow-lg"
        onClick={toggleSidebar}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:sticky top-0 left-0 h-screen md:h-[calc(100vh-2rem)] overflow-y-auto transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition duration-200 ease-in-out z-10 w-64 bg-white shadow-lg md:shadow-none`}
      >
        <div className="p-6 flex flex-col h-full">
          <h2 className="text-2xl font-semibold mb-6 text-black">Menu</h2>
          <nav className="space-y-4 flex-grow">
            <Link href="/" className="block text-gray-700 hover:text-blue-500">
              Home
            </Link>
            {user && (
              <Link
                href={`/users/${user.id}`}
                className="block text-gray-700 hover:text-blue-500"
              >
                Profile
              </Link>
            )}
            <Link
              href="/about"
              className="block text-gray-700 hover:text-blue-500"
            >
              About
            </Link>
          </nav>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-0 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}
