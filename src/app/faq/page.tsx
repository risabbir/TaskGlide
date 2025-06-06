
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer"; // Added Footer import
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect } from "react";

// export const metadata: Metadata = {
//   title: `FAQ | ${APP_NAME}`,
//   description: `Frequently Asked Questions for ${APP_NAME}.`,
// };

const faqs = [
  {
    question: `What is ${APP_NAME}?`,
    answer: `${APP_NAME} is a powerful and intuitive task management application designed to help you organize your projects, track your progress, and boost your productivity. You can create tasks, set priorities, due dates, add tags, subtasks, and manage them on a visual Kanban board.`,
  },
  {
    question: "How do I create a new task?",
    answer: `You can create a new task in two main ways:
      1. Using the "Quick Add Task" bar at the top of the main board: Simply type a title for your task and press Enter or click the add button.
      2. Clicking the "New Task" button (or the "+" button on mobile): This opens a detailed modal where you can add a title, description, set priority, due date, tags, subtasks, and more.`,
  },
  {
    question: "Is my data safe?",
    answer: `Yes, we take data safety seriously.
      - For **Registered Users**: Your task data is securely stored in Firebase Firestore, a robust cloud database provided by Google. Your account is protected by Firebase Authentication. Profile pictures are stored in Firebase Storage.
      - For **Guest Users**: If you use the "Continue as Guest" feature, your task data and Guest ID are stored locally in your browser's localStorage. This data is not transmitted to our servers and is only accessible from that specific browser. Clearing your browser's cache or site data will remove this local data.`,
  },
  {
    question: `Can I use ${APP_NAME} for free?`,
    answer: `Yes, ${APP_NAME} offers a generous free tier for individual users, which includes all core task management features. This project is intended as a demonstration and a portfolio piece, so core functionality is free. For advanced features or team collaboration (if implemented in the future), there might be premium plans.`,
  },
  {
    question: "How do I organize my tasks?",
    answer: `${APP_NAME} offers several ways to organize your tasks:
      - **Columns (Status):** Move tasks through different stages of your workflow (e.g., To Do, In Progress, Review, Done) on the Kanban board.
      - **Priorities:** Assign High, Medium, or Low priority to tasks.
      - **Due Dates:** Set deadlines for your tasks.
      - **Tags:** Add custom tags to categorize tasks by project, context, or any system you prefer.
      - **Subtasks:** Break down larger tasks into smaller, manageable steps.
      - **Filters & Sort:** Use the filter sidebar to narrow down your task view by status, priority, due date, or search term, and sort them as needed.`,
  },
  {
    question: `What happens to my data if I use "Continue as Guest"?`,
    answer: `When you use the "Continue as Guest" feature, all the tasks and board configurations you create, along with your Guest ID, are stored in your web browser's local storage. This data is not saved on our servers. It will persist in that browser as long as you don't clear your browser's cache, cookies, or site-specific data. If you use a different browser or device, or if your browser data is cleared, the guest data will be lost. Starting a new guest session will generate a new Guest ID.`,
  },
  {
    question: "How can I save my guest data permanently?",
    answer: `To save your data permanently and access it across multiple devices, you need to sign up for a free ${APP_NAME} account. Currently, there is no automatic migration of guest data to a registered account. We recommend signing up before creating significant amounts of data you wish to keep long-term.`,
  },
  {
    question: `Are there any AI features in ${APP_NAME}?`,
    answer: `Yes! ${APP_NAME} leverages AI to assist you with:
      - **Enhancing Task Descriptions:** Get AI suggestions to make your task descriptions more comprehensive.
      - **Suggesting Tags:** AI can analyze your task title and description to recommend relevant tags.
      - **Suggesting Subtasks:** Break down complex tasks with AI-generated subtask ideas.
      - **Suggesting Focus Batch:** Get AI recommendations for a small batch of tasks to focus on next.`,
  },
];

export default function FAQPage() {
  useEffect(() => {
    document.title = `FAQ | ${APP_NAME}`;
  }, []);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow">
        <div className="max-w-3xl mx-auto bg-card text-card-foreground p-6 sm:p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-8 text-primary border-b pb-3">Frequently Asked Questions</h1>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left hover:no-underline text-lg font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </>
  );
}
