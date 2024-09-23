"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

interface Post {
  content: string;
  created_at: string | number | Date;
  updated_at: string | number | Date;
  id: string;
  isLiked: boolean;
  username: string;
  userId: string;
  original_content?: string;
  is_edited: boolean;
  likes_count: number;
  replies?: Post[];
}

export default function PostPage() {
  const [post, setPost] = useState<Post | null>(null);
  const [newReplyContent, setNewReplyContent] = useState("");
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`/api/posts/${id}`);
        const data = await response.json();
        setPost(data.post);
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    }

    fetchPost();
  }, [id]);

  const handleEditPost = async (newContent: string) => {
    console.log(`Attempting to edit post ${id} with content: ${newContent}`);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newContent }),
      });
      const data = await response.json();
      console.log("Edit post response:", data);
      if (data.post) {
        setPost({ ...post!, ...data.post });
        console.log("Post updated successfully");
      } else {
        console.error("Error updating post:", data.error);
      }
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const response = await fetch(`/api/posts/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          router.push("/");
        } else {
          console.error("Error deleting post:", await response.text());
        }
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const handleLikePost = async () => {
    try {
      const response = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setPost((prevPost) =>
          prevPost
            ? {
                ...prevPost,
                isLiked: !prevPost.isLiked,
                likes_count: prevPost.isLiked
                  ? prevPost.likes_count - 1
                  : prevPost.likes_count + 1,
              }
            : null
        );
      } else {
        console.error("Error liking post:", data.error);
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleReplySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newReplyContent, reply_to_id: id }),
      });
      const data = await response.json();
      if (data.post) {
        setPost((prevPost) =>
          prevPost
            ? {
                ...prevPost,
                replies: [...(prevPost.replies || []), data.post],
              }
            : null
        );
        setNewReplyContent("");
      } else {
        console.error("Error creating reply:", data.error);
      }
    } catch (error) {
      console.error("Error creating reply:", error);
    }
  };

  if (!post) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="text-blue-500 hover:underline mb-4 block">
        &larr; Back to Feed
      </Link>
      <div className="bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4 text-black">
          {post.username}'s Post
        </h1>
        <p className="text-lg mb-4 text-black">{post.content}</p>
        <small className="text-gray-500 block">
          {post.is_edited
            ? `Edited on ${new Date(post.updated_at).toLocaleString()}`
            : `Posted on ${new Date(post.created_at).toLocaleString()}`}
        </small>
        {post.is_edited &&
          post.original_content &&
          post.original_content !== post.content && (
            <small className="text-gray-500 block mt-2">
              Original: {post.original_content}
            </small>
          )}
        <div className="mt-4 flex items-center">
          {user && user.id !== post.userId ? (
            <button
              onClick={handleLikePost}
              className={`mr-2 ${
                post.isLiked ? "text-red-500" : "text-gray-500"
              }`}
            >
              {post.isLiked ? "♥" : "♡"} {post.likes_count}
            </button>
          ) : (
            <span className="text-gray-500 mr-2">♥ {post.likes_count}</span>
          )}
          {user && user.id === post.userId && (
            <>
              <button
                onClick={() => {
                  const newContent = prompt("Edit your post:", post.content);
                  if (newContent && newContent !== post.content) {
                    handleEditPost(newContent);
                  }
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Edit
              </button>
              <button
                onClick={handleDeletePost}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Replies</h2>
        {user && (
          <form onSubmit={handleReplySubmit} className="mb-4">
            <textarea
              value={newReplyContent}
              onChange={(e) => setNewReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-2 border rounded mb-2 text-black"
              rows={3}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Post Reply
            </button>
          </form>
        )}
        <ul className="space-y-4">
          {post.replies && post.replies.length > 0 ? (
            post.replies.map((reply) => (
              <li key={reply.id} className="bg-gray-100 p-4 rounded">
                <p className="text-black">{reply.content}</p>
                <small className="text-gray-500">
                  <Link
                    href={`/users/${reply.userId}`}
                    className="hover:underline"
                  >
                    {reply.username}
                  </Link>{" "}
                  - {new Date(reply.created_at).toLocaleString()}
                </small>
              </li>
            ))
          ) : (
            <li className="text-gray-500">No replies yet</li>
          )}
        </ul>
      </div>
    </div>
  );
}
