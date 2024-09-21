import Post from "./Post";

interface Post {
  content: string;
  created_at: string | number | Date;
  id: number;
  isLiked: boolean;
  // Add other necessary properties
}

export default function PostList({
  posts,
  onPostUpdated,
}: {
  posts: Post[];
  onPostUpdated: (post: Post) => void;
}) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Post key={post.id} post={post} onPostUpdated={onPostUpdated} />
      ))}
    </div>
  );
}
