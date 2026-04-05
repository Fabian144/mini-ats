# TalentTrack (Mini ATS) 👥

<div align="center">
<br/>

A lightweight, modern Applicant Tracking System built with **React**, **Vite**, and **Supabase**. Manage job openings and track candidates through the hiring pipeline using a drag-and-drop Kanban board and more.

[![Live Demo](https://img.shields.io/badge/Live_demo-TalentTrack-g?style=for-the-badge&logo=github)](https://fabian144.github.io/mini-ats/)

</div>

## Features 🧰

-   **User Authentication**: Secure sign-up, sign-in, password recovery, and account deletion powered by Supabase Auth.
-   **Admin Dashboard**: A dedicated view for administrators to manage all users, create new accounts and view/modify data across all customer accounts.
-   **Kanban Board**: A dynamic, drag-and-drop interface to visualize and manage the candidate pipeline (New, Screening, Interview, Offer, Hired, Rejected).
-   **Job Management**: Create, read, update, and delete job postings.
-   **Candidate Management**: Add, edit, delete and associate candidates with specific jobs.
-   **Intuitive UI**: Smooth and immediate UI with user friendly error handling.
-   **Responsive Design**: Works well on both desktop and mobile devices.

## Backend with Supabase 💻

The backend is built on Supabase, utilizing features such as:

-   **Database**: A PostgreSQL database with tables for `profiles`, `user_roles`, `jobs`, and `candidates`.
-   **Row Level Security (RLS)**: Policies are in place to ensure that users can only access and modify their own data. Administrators have elevated privileges to view and manage all data.
-   **PostgreSQL Functions & Triggers**: Database indexes are used to optimize RLS performance on queries.
-   **Migrations**: Almost the whole database schema, including tables, roles, policies, and functions, is managed through SQL migration files located in the `supabase/migrations` directory.

## Run project locally

Follow these steps to run this project in a development server:

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
    -   Copy your **Publishable key**.

4.  **Configure environment variables:**
    -   Create a `.env` file in the root of the project.
    -   Add the project URL and publishable key:
        ```env
        VITE_SUPABASE_URL=https://yourprojectid.supabase.co
        VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
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

## Tech Stack 🛠️

-   **Frontend**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
-   **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
-   **Routing**: [React Router](https://reactrouter.com/)
-   **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) for validation
