# TaskGlide

An AI-enhanced personal task management tool designed to streamline your workflow and supercharge your productivity.

[![React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=61DAFB)](https://react.dev/) [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-blue?logo=tailwindcss&logoColor=38B2AC)](https://tailwindcss.com/)

---

## Overview

TaskGlide is a modern, intuitive, and visually-driven personal task manager built to help you conquer your projects. With a flexible Kanban board, rich task details, and powerful AI assistance, it’s designed to bring clarity and focus to your work.

This version operates in a **Guest-Only Mode**, meaning you can get started instantly without creating an account. All your data is securely stored on your own device, ensuring complete privacy.

---

## Live Demo

Experience TaskGlide in action. No sign-up required.

**[View TaskGlide Live](https://task-glide.vercel.app/)**


---

## How It Works: Guest-Only Mode

TaskGlide is designed for immediate use with maximum privacy:

-   **No Accounts Needed:** Jump right in. There's no sign-up or login required.
-   **Local Data Storage:** All your tasks, columns, and settings are saved directly in your web browser's `localStorage`. Your data never leaves your device.
-   **Session Persistence:** Your work remains available as long as you use the same browser and don't clear your site data.
-   **Full Control:** You can manage your guest session and clear all data from the **Guest Info** page, accessible via the user icon in the header.

---

## Key Features

### Core Functionality
-   **Visual Kanban Board:** Drag-and-drop tasks across customizable columns (`To Do`, `In Progress`, `Done`).
-   **Rich Task Details:** Add descriptions, priorities, due dates, tags, subtasks, and dependencies.
-   **Time Tracking:** A simple start/stop timer for tasks in the "In Progress" column helps you monitor your effort.
-   **Powerful Filtering & Sorting:** Quickly find tasks with robust filtering and multiple sorting options.
-   **Fully Responsive:** Enjoy a seamless experience on both desktop and mobile, with a dedicated bottom navigation for smaller screens.
-   **Light & Dark Mode:** Switch between themes to match your preference and reduce eye strain.

### AI-Powered Enhancements
TaskGlide integrates **Google's Gemini models via Genkit** to provide intelligent assistance directly within your workflow:

-   **Enhance Description:** Automatically enrich a brief task title with a detailed, structured description.
-   **Suggest Tags:** Get relevant, contextual tags for better task categorization.
-   **Suggest Subtasks:** Break down complex tasks into smaller, actionable steps.
-   **Suggest Focus Batch:** Ask the AI to recommend a small batch of 2-3 tasks to focus on next, based on priority and deadlines.
-   **Task Insights:** Receive actionable suggestions and analysis on a specific task to improve its clarity and planning.

---

## Tech Stack

TaskGlide is built with a modern, performant, and type-safe technology stack:

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **UI Library:** [React](https://reactjs.org/)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
-   **AI Integration:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
-   **State Management:** React Context with `useReducer` for robust local state management.

---

## Suggest a Feature

Have an idea to make TaskGlide even better? We'd love to hear it.

**[Submit a Feature Request or Suggestion](https://task-glide.vercel.app/feature-request)**

---

## What's Next? (Potential Future Enhancements)

-   **User Accounts & Cloud Sync:** Securely sign up to save and sync your data across devices with Firebase Firestore.
-   **Advanced AI Features:** Automated task scheduling, goal setting, and intelligent progress reports.
-   **Calendar View:** Visualize tasks with due dates in a calendar format.
-   **Team Collaboration:** Share boards and assign tasks to others.

---

## Copyright

&copy; 2025 R.Sabbir. All Rights Reserved.
