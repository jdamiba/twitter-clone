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
  original_content?: string;
  is_edited: boolean;
  likes_count: number;
  reply_to_id?: string;
  replies?: Post[];
}

const initialPosts: Post[] = [];

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useUser();

  useEffect(() => {
    fetchPosts();
  }, []);

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

  const handleLikePost = async (postId: number) => {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Social Feed</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Recent Posts</h2>
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id} className="bg-white p-4 rounded shadow">
                <Link href={`/posts/${post.id}`} className="block">
                  <p className="text-lg mb-2 text-black">{post.content}</p>
                  <small className="text-gray-500">
                    <Link
                      href={`/users/${post.user_id}`}
                      className="hover:underline"
                    >
                      {post.username}
                    </Link>{" "}
                    -{" "}
                    {post.is_edited
                      ? `Edited on ${new Date(
                          post.updated_at
                        ).toLocaleString()}`
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
                <div className="mt-2 flex items-center">
                  {user && user.id !== post.user_id ? (
                    <button
                      onClick={() => handleLikePost(Number(post.id))}
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
                  {user && user.id === post.user_id && (
                    <>
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
                        className="text-blue-500 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(Number(post.id))}
                        className="text-red-500"
                      >
                        Delete
                      </button>
                    </>
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
                      className="w-full p-2 border rounded text-black"
                    />
                    <button
                      type="submit"
                      className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
                        <p className="text-sm text-black">{reply.content}</p>
                        <small className="text-gray-500">
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
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load More"}
            </button>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Create a Post</h2>
          <form
            onSubmit={handlePostSubmit}
            className="bg-white p-4 rounded shadow"
          >
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-2 border rounded mb-4 text-black"
              rows={4}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
