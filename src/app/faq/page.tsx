
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { APP_NAME } from "@/lib/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect } from "react";
import { HelpCircle } from "lucide-react"; // Removed BookOpenText
import type { Metadata } from 'next';

// export const metadata: Metadata = { // This needs to be uncommented if making this a Server Component
//   title: `FAQ | ${APP_NAME}`,
//   description: `Frequently Asked Questions about ${APP_NAME}, your comprehensive task management tool.`,
// };

const faqs = [
  {
    id: "what-is-app",
    question: `What is ${APP_NAME}?`,
    answer: `${APP_NAME} is a powerful and intuitive task management application designed to help you organize your projects, track your progress, and boost your productivity. You can create tasks, set priorities, due dates, add tags, subtasks, and manage them on a visual Kanban board. It also features AI-powered assistance for enhancing descriptions, suggesting tags, and more.`,
  },
  {
    id: "create-task",
    question: "How do I create a new task?",
    answer: `You can create a new task in two main ways:
      1. Using the "Quick Add Task" bar at the top of the main board: Simply type a title for your task and press Enter or click the add button.
      2. Clicking the "New Task" button (or the "+" button on mobile): This opens a detailed modal where you can add a title, description, set priority, due date, tags, subtasks, and more.`,
  },
  {
    id: "data-safety",
    question: "Is my data safe?",
    answer: `Yes, data safety is a priority.
      - For **Registered Users**: Your task data is securely stored in Firebase Firestore, a robust cloud database provided by Google. Your account is protected by Firebase Authentication, and profile pictures (if feature is enabled) are stored in Firebase Storage. Ensure your Firebase project's security rules are correctly configured as per the README.
      - For **Guest Users**: If you use the "Continue as Guest" feature, your task data and Guest ID are stored locally in your browser's localStorage. This data is not transmitted to our servers and is only accessible from that specific browser. Clearing your browser's cache or site data will remove this local data.`,
  },
  {
    id: "free-to-use",
    question: `Can I use ${APP_NAME} for free?`,
    answer: `Yes, ${APP_NAME} offers a generous free tier for individual users, which includes all core task management features. This project is intended as a demonstration and a portfolio piece, so core functionality is free. Firebase services have their own free tiers; usage beyond these (e.g., extensive Storage) might require a Firebase project billing plan.`,
  },
  {
    id: "organize-tasks",
    question: "How do I organize my tasks?",
    answer: `${APP_NAME} offers several ways to organize your tasks:
      - **Columns (Status):** Move tasks through different stages of your workflow (e.g., To Do, In Progress, Review, Done) on the Kanban board.
      - **Priorities:** Assign High, Medium, or Low priority to tasks.
      - **Due Dates:** Set deadlines for your tasks.
      - **Tags:** Add custom tags to categorize tasks by project, context, or any system you prefer.
      - **Subtasks:** Break down larger tasks into smaller, manageable steps.
      - **Dependencies:** Link tasks that must be completed before others can start.
      - **Filters & Sort:** Use the filter sidebar to narrow down your task view by status, priority, due date, or search term, and sort them as needed.`,
  },
  {
    id: "guest-data",
    question: `What happens to my data if I use "Continue as Guest"?`,
    answer: `When you use the "Continue as Guest" feature, all the tasks and board configurations you create, along with your Guest ID, are stored in your web browser's local storage. This data is not saved on our servers. It will persist in that browser as long as you don't clear your browser's cache, cookies, or site-specific data. If you use a different browser or device, or if your browser data is cleared, the guest data will be lost.`,
  },
  {
    id: "save-guest-data",
    question: "How can I save my guest data permanently?",
    answer: `To save your data permanently and access it across multiple devices, you need to sign up for a free ${APP_NAME} account. Currently, there is no automatic migration of guest data to a registered account. We recommend signing up before creating significant amounts of data you wish to keep long-term.`,
  },
  {
    id: "ai-features",
    question: `Are there any AI features in ${APP_NAME}?`,
    answer: `Yes! ${APP_NAME} leverages AI (via Genkit and Google AI) to assist you with:
      - **Enhancing Task Descriptions:** Get AI suggestions to make your task descriptions more comprehensive.
      - **Suggesting Tags:** AI can analyze your task title and description to recommend relevant tags.
      - **Suggesting Subtasks:** Break down complex tasks with AI-generated subtask ideas.
      - **Suggesting Task Priority:** Get AI input on appropriate priority levels.
      - **Suggesting Focus Batch:** Receive AI recommendations for a small batch of tasks to focus on next.
      - **Task Insights:** Get AI-driven suggestions for improving or managing a specific task.`,
  },
  {
    id: "permission-denied",
    question: "I'm a registered user and my tasks are not saving. I see 'PERMISSION_DENIED' errors.",
    answer: `This is almost always due to a configuration issue with your Firebase project, not the app's code itself. Please carefully review the "CRITICAL: Firestore PERMISSION_DENIED Errors" section in the README.md file. The most common causes are:
      1.  **Firebase Project ID Mismatch:** The \`NEXT_PUBLIC_FIREBASE_PROJECT_ID\` in your \`.env\` file does not exactly match the Project ID of the Firebase project where you've set up Firestore and its security rules.
      2.  **Incorrect Firestore Security Rules:** The rules in your Firebase Console's Firestore Database -> Rules tab are not exactly as specified in the README.md, or they haven't been published correctly.
    The README provides detailed steps to verify and fix these issues, including using the Firestore Rules Simulator.`,
  },
];

export default function FAQPage() {
  useEffect(() => {
    document.title = `FAQ | ${APP_NAME}`;
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            {/* <BookOpenText className="mx-auto h-16 w-16 text-primary mb-4" /> Removed Icon */}
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mt-4">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Find answers to common questions about {APP_NAME}.
            </p>
          </div>
          
          <div className="bg-card text-card-foreground p-6 sm:p-8 rounded-xl shadow-xl border">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq) => (
                <AccordionItem value={faq.id} key={faq.id} className="border-b last:border-b-0">
                  <AccordionTrigger className="text-left hover:no-underline py-4 text-lg font-semibold text-foreground hover:text-primary transition-colors focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md px-3">
                    <span className="flex items-center">
                      <HelpCircle className="h-5 w-5 mr-3 text-primary/80 shrink-0" />
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4 px-3">
                    <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
