"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import PostForm from "./components/PostForm";
import PostList from ".//components/PostList";
import UserProfile from "./components/UserProfile";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchPosts();
    }
  }, [isSignedIn]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to fetch posts. Please try again.");
    }
  };

  if (!isSignedIn) {
    return <div>Please sign in to view and interact with posts.</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">Your Social Feed</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <PostForm onPostCreated={fetchPosts} />
          <PostList posts={posts} onPostUpdated={fetchPosts} />
        </div>
        <div>
          <UserProfile
            user={{
              ...user,
              displayName: user.username ?? "",
              updatedAt: user.updatedAt ?? new Date(),
              createdAt: user.createdAt || new Date(),
              username: user.username ?? "",
              bio: "",
              profileImageUrl: user.imageUrl || "",
            }}
          />
          {/* Add components for Trending Topics, Suggested Users, etc. */}
        </div>
      </div>
    </div>
  );
}
