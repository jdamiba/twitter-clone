import { useState } from "react";

interface Post {
  id: number;
  isLiked: boolean;
  // Add other necessary properties
}

export default function Post({
  post,
  onPostUpdated,
}: {
  post: Post;
  onPostUpdated: (post: Post) => void;
}) {
  const [isLiked, setIsLiked] = useState(post.isLiked);

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed to like post: ${response.statusText}`);
      }
      setIsLiked(!isLiked);
      onPostUpdated(post);
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="mb-2">{post.content}</p>
      <div className="flex justify-between text-sm text-gray-500">
        <span>{new Date(post.created_at).toLocaleString()}</span>
        <button onClick={handleLike} className="text-blue-500">
          {isLiked ? "Unlike" : "Like"}
        </button>
      </div>
    </div>
  );
}
