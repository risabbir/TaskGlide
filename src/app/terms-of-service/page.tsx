
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import { FileText } from "lucide-react";

export default function TermsOfServicePage() {
  useEffect(() => {
    document.title = `Terms of Service | ${APP_NAME}`;
  }, []);

  const lastUpdatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mt-4">
              Terms of Service
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Please read these terms carefully. Last updated: {lastUpdatedDate}.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 sm:p-10 rounded-xl shadow-xl border space-y-8">
            <Section title="1. Acceptance of Terms">
              By accessing and using {APP_NAME} (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. Currently, the Service operates in a guest-only mode where data is stored in your browser's local storage. Any participation in this Service will constitute acceptance of this agreement. If you do not agree to abide by these terms, please do not use this Service.
            </Section>

            <Section title="2. Description of Service (Guest Mode)">
              {APP_NAME} is a task management tool. In its current guest mode, data is stored locally in your browser. The Service is provided "as is," and {APP_NAME} (and its creators) assume no responsibility for the timeliness, deletion, mis-delivery, or failure to store any user data due to browser issues, clearing of local storage, or other factors outside of the application's direct control. You are responsible for managing your browser data.
            </Section>

            <Section title="3. User Accounts (Guest Mode)">
              No user accounts are created in the traditional sense. A unique anonymous Guest ID is generated and stored locally to associate your task data within your browser. This data is not accessible if you use a different browser, device, or clear your local storage.
            </Section>

            <Section title="4. User Conduct">
              You agree not to use the Service to create or store content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically, or otherwise objectionable.
            </Section>

            <Section title="5. Intellectual Property">
              The Service and its original content (excluding user-generated task data), features, and functionality are and will remain the exclusive property of {APP_NAME}'s creators and its licensors.
            </Section>
            
            <Section title="6. AI Features">
              The Service may utilize AI features (e.g., powered by Genkit and Google AI), which may require you to configure your own API key. Your use of these features is subject to the terms and policies of the AI service provider (e.g., Google). We make no warranties regarding the accuracy, completeness, or suitability of AI-generated content. You are solely responsible for how you use it.
            </Section>

            <Section title="7. Disclaimer of Warranties">
              The Service is provided on an "as is" and "as available" basis. {APP_NAME} and its creators disclaim all warranties of any kind, express or implied, including, without limitation, the warranties of merchantability, fitness for a particular purpose, and non-infringement. We make no warranty that the Service will be error-free or that access thereto will be continuous or uninterrupted. You use the Service at your own discretion and risk.
            </Section>

            <Section title="8. Limitation of Liability">
              In no event will {APP_NAME} or its creators be liable with respect to any subject matter of this agreement under any contract, negligence, strict liability, or other legal or equitable theory for: (i) any special, incidental, or consequential damages; (ii) the cost of procurement for substitute products or services; (iii) for interruption of use or loss or corruption of data (especially locally stored data); or (iv) for any amounts that exceed the fees paid by you to {APP_NAME} (if any). {APP_NAME} shall have no liability for any failure or delay due to matters beyond their reasonable control.
            </Section>

            <Section title="9. Changes to Terms">
              {APP_NAME} reserves the right, at its sole discretion, to modify or replace these Terms at any time. We will make reasonable efforts to provide notice of material changes. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
            </Section>

            <Section title="10. Governing Law">
             These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which the creators of {APP_NAME} reside, without regard to its conflict of law provisions. (For a real app, specify the jurisdiction).
            </Section>
            
            <div className="text-sm text-muted-foreground pt-6 border-t border-dashed">
              <p>If you have any questions about these Terms, please contact us (as this is a demo project, a real contact method would be provided here for a production app).</p>
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
