interface User {
  id: string; // UUID is represented as string in TypeScript
  username: string;
  displayName: string | null; // VARCHAR can be null
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  profileImageUrl: string;
}

export default function UserProfile({ user }: { user: User }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <img
        src={user.profileImageUrl}
        alt={user.username}
        className="w-16 h-16 rounded-full mb-2"
      />
      <h2 className="text-xl font-bold">{user.username}</h2>
      <p className="text-gray-600">{user.bio || "No bio available"}</p>
    </div>
  );
}
