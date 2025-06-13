
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import { FileText } from "lucide-react"; // Removed ShieldCheck
import type { Metadata } from 'next';

// export const metadata: Metadata = { // Uncomment if converting to Server Component
//   title: `Privacy Policy | ${APP_NAME}`,
//   description: `Understand how ${APP_NAME} collects, uses, and protects your personal information.`,
// };

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
            {/* <ShieldCheck className="mx-auto h-16 w-16 text-primary mb-4" /> Removed Icon */}
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mt-4">
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Your privacy is important to us. Last updated: {lastUpdatedDate}.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 sm:p-10 rounded-xl shadow-xl border space-y-8">
            <Section title="Introduction">
              Welcome to {APP_NAME}! We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it. If you have any questions or concerns about this policy, or our practices with regards to your personal information, please contact us.
            </Section>

            <Section title="Information We Collect">
              As a user of {APP_NAME}, we may collect the following types of information:
              <ul className="list-disc list-outside space-y-2 pl-6 mt-3">
                <li><strong>Account Information:</strong> If you register for an account, we collect your email address and password. You may optionally provide a display name and profile picture (if this feature is enabled and you choose to use it).</li>
                <li><strong>Task Data:</strong> We store the tasks, descriptions, due dates, priorities, tags, subtasks, dependencies, recurrence rules, and any other related data you create and manage within the application.</li>
                <li><strong>Guest Data:</strong> If you use the "Continue as Guest" feature, your task data and a unique Guest ID are stored locally in your browser's localStorage. This data is not transmitted to our servers.</li>
                <li><strong>Usage Data:</strong> We may collect anonymized or aggregated information about how you use our application, such as features accessed and time spent on the app, to help us improve our services.</li>
                <li><strong>AI Feature Data:</strong> When you use AI-powered features (e.g., enhance description, suggest tags), the relevant task data (like title, description) is sent to our AI service provider (Google AI via Genkit) to generate suggestions. This data is processed according to Google's privacy policies. We do not store the AI-generated suggestions long-term beyond their display in the app, unless you explicitly save them as part of your task data.</li>
              </ul>
            </Section>

            <Section title="How We Use Your Information">
              We use the information we collect in various ways, including to:
              <ul className="list-disc list-outside space-y-2 pl-6 mt-3">
                <li>Provide, operate, and maintain our application and its features.</li>
                <li>Improve, personalize, and expand our application.</li>
                <li>Understand and analyze how you use our application to enhance user experience.</li>
                <li>Communicate with you, if necessary, for customer service or important updates regarding the application.</li>
                <li>Process your task data as directed by you within the application.</li>
                <li>Identify and prevent fraud or security issues.</li>
              </ul>
            </Section>

            <Section title="Data Storage and Security">
              <p><strong>Registered Users:</strong> Your data (account information and task data) is stored on secure Firebase servers (Firestore for task data, Firebase Authentication for account credentials, and Firebase Storage for profile pictures if enabled). We rely on Firebase's robust security measures to protect your information. It is crucial that your Firebase project's security rules are correctly configured to protect this data.</p>
              <p className="mt-2"><strong>Guest Users:</strong> Your task data and Guest ID are stored locally in your browser's localStorage. This data is not sent to our servers and is only accessible through your browser. Clearing your browser data will remove this information.</p>
            </Section>
            
            <Section title="Sharing Your Information">
              We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice or are required by law. This does not include trusted third parties who assist us in operating our application (like Firebase and Google AI for AI features), conducting our business, or serving our users, so long as those parties agree to keep this information confidential and process it securely.
            </Section>

            <Section title="Your Data Rights">
              Depending on your location and applicable laws, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. For registered users, you can manage most of your task data directly within the application. To request deletion of your account and associated data, please contact us. Guest users can clear their data by clearing their browser's local storage for this site.
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
