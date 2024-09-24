"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

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

// Add this new interface
interface ProfileUser {
  username: string;
  display_name: string;
  // Add any other properties that the user object might have
}

export default function UserProfile({ params }: { params: { id: string } }) {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  // Change this line
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);

  const { user } = useUser();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch(`/api/users/${params.id}`);
        const data = await response.json();
        // Ensure that the data matches the ProfileUser interface
        setProfileUser(data.user as ProfileUser);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    async function fetchUserPosts() {
      try {
        const response = await fetch(`/api/posts?userId=${params.id}`);
        const data = await response.json();
        setUserPosts(data.posts);
      } catch (error) {
        console.error("Error fetching user posts:", error);
      }
    }

    async function fetchLikedPosts() {
      try {
        const response = await fetch(`/api/posts?likedBy=${params.id}`);
        const data = await response.json();
        setLikedPosts(data.posts);
      } catch (error) {
        console.error("Error fetching liked posts:", error);
      }
    }
    fetchUserData();
    fetchUserPosts();
    fetchLikedPosts();
  }, [params.id]);

  const handleLikePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        // Update userPosts
        setUserPosts((prevPosts) =>
          prevPosts.map((post) =>
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

        // Update likedPosts
        setLikedPosts((prevLikedPosts) => {
          const postIndex = prevLikedPosts.findIndex(
            (post) => post.id === postId
          );
          if (postIndex !== -1) {
            // Post is in likedPosts, remove it if unliked
            if (prevLikedPosts[postIndex].isLiked) {
              return prevLikedPosts.filter((post) => post.id !== postId);
            } else {
              // Update the like status and count
              return prevLikedPosts.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      isLiked: true,
                      likes_count: post.likes_count + 1,
                    }
                  : post
              );
            }
          } else {
            // Post is not in likedPosts, add it if liked
            const likedPost = userPosts.find((post) => post.id === postId);
            if (likedPost && !likedPost.isLiked) {
              return [
                ...prevLikedPosts,
                {
                  ...likedPost,
                  isLiked: true,
                  likes_count: likedPost.likes_count + 1,
                },
              ];
            }
          }
          return prevLikedPosts;
        });
      } else {
        console.error("Error liking post:", data.error);
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleFollowUser = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}/follow`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        // Optionally, you can update the UI to reflect the follow status
      } else {
        console.error("Error following user:", data.error);
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  if (!profileUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-white">
        {profileUser.username}&apos;s Profile
      </h1>
      <p className="mb-8 text-white">
        Display Name: {profileUser.display_name}
      </p>

      <h2 className="text-2xl font-bold mb-4 text-white">User&apos;s Posts</h2>
      <ul className="space-y-4 mb-8">
        {userPosts.map((post) => (
          <li key={post.id} className="bg-white p-4 rounded shadow">
            <p className="mb-2 text-black">{post.content}</p>
            <small className="text-gray-500">
              {new Date(post.created_at).toLocaleString()}
            </small>
            <div className="mt-2">
              <button
                onClick={() => handleLikePost(post.id)}
                className={`mr-2 ${
                  post.isLiked ? "text-red-500" : "text-gray-500"
                }`}
              >
                {post.isLiked ? "♥" : "♡"} {post.likes_count}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="text-2xl font-bold mb-4 text-white">Liked Posts</h2>
      <ul className="space-y-4">
        {likedPosts.map((post) => (
          <li key={post.id} className="bg-white p-4 rounded shadow">
            <p className="mb-2 text-black">{post.content}</p>
            <small className="text-gray-500">
              <Link href={`/users/${post.user_id}`} className="hover:underline">
                {post.username}
              </Link>{" "}
              - {new Date(post.created_at).toLocaleString()}
            </small>
            <div className="mt-2">
              <button
                onClick={() => handleLikePost(post.id)}
                className="text-red-500 mr-2"
              >
                ♥ {post.likes_count}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {user && user.id !== params.id && (
        <button
          onClick={handleFollowUser}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Follow
        </button>
      )}
    </div>
  );
}
