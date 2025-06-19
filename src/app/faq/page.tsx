
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
    answer: `${APP_NAME} is an intuitive personal task management application designed to help you organize your projects, track your progress, and boost your productivity. You can create tasks, set priorities, due dates, add tags, subtasks, and manage them on a visual Kanban board. It also features AI-powered assistance for enhancing descriptions, suggesting tags, and more. Currently, it operates in a guest-only mode, storing data in your browser.`,
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
    answer: `In the current guest-only mode, all your task data and your Guest ID are stored locally in your web browser's localStorage. This data is not transmitted to any external servers and is only accessible from the specific browser you are using. Clearing your browser's cache or site data for ${APP_NAME} will remove this local data.`,
  },
  {
    id: "free-to-use",
    question: `Is ${APP_NAME} free to use?`,
    answer: `Yes, ${APP_NAME} is free to use in its current guest-only mode. AI features might require a Google AI API key, which has its own usage policies and potential costs if you exceed free tiers.`,
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
      - Using a different browser, device, or private/incognito mode will result in a new, empty session.
      - There is currently no cloud backup for guest data. The "Guest Info" page (accessible via the guest icon) shows your Guest ID and provides an option to clear your local data and start a new session.`,
  },
  {
    id: "ai-features",
    question: `Are there any AI features in ${APP_NAME}?`,
    answer: `Yes! ${APP_NAME} leverages AI (via Genkit and Google AI, requires your own API key setup in .env) to assist you with:
      - **Enhancing Task Descriptions**
      - **Suggesting Tags**
      - **Suggesting Subtasks**
      - **Suggesting Task Priority**
      - **Suggesting Focus Batch**
      - **Task Insights**`,
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
