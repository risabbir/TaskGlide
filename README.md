# TaskGlide

**Version:** 1.0.0 

## Overview

TaskGlide is an intuitive and modern personal task management application designed to help you organize your projects, track progress, and boost productivity. It features a visual Kanban board and is enhanced with AI-powered assistance to streamline your workflow.

**Live Demo:** [**View TaskGlide Live**](https://your-live-link-here.com) 🚀

## How It Works

In its current version, TaskGlide operates exclusively in a **Guest-Only Mode**. This means:

-   **No Accounts Needed:** Get started immediately without signing up.
-   **Local Data Storage:** All your tasks, columns, and settings are saved directly in your web browser's `localStorage`. Your data stays on your device.
-   **Data Persistence:** Your information will be available as long as you use the same browser and don't clear your site data.

You can manage your guest session and clear data from the **Guest Info** page, accessible via the user icon in the header.

## Current Features

-   **Visual Kanban Board:** Organize tasks with drag-and-drop functionality across columns (To Do, In Progress, Done).
-   **Rich Task Details:** Add descriptions, priorities, due dates, tags, subtasks, and dependencies to your tasks.
-   **Time Tracking:** A simple start/stop timer for tasks in the "In Progress" column.
-   **Filtering & Sorting:** Easily find tasks with powerful filtering (by status, priority, due date, search term) and sorting options.
-   **Responsive Design:** Fully usable on both desktop and mobile devices with a dedicated bottom navigation for mobile.
-   **Light & Dark Mode:** Switch between themes to suit your preference.

### ✨ AI-Powered Features

TaskGlide integrates **Google's Gemini models via Genkit** to provide intelligent assistance directly within your workflow. These features help you refine and manage your tasks more effectively:

-   **Enhance Description:** Automatically enrich a brief task title with a more detailed and structured description.
-   **Suggest Tags:** Get relevant tags for your tasks based on their title and description for better categorization.
-   **Suggest Subtasks:** Break down complex tasks into smaller, actionable steps.
-   **Suggest Focus Batch:** Ask the AI to recommend a small batch of 2-3 tasks to focus on next, based on priority and due dates.
-   **Task Insights:** Receive actionable suggestions and analysis on a specific task to improve its clarity, completeness, or planning.

## Tech Stack

TaskGlide is built with a modern, performant, and type-safe technology stack:

-   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
-   **UI Library:** [React](https://reactjs.org/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
-   **AI Integration:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
-   **State Management:** React Context with `useReducer` for local state.

## Suggest a Feature

Have an idea to make TaskGlide even better? We'd love to hear it!

➡️ **[Submit a Feature Request or Suggestion](/feature-request)**

## What's Next? (Potential Future Enhancements)

-   **User Accounts:** Securely sign up to save and sync your data across multiple devices.
-   **Cloud Sync:** Real-time data synchronization using Firebase Firestore.
-   **Advanced AI Features:** Including goal setting, automated task scheduling, and progress reports.
-   **Calendar View:** Visualize tasks with due dates in a calendar format.
-   **Team Collaboration:** Share boards and assign tasks to others.

## Copyright

&copy; 2024 R.Sabbir. All Rights Reserved.
