"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface Post {
  id: number;
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
}

export default function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [profileUser, setProfileUser] = useState<{
    username: string;
    display_name: string;
  } | null>(null);
  const { user } = useUser();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [postsResponse, likedPostsResponse, userResponse] =
          await Promise.all([
            fetch(`/api/posts?userId=${params.id}`),
            fetch(`/api/posts/liked?userId=${params.id}`),
            fetch(`/api/users/${params.id}`),
          ]);

        const postsData = await postsResponse.json();
        const likedPostsData = await likedPostsResponse.json();
        const userData = await userResponse.json();

        setUserPosts(postsData.posts);
        setLikedPosts(likedPostsData.posts);
        setProfileUser(userData.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    fetchUserData();
  }, [params.id]);

  const handleLikePost = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setUserPosts(
          userPosts.map((post) =>
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
        setLikedPosts(
          likedPosts.map((post) =>
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

  const renderPosts = (posts: Post[]) => (
    <ul className="space-y-4">
      {posts.map((post) => (
        <li key={post.id} className="bg-white p-4 rounded shadow">
          <Link href={`/posts/${post.id}`}>
            <p className="text-lg mb-2 text-black">{post.content}</p>
            <small className="text-gray-500">
              {post.username} - {new Date(post.created_at).toLocaleString()}
            </small>
          </Link>
          <div className="mt-2">
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
              <span className="text-gray-500 mr-2">♥ {post.likes_count}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  if (!profileUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {profileUser.display_name}'s Profile
      </h1>
      <p className="mb-4">@{profileUser.username}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">User's Posts</h2>
          {renderPosts(userPosts)}
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Liked Posts</h2>
          {renderPosts(likedPosts)}
        </div>
      </div>
    </div>
  );
}
