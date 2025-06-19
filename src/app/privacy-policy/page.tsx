
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import { FileText } from "lucide-react";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = `Privacy Policy | ${APP_NAME}`;
  }, []);

  const lastUpdatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mt-4">
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Your privacy is important to us. Last updated: {lastUpdatedDate}.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 sm:p-10 rounded-xl shadow-xl border space-y-8">
            <Section title="Introduction">
              Welcome to {APP_NAME}! This application currently operates in a guest-only mode. This Privacy Policy explains what information is collected and how it's used in this mode.
            </Section>

            <Section title="Information We Collect (Guest Mode)">
              When you use {APP_NAME} in guest mode, we collect the following:
              <ul className="list-disc list-outside space-y-2 pl-6 mt-3">
                <li><strong>Task Data:</strong> All tasks, descriptions, due dates, priorities, tags, subtasks, dependencies, recurrence rules, and any other related data you create and manage are stored locally in your browser's localStorage.</li>
                <li><strong>Guest ID:</strong> A unique anonymous Guest ID is generated and stored in your browser's localStorage to identify your session's data.</li>
                <li><strong>AI Feature Data (If API Key Configured):</strong> When you use AI-powered features (e.g., enhance description, suggest tags), the relevant task data (like title, description) is sent to our AI service provider (Google AI via Genkit) to generate suggestions. This data is processed according to Google's privacy policies. We do not store the AI-generated suggestions beyond their display in the app, unless you explicitly save them as part of your task data (which is then stored locally).</li>
                <li><strong>Theme Preference:</strong> Your selected theme (light/dark) is stored in localStorage.</li>
              </ul>
               <p className="mt-2">No personally identifiable information (like email or name) is collected or stored by the application in guest mode.</p>
            </Section>

            <Section title="How We Use Your Information">
              We use the information collected in guest mode solely to:
              <ul className="list-disc list-outside space-y-2 pl-6 mt-3">
                <li>Provide, operate, and maintain the application's features for your current browser session.</li>
                <li>Store your task data locally so you can access it when you revisit the site from the same browser.</li>
                <li>Improve user experience by remembering your theme preference.</li>
                <li>Process AI feature requests (if you use them and have an API key).</li>
              </ul>
            </Section>

            <Section title="Data Storage and Security (Guest Mode)">
              <p>Your task data and Guest ID are stored in your web browser's local storage. This data is not sent to our servers and is only accessible through your browser. Clearing your browser's cache or site-specific data for {APP_NAME} will permanently remove this information.</p>
              <p className="mt-2">Since data is stored locally, you are responsible for the security of the device and browser you use to access the application.</p>
            </Section>
            
            <Section title="Sharing Your Information">
              We do not share your locally stored guest data with any third parties. If you use AI features, the necessary task context is shared with Google AI as described above.
            </Section>

            <Section title="Your Data Rights (Guest Mode)">
              You have full control over your locally stored data. You can delete your tasks within the application, or clear all data by clearing your browser's local storage for this site. The "Guest Info" page (accessible via the guest icon in the header) provides an option to "Clear All Data & Start New Guest Session."
            </Section>

            <Section title="Changes to This Privacy Policy">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date. You are advised to review this privacy policy periodically for any changes.
            </Section>

             <div className="text-sm text-muted-foreground pt-6 border-t border-dashed">
              <p>If you have questions or comments about this policy, you may contact us (as this is a demo project, a real contact method would be provided here for a production app).</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <section>
    <h2 className="text-2xl font-semibold mb-3 text-primary flex items-center">
      <FileText size={20} className="mr-2.5" /> {title}
    </h2>
    <div className="text-muted-foreground leading-relaxed space-y-2 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1">
      {children}
    </div>
  </section>
);
