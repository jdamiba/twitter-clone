# Twitter Clone

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Getting Started](#getting-started)
7. [Deployment](#deployment)

## Introduction

This Twitter Clone is a full-stack application built with Next.js, React, and Clerk for authentication. It provides a social media platform where users can create posts, like posts, and interact with other users, mimicking core functionalities of Twitter. 4. [Application Architecture](#application-architecture) 5. [Authentication Flow](#authentication-flow) 6. [Main Application Flow](#main-application-flow) 7. [API Endpoints](#api-endpoints) 8. [Database Schema](#database-schema) 9. [State Management](#state-management) 10. [UI Components](#ui-components) 11. [Styling](#styling) 12. [Error Handling](#error-handling) 13. [Performance Optimizations](#performance-optimizations) 14. [Getting Started](#getting-started) 15. [Deployment](#deployment) 16. [Future Enhancements](#future-enhancements) 17. [Contributing](#contributing) 18. [License](#license)

## Introduction

This Twitter Clone is a full-stack application built with Next.js, React, and Clerk for authentication. It provides a social media platform where users can create posts, like posts, and interact with other users, mimicking core functionalities of Twitter.

## Features

- User authentication (sign up, login, logout)
- Create, read, update, and delete posts
- Like/unlike posts
- Reply to posts
- User profiles
- Feed of recent posts
- Pagination for posts
- Responsive design

## Technology Stack

- **Frontend**: React, Next.js
- **Backend**: Next.js API routes
- **Database**: Vercel Postgres
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Application Architecture

The application follows a typical Next.js structure:

- `app/`: Contains the main application code
  - `components/`: Reusable React components
  - `api/`: API routes
  - `(routes)/`: Page components for different routes
- `public/`: Static assets
- `styles/`: Global styles

The app uses the App Router feature of Next.js for routing.

## Authentication Flow

1. User signs up or logs in using Clerk's UI components.
2. Clerk handles the authentication process and provides a session token.
3. The app uses Clerk's `useUser` hook to access user information.
4. When a user is created or updated, a webhook is triggered
5. The webhook updates the user information in the Vercel Postgres database.

## Main Application Flow

### Home Page

1. User lands on the home page (`app/page.tsx`).
2. The page fetches recent posts from the `/api/posts` endpoint.
3. Posts are displayed in a list.
4. Authenticated users can create new posts using a form.

### Creating Posts

1. User enters post content in the form.
2. `handlePostSubmit` function is called on form submission.
3. A POST request is sent to `/api/posts`.
4. The new post is added to the database and returned in the response.
5. The UI is updated to show the new post.

### Interacting with Posts

1. Users can like posts by clicking the like button.
2. A POST request is sent to `/api/posts/[id]/like`.
3. The like status is toggled in the database.
4. The UI is updated to reflect the new like status and count.

### Replying to Posts

1. Users can reply to posts by using the reply form below each post.
2. When a reply is submitted, a new post is created with a `reply_to_id` referencing the original post.
3. Replies are displayed beneath the original post, creating a threaded conversation.

### User Profiles

1. Users can view profiles by navigating to `/users/[id]`.
2. The profile page fetches user information and posts from the respective API endpoints.
3. The page displays the user's posts and liked posts.

## API Endpoints

1. **POST /api/posts**

   - Creates a new post or reply
   - Request body: `{ content: string, reply_to_id?: string }`
   - Response: The created post object

2. **GET /api/posts**

   - Fetches posts, with optional filtering
   - Query parameters:
     - `userId`: Fetch posts by a specific user
     - `likedBy`: Fetch posts liked by a specific user
     - `page`: Pagination
   - Response: An array of post objects, current page, and total pages

3. **PUT /api/posts/[id]**

   - Updates an existing post
   - Request body: `{ content: string }`
   - Response: The updated post object

4. **DELETE /api/posts/[id]**

   - Deletes a post
   - Response: Success message

5. **POST /api/posts/[id]/like**

   - Likes or unlikes a post
   - Response: Updated like status and count

6. **GET /api/users/[id]**

   - Fetches user information
   - Response: User object with username and display name

7. **POST /api/clerk_webhook**
   - Handles Clerk webhook events, specifically user creation
   - Creates or updates user in the database

## Database Schema

The application uses Vercel Postgres with the following main tables:

1. **users**

   - id (primary key)
   - email
   - username
   - first_name
   - last_name
   - image_url
   - created_at
   - updated_at
   - subscription_tier

2. **posts**

   - id (primary key)
   - user_id (foreign key to users)
   - content
   - created_at
   - updated_at
   - reply_to_id (self-referencing foreign key, nullable)

3. **likes**
   - user_id (foreign key to users)
   - post_id (foreign key to posts)
   - created_at

## State Management

The application primarily uses React's built-in state management with `useState` and `useEffect` hooks. For more complex state management, consider implementing a solution like Redux or Zustand in future iterations.

## UI Components

The app uses a combination of custom components and Clerk's authentication components. Key components include:

- `Sidebar`: Navigation sidebar
- `PostForm`: Form for creating new posts
- `PostList`: Displays a list of posts
- `Post`: Individual post component
- `ReplyForm`: Form for submitting replies to posts
- `ReplyList`: Displays replies to a post
- `UserButton` (from Clerk): User authentication button

## Styling

The application uses Tailwind CSS for styling, providing a responsive and customizable design. Global styles are defined in `app/globals.css`.

## Error Handling

Error handling is implemented throughout the application:

- API routes use try-catch blocks to handle errors and return appropriate status codes.
- Client-side error handling is done using try-catch blocks in async functions.
- Error messages are displayed to users when operations fail.

## Performance Optimizations

- Server-side rendering for initial page loads
- Client-side navigation for faster subsequent page transitions
- Pagination for posts to limit data fetching
- Image optimization using Next.js Image component

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The app is designed to be deployed on Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure environment variables in Vercel project settings
4. Deploy the application

## Future Enhancements

- Implement real-time updates using WebSockets
- Add direct messaging functionality
- Implement hashtags and search functionality
- Add media upload capabilities for posts
- Enhance reply functionality with nested replies and threading
- Implement notifications for replies and mentions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
