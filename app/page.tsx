"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface Post {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string; // Ensure this property exists
  username: string;
  display_name: string;
  isLiked: boolean;
  original_content?: string;
  is_edited: boolean;
  likes_count: number;
  reply_to_id?: string;
  replies?: Post[];
  userId?: string; // Added userId property
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());

  const { user } = useUser();

  useEffect(() => {
    fetchPosts();
    fetchFollowedUsers();
  }, []);

  console.log(posts);

  async function fetchPosts(page = 1) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts?page=${page}`);
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

  const handlePostSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newPostContent }),
      });
      const data = await response.json();
      if (data.post) {
        setPosts([data.post, ...posts]);
        setNewPostContent("");
      } else {
        console.error("Error creating post:", data.error);
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleEditPost = async (postId: number, newContent: string) => {
    console.log(
      `Attempting to edit post ${postId} with content: ${newContent}`
    );
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newContent }),
      });
      const data = await response.json();
      console.log("Edit post response:", data);
      if (data.post) {
        setPosts(
          posts.map((post) =>
            Number(post.id) === Number(postId)
              ? { ...post, ...data.post }
              : post
          )
        );
        console.log("Post updated successfully");
      } else {
        console.error("Error updating post:", data.error);
      }
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setPosts(posts.filter((post) => String(post.id) !== String(postId)));
        } else {
          console.error("Error deleting post:", await response.text());
        }
      } catch (error) {
        console.error("Error deleting post:", error);
      }
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
            String(post.id) === String(postId)
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

  const handleReplySubmit = async (postId: string, replyContent: string) => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: replyContent, reply_to_id: postId }),
      });
      const data = await response.json();
      if (data.post) {
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? { ...post, replies: [...(post.replies || []), data.post] }
              : post
          )
        );
      } else {
        console.error("Error creating reply:", data.error);
      }
    } catch (error) {
      console.error("Error creating reply:", error);
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
        Social Feed
      </h1>

      {/* Create Post Form */}
      <div className="mb-4 md:mb-8">
        <form
          onSubmit={handlePostSubmit}
          className="bg-white p-4 rounded shadow"
        >
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-2 border rounded mb-4 text-black text-sm"
            rows={4}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full md:w-auto"
          >
            Post
          </button>
        </form>
      </div>

      {/* Posts List */}
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
                  -{" "}
                  {post.is_edited
                    ? `Edited on ${new Date(post.updated_at).toLocaleString()}`
                    : new Date(post.created_at).toLocaleString()}
                </small>
                {post.is_edited &&
                  post.original_content &&
                  post.original_content !== post.content && (
                    <small className="text-gray-500 block">
                      Original: {post.original_content}
                    </small>
                  )}
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
                {user && user.id === post.user_id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newContent = prompt(
                          "Edit your post:",
                          post.content
                        );
                        if (newContent && newContent !== post.content) {
                          console.log(`Editing post ${post.id}`);
                          handleEditPost(Number(post.id), newContent);
                        } else {
                          console.log("Edit cancelled or no changes made");
                        }
                      }}
                      className="text-blue-500 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(Number(post.id))}
                      className="text-red-500 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {/* Add reply form */}
              {user && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const replyContent = (e.target as HTMLFormElement).reply
                      .value;
                    handleReplySubmit(post.id, replyContent);
                    (e.target as HTMLFormElement).reply.value = "";
                  }}
                  className="mt-2"
                >
                  <input
                    type="text"
                    name="reply"
                    placeholder="Write a reply..."
                    className="w-full p-2 border rounded text-black text-sm"
                  />
                  <button
                    type="submit"
                    className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                  >
                    Reply
                  </button>
                </form>
              )}
              {/* Display replies */}
              {post.replies && post.replies.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {post.replies.map((reply) => (
                    <li key={reply.id} className="bg-gray-100 p-2 rounded">
                      <p className="text-xs md:text-sm text-black">
                        {reply.content}
                      </p>
                      <small className="text-xs text-gray-500">
                        <Link
                          href={`/users/${reply.user_id}`}
                          className="hover:underline"
                        >
                          {reply.username}
                        </Link>{" "}
                        - {new Date(reply.created_at).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
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
