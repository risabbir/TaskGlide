
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
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    id: "what-is-app",
    question: `What is ${APP_NAME}?`,
    answer: `${APP_NAME} is an intuitive personal task management application designed to help you organize your projects, track your progress, and boost your productivity. You can create tasks, set priorities, due dates, add tags, subtasks, and manage them on a visual Kanban board. It also features AI-powered assistance for enhancing descriptions, suggesting tags, and more. Currently, it operates in a guest-only mode, storing all data in your browser's local storage.`,
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
    question: "Where is my data stored in guest mode?",
    answer: `In the current guest-only mode, all your task data (tasks, columns, settings) and your unique Guest ID are stored locally in your web browser's localStorage. This data is not transmitted to any external servers and is only accessible from the specific browser and device you are using.`,
  },
  {
    id: "free-to-use",
    question: `Is ${APP_NAME} free to use?`,
    answer: `Yes, ${APP_NAME} is completely free to use in its current guest-only mode. AI-powered features are available to assist with task management. These AI features utilize services that process your task input (like title and description) to provide suggestions.`,
  },
  {
    id: "organize-tasks",
    question: "How do I organize my tasks?",
    answer: `${APP_NAME} offers several ways to organize your tasks:
      - **Columns (Status):** Move tasks through different stages of your workflow (e.g., To Do, In Progress, Done) on the Kanban board.
      - **Priorities:** Assign High, Medium, or Low priority to tasks.
      - **Due Dates:** Set deadlines for your tasks.
      - **Tags:** Add custom tags to categorize tasks.
      - **Subtasks:** Break down larger tasks into smaller steps.
      - **Dependencies:** Link tasks that must be completed before others.
      - **Filters & Sort:** Use the filter sidebar to narrow down your task view and sort them as needed.`,
  },
  {
    id: "save-guest-data",
    question: "How can I ensure my guest data isn't lost?",
    answer: `Your guest data is stored in your browser's local storage. To avoid losing it:
      - Do not clear your browser's cache, cookies, or site-specific data for ${APP_NAME}.
      - Using a different browser, device, or a private/incognito window will result in a new, empty session.
      - There is currently no cloud backup or account synchronization for guest data. 
      - The "Guest Info" page (accessible via the guest icon in the header/bottom navigation) shows your current Guest ID and provides an option to "Clear All Data & Start New Guest Session," which will wipe your locally stored tasks and begin a new empty session. Be cautious with this option.`,
  },
  {
    id: "ai-features",
    question: `Are there any AI features in ${APP_NAME}?`,
    answer: `Yes! ${APP_NAME} leverages AI to assist you with:
      - Enhancing Task Descriptions
      - Suggesting Tags for tasks
      - Suggesting Subtasks to break down larger tasks
      - Suggesting a Focus Batch of tasks to work on
      - Providing Task Insights with actionable suggestions.
      These features are designed to help you manage your tasks more effectively by sending relevant task details (like title and description) to an AI service and displaying the suggestions.`,
  },
  {
    id: "registered-accounts",
    question: "Will there be user accounts or cloud sync in the future?",
    answer: "The ability to sign up for an account to save and sync your data across devices is a planned feature. For now, TaskGlide operates in a guest-only mode using local browser storage.",
  }
];

export default function FAQPage() {
  useEffect(() => {
    document.title = `FAQ | ${APP_NAME}`;
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow py-8">
        <div className="max-w-3xl mx-auto"> 
          <div className="text-center mb-12">
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
