import Post from "./Post";

export default function PostList({ posts, onPostUpdated }) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Post key={post.id} post={post} onPostUpdated={onPostUpdated} />
      ))}
    </div>
  );
}
