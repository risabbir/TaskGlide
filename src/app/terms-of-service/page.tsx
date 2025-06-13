
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import { FileText, BookOpen } from "lucide-react";
import type { Metadata } from 'next';


// export const metadata: Metadata = { // Uncomment if converting to Server Component
//   title: `Terms of Service | ${APP_NAME}`,
//   description: `Read the Terms of Service for using ${APP_NAME}.`,
// };


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
            <BookOpen className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Please read these terms carefully. Last updated: {lastUpdatedDate}.
            </p>
          </div>

          <div className="bg-card text-card-foreground p-6 sm:p-10 rounded-xl shadow-xl border space-y-8">
            <Section title="1. Acceptance of Terms">
              By accessing and using {APP_NAME} (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this Service, you shall be subject to any posted guidelines or rules applicable to such services, including our Privacy Policy. Any participation in this Service will constitute acceptance of this agreement. If you do not agree to abide by these terms, please do not use this Service.
            </Section>

            <Section title="2. Description of Service">
              {APP_NAME} is a task management tool designed to help users organize and manage their tasks and projects. The Service includes features such as task creation, Kanban boards, AI-powered suggestions, and data storage (either locally for guest users or via Firebase for registered users). The Service is provided "as is," and {APP_NAME} (and its creators) assume no responsibility for the timeliness, deletion, mis-delivery, or failure to store any user communications or personalization settings. You are responsible for ensuring your Firebase project (if used for registered user data) is correctly configured and secured.
            </Section>

            <Section title="3. User Accounts">
              To access certain features of the Service (e.g., cloud data storage), you may be required to create an account using Firebase Authentication. You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. You agree to notify {APP_NAME} (or manage your Firebase account security) immediately of any unauthorized use of your account or any other breach of security.
              The "Continue as Guest" feature allows use of the Service with data stored in your browser's local storage. This data is not backed up by {APP_NAME} and may be lost if you clear your browser data or switch devices.
            </Section>

            <Section title="4. User Conduct">
              You agree not to use the Service to:
              <ul className="list-disc list-outside space-y-2 pl-6 mt-3">
                <li>Upload, post, email, transmit, or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically, or otherwise objectionable;</li>
                <li>Harm minors in any way;</li>
                <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity;</li>
                <li>Upload or transmit any material that infringes any patent, trademark, trade secret, copyright, or other proprietary rights of any party;</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service, or disobey any requirements, procedures, policies, or regulations of networks connected to the Service.</li>
              </ul>
            </Section>

            <Section title="5. Intellectual Property">
              The Service and its original content (excluding user-generated task data), features, and functionality are and will remain the exclusive property of {APP_NAME}'s creators and its licensors. The name "{APP_NAME}" and its associated logos are trademarks.
            </Section>
            
            <Section title="6. AI Features">
              The Service utilizes AI features powered by Genkit and Google AI. Your use of these features is subject to Google's terms and policies. While we strive to provide helpful AI suggestions, we make no warranties regarding their accuracy, completeness, or suitability for any particular purpose. You are solely responsible for how you use AI-generated content.
            </Section>

            <Section title="7. Disclaimer of Warranties">
              The Service is provided on an "as is" and "as available" basis. {APP_NAME} and its creators and licensors hereby disclaim all warranties of any kind, express or implied, including, without limitation, the warranties of merchantability, fitness for a particular purpose, and non-infringement. Neither {APP_NAME} nor its creators or licensors make any warranty that the Service will be error-free or that access thereto will be continuous or uninterrupted. You understand that you use the Service at your own discretion and risk.
            </Section>

            <Section title="8. Limitation of Liability">
              In no event will {APP_NAME} or its creators or licensors be liable with respect to any subject matter of this agreement under any contract, negligence, strict liability, or other legal or equitable theory for: (i) any special, incidental, or consequential damages; (ii) the cost of procurement for substitute products or services; (iii) for interruption of use or loss or corruption of data; or (iv) for any amounts that exceed the fees paid by you to {APP_NAME} under this agreement during the twelve (12) month period prior to the cause of action (if any). {APP_NAME} shall have no liability for any failure or delay due to matters beyond their reasonable control.
            </Section>

            <Section title="9. Changes to Terms">
              {APP_NAME} reserves the right, at its sole discretion, to modify or replace these Terms at any time. If a revision is material, we will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
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

