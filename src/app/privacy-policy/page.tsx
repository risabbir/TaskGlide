
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
    <>
      <Header />
      <main className="flex-grow py-8">
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
              When you use {APP_NAME} in guest mode, the application stores the following data exclusively in your web browser's local storage:
              <ul className="list-disc list-outside space-y-2 pl-6 mt-3">
                <li><strong>Task Data:</strong> All tasks, descriptions, due dates, priorities, tags, subtasks, dependencies, recurrence rules, column assignments, and any other related data you create and manage within the application.</li>
                <li><strong>Guest ID:</strong> A unique anonymous Guest ID is generated and stored in your browser's localStorage to identify your session's data locally.</li>
                <li><strong>Theme Preference:</strong> Your selected theme (light/dark) is stored in localStorage.</li>
                <li><strong>AI Feature Data:</strong> If you use AI-powered features (e.g., enhance description, suggest tags), the relevant task data (like title, description) is sent from your browser directly to an AI service provider to generate suggestions. This data is processed according to the AI provider's privacy policies. {APP_NAME} itself does not store the AI-generated suggestions beyond their temporary display in the app, unless you explicitly save them as part of your task data (which is then stored locally in your browser).</li>
              </ul>
               <p className="mt-2">No personally identifiable information (like your name or email address) is collected, stored, or transmitted by the {APP_NAME} application itself in guest mode.</p>
            </Section>

            <Section title="How We Use Your Information">
              The information stored locally in your browser is used solely to:
              <ul className="list-disc list-outside space-y-2 pl-6 mt-3">
                <li>Provide, operate, and maintain the application's features for your current browser session.</li>
                <li>Persist your task data locally so you can access it when you revisit the site from the same browser on the same device.</li>
                <li>Remember your theme preference.</li>
                <li>Enable AI features (communication for AI features is between your browser and the AI provider).</li>
              </ul>
            </Section>

            <Section title="Data Storage and Security (Guest Mode)">
              <p>All your task data and your Guest ID are stored in your web browser's local storage. This data is not sent to or stored on any external servers by {APP_NAME}. It is only accessible through your browser on the device you are using.</p>
              <p className="mt-2">**Clearing your browser's cache or site-specific data for {APP_NAME} will permanently remove all your locally stored task data and Guest ID.**</p>
              <p className="mt-2">Since data is stored locally, you are responsible for the security of the device and browser you use to access the application. We recommend using up-to-date browser software and appropriate security measures on your device.</p>
            </Section>
            
            <Section title="Sharing Your Information">
              We do not share your locally stored guest data with any third parties. If you use AI features, the necessary task context is shared directly from your browser with the AI service provider as described above.
            </Section>

            <Section title="Your Data Rights (Guest Mode)">
              You have full control over your locally stored data. You can:
              <ul className="list-disc list-outside space-y-2 pl-6 mt-3">
                <li>View, edit, and delete your tasks within the application.</li>
                <li>Clear all your data by using the "Clear All Data & Start New Guest Session" option on the "Guest Info" page (accessible via the guest icon in the header/bottom navigation).</li>
                <li>Manually clear your browser's local storage for this website.</li>
              </ul>
            </Section>
            
            <Section title="Cookies">
              {APP_NAME} uses `localStorage` for data persistence in guest mode and for theme preference. It does not use traditional cookies for tracking or user identification across different websites.
            </Section>

            <Section title="Future Functionality (Registered Accounts)">
              We plan to introduce user accounts in the future, which will involve storing data on secure cloud servers and will be governed by an updated Privacy Policy. This current policy applies only to the guest-only mode.
            </Section>

            <Section title="Changes to This Privacy Policy">
              We may update this privacy policy from time to time, especially if new features (like registered accounts) are introduced. We will notify you of any significant changes by posting the new privacy policy on this page and updating the "Last updated" date. You are advised to review this privacy policy periodically for any changes.
            </Section>

             <div className="text-sm text-muted-foreground pt-6 border-t border-dashed">
              <p>If you have questions or comments about this policy, you may use the "Request a Feature" page to contact us (as this is a demo project, a real contact method would be provided here for a production app).</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
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
