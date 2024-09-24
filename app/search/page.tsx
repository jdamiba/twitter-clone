"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";

interface Post {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  username: string;
  display_name: string;
  isLiked: boolean;
  likes_count: number;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/posts/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data.posts);
    } catch (error) {
      console.error("Error searching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-grow p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-8 text-black">
          Search Posts
        </h1>

        <form onSubmit={handleSearch} className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter keywords to search posts"
            className="w-full p-2 border rounded text-black text-sm mb-2"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full md:w-auto"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-black">
            Search Results
          </h2>
          {searchResults.length > 0 ? (
            <ul className="space-y-4">
              {searchResults.map((post) => (
                <li key={post.id} className="bg-white p-4 rounded shadow">
                  <Link href={`/posts/${post.id}`} className="block">
                    <p className="text-base md:text-lg mb-2 text-black">
                      {post.content}
                    </p>
                    <small className="text-xs md:text-sm text-gray-500">
                      <Link
                        href={`/users/${post.user_id}`}
                        className="hover:underline"
                      >
                        {post.username}
                      </Link>{" "}
                      - {new Date(post.created_at).toLocaleString()}
                    </small>
                  </Link>
                  <div className="mt-2">
                    <span className="text-gray-500 mr-2">
                      ♥ {post.likes_count}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No results found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
