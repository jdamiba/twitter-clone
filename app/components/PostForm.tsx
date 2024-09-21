import { useState } from "react";

interface PostFormProps {
  onPostCreated: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (content.trim()) {
      try {
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim() }),
        });
        if (!response.ok) {
          throw new Error(`Failed to create post: ${response.statusText}`);
        }
        setContent("");
        onPostCreated();
      } catch (err) {
        console.error("Error creating post:", err);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={140}
        className="w-full p-2 border rounded text-black"
        placeholder="What's happening?"
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm">{140 - content.length} characters left</span>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Post
        </button>
      </div>
    </form>
  );
}
