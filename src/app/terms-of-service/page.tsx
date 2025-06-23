
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
    <>
      <Header />
      <main className="flex-grow py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl mt-4">
              Terms of Service
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Please read these terms carefully. Last updated: {lastUpdatedDate}.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 sm:p-10 rounded-xl shadow-sm border space-y-8">
            <Section title="1. Acceptance of Terms">
              By accessing and using {APP_NAME} (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. Currently, the Service operates in a guest-only mode where data is stored in your browser's local storage. Your use of this Service constitutes acceptance of this agreement. If you do not agree to abide by these terms, please do not use this Service.
            </Section>

            <Section title="2. Description of Service (Guest Mode)">
              {APP_NAME} is a task management tool. In its current guest-only mode, all data you create (tasks, columns, etc.) is stored locally in your web browser's `localStorage`. The Service is provided "as is," and {APP_NAME} (and its creators) assume no responsibility for the timeliness, deletion, mis-delivery, or failure to store any user data due to browser issues, manual clearing of local storage by the user, device failure, or other factors outside of the application's direct control. You are solely responsible for managing and backing up your browser data if desired.
            </Section>

            <Section title="3. User Data in Guest Mode">
              No user accounts are created in the traditional sense. A unique anonymous Guest ID is generated and stored locally to associate your task data within your browser. This data is not accessible if you use a different browser, device, clear your local storage, or use incognito/private browsing modes. You acknowledge that data stored in `localStorage` is subject to browser limitations and actions.
            </Section>

            <Section title="4. User Conduct">
              You agree not to use the Service to create or store content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically, or otherwise objectionable. You are responsible for all content you input into the Service.
            </Section>

            <Section title="5. Intellectual Property">
              The Service and its original content (excluding user-generated task data), features, and functionality are and will remain the exclusive property of {APP_NAME}'s creators and its licensors. The {APP_NAME} name and logo are trademarks of their respective owners.
            </Section>
            
            <Section title="6. AI Features">
              The Service offers AI-powered features. Your use of these features involves sending relevant task data (like title and description) to an AI service provider. The AI provider processes this data according to its own terms and policies. {APP_NAME} makes no warranties regarding the accuracy, completeness, or suitability of AI-generated content. You are solely responsible for how you use such content.
            </Section>

            <Section title="7. Disclaimer of Warranties">
              The Service is provided on an "as is" and "as available" basis. {APP_NAME} and its creators expressly disclaim all warranties of any kind, whether express or implied, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We make no warranty that the Service will be error-free, secure, or that access thereto will be continuous or uninterrupted. You use the Service at your own discretion and risk.
            </Section>

            <Section title="8. Limitation of Liability">
              In no event shall {APP_NAME} or its creators be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to, damages for loss of profits, goodwill, use, data, or other intangible losses (even if {APP_NAME} has been advised of the possibility of such damages), resulting from the use or the inability to use the Service, especially concerning data loss from `localStorage` in guest mode. Your sole remedy for dissatisfaction with the Service is to stop using the Service.
            </Section>

            <Section title="9. Changes to Terms">
              {APP_NAME} reserves the right, at its sole discretion, to modify or replace these Terms at any time. We will endeavor to provide notice of material changes on this page or through the Service. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
            </Section>

            <Section title="10. Governing Law">
             These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which the creators of {APP_NAME} reside, without regard to its conflict of law provisions. (For a real app, the specific jurisdiction would be stated here).
            </Section>
            
            <Section title="11. Future Functionality (Registered Accounts)">
             These terms primarily cover the current guest-only mode. If registered user accounts are introduced, these Terms of Service will be updated, and additional terms may apply to account holders.
            </Section>
            
            <div className="text-sm text-muted-foreground pt-6 border-t border-dashed">
              <p>If you have any questions about these Terms, please use the "Request a Feature" page to contact us (as this is a demo project, a real contact method would be provided here for a production app).</p>
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
