"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

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

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const { user } = useUser();

  useEffect(() => {
    fetchPosts();
    fetchFollowedUsers();
  }, []);

  async function fetchPosts(page = 1) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/explore?page=${page}`);
      const data = await response.json();
      if (Array.isArray(data.posts)) {
        if (page === 1) {
          setPosts(data.posts);
        } else {
          setPosts((prevPosts) => [...prevPosts, ...data.posts]);
        }
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } else {
        console.error("Fetched data is not an array:", data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchFollowedUsers() {
    try {
      const response = await fetch("/api/users/following");
      const data = await response.json();
      if (data.followedUsers) {
        setFollowedUsers(new Set(data.followedUsers));
      }
    } catch (error) {
      console.error("Error fetching followed users:", error);
    }
  }

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchPosts(currentPage + 1);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: !post.isLiked,
                  likes_count: post.isLiked
                    ? post.likes_count - 1
                    : post.likes_count + 1,
                }
              : post
          )
        );
      } else {
        console.error("Error liking post:", data.error);
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleFollowUser = async (userId: string) => {
    if (!userId) {
      console.error("User ID is undefined");
      return;
    }
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setFollowedUsers((prev) => {
          const newSet = new Set(prev);
          if (data.action === "followed") {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      } else {
        console.error("Error following user:", data.error);
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-8 text-white">
        Explore
      </h1>

      <div className="space-y-4">
        <ul className="space-y-4">
          {posts.map((post) => (
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
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {user && user.id !== post.user_id ? (
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className={`mr-2 ${
                      post.isLiked ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    {post.isLiked ? "♥" : "♡"} {post.likes_count}
                  </button>
                ) : (
                  <span className="text-gray-500 mr-2">
                    ♥ {post.likes_count}
                  </span>
                )}
                {user && user.id !== post.user_id && (
                  <button
                    onClick={() => handleFollowUser(post.user_id)}
                    className={`text-sm px-2 py-1 rounded ${
                      followedUsers.has(post.user_id)
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    {followedUsers.has(post.user_id) ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {currentPage < totalPages && (
          <button
            onClick={handleLoadMore}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm w-full md:w-auto"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
}
