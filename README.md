# TalentTrack (Mini ATS) 👥

TalentTrack is a lightweight, modern Applicant Tracking System (ATS) built with React, Vite, and Supabase. It provides a clean interface for managing job openings and tracking candidates through the hiring pipeline using a drag-and-drop Kanban board.

The application features an authentication system, role-based access control (Admin and Customer roles), and a responsive design that works across all devices.

## Features 🧰

-   **User Authentication**: Secure sign-up, sign-in, password recovery, and account deletion powered by Supabase Auth.
-   **Kanban Board**: A dynamic, drag-and-drop interface to visualize and manage the candidate pipeline (New, Screening, Interview, Offer, Hired, Rejected).
-   **Job Management**: Create, read, update, and delete job postings.
-   **Candidate Management**: Add, edit, and delete candidates, associating them with specific jobs.
-   **Admin Dashboard**: A dedicated view for administrators to manage all users, create new accounts, and view data across all customer accounts.
-   **Role-Based Access**: Differentiates between 'Admin' and 'Customer' roles, with Row Level Security (RLS) policies in Supabase ensuring data privacy.
-   **Intuitive UI**: Smooth and immediate UI feedback for actions like updating candidate status, with user friendly error handling.
-   **Responsive Design**: A user-friendly experience on both desktop and mobile devices.

## Tech Stack 🛠️

-   **Frontend**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
-   **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
-   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) built on [Radix UI](https://www.radix-ui.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
-   **Routing**: [React Router](https://reactrouter.com/)
-   **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) for validation

## Backend with Supabase 💻

The backend is built on Supabase, utilizing features such as:

-   **Database**: A PostgreSQL database with tables for `profiles`, `user_roles`, `jobs`, and `candidates`.
-   **Row Level Security (RLS)**: Policies are in place to ensure that users can only access and modify their own data. Administrators have elevated privileges to view and manage all data.
-   **PostgreSQL Functions & Triggers**: Database indexes are used to optimize RLS performance on queries.
-   **Migrations**: Almost the whole database schema, including tables, roles, policies, and functions, is managed through SQL migration files located in the `supabase/migrations` directory.

## Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/fabian144/mini-ats.git
    cd mini-ats
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up Supabase:**
    -   Go to [Supabase](https://supabase.com/) and create a new project.
    -   Navigate to the **SQL Editor** in your Supabase project dashboard.
    -   Copy the contents of the SQL files from the `supabase/migrations` directory and run them in the editor to set up your database schema and policies.
    -   Go to **Project Settings** > **API**.
    -   Find your **Project URL** and `anon` **Public Key**.

4.  **Configure environment variables:**
    -   Create a `.env.local` file in the root of the project.
    -   Add your Supabase credentials to the file:
        ```env
        VITE_SUPABASE_URL=YOUR_SUPABASE_URL
        VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_ANON_KEY
        ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```

## Available Scripts

-   `npm run dev`: Starts the Vite development server.
-   `npm run build`: Builds the application for production.
-   `npm run lint`: Lints the codebase using ESLint.
-   `npm run deploy`: Builds and deploys the application to GitHub Pages.