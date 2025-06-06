
"use client";

import { Header } from "@/components/layout/header";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";
import { useEffect } from "react";

// export const metadata: Metadata = {
//   title: `Terms of Service | ${APP_NAME}`,
//   description: `Terms of Service for ${APP_NAME}.`,
// };

export default function TermsOfServicePage() {
  useEffect(() => {
    document.title = `Terms of Service | ${APP_NAME}`;
  }, []);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-card text-card-foreground p-6 sm:p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-primary border-b pb-3">Terms of Service</h1>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using {APP_NAME} (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this Service, you shall be subject to any posted guidelines or rules applicable to such services. Any participation in this Service will constitute acceptance of this agreement. If you do not agree to abide by the above, please do not use this Service.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              {APP_NAME} is a task management tool designed to help users organize and manage their tasks and projects. The Service is provided "as is" and {APP_NAME} assumes no responsibility for the timeliness, deletion, mis-delivery, or failure to store any user communications or personalization settings.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. You agree to notify {APP_NAME} immediately of any unauthorized use of your account or any other breach of security.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              The "Continue as Guest" feature allows temporary use of the Service with data stored in your browser's local storage. This data is not backed up by {APP_NAME} and may be lost if you clear your browser data or switch devices.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">4. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground leading-relaxed mt-2 space-y-1 pl-4">
              <li>Upload, post, email, transmit, or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically, or otherwise objectionable;</li>
              <li>Harm minors in any way;</li>
              <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity;</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content, features, and functionality are and will remain the exclusive property of {APP_NAME} and its licensors.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">6. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided "as is". {APP_NAME} and its suppliers and licensors hereby disclaim all warranties of any kind, express or implied, including, without limitation, the warranties of merchantability, fitness for a particular purpose and non-infringement. Neither {APP_NAME} nor its suppliers and licensors, makes any warranty that the Service will be error free or that access thereto will be continuous or uninterrupted.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event will {APP_NAME}, or its suppliers or licensors, be liable with respect to any subject matter of this agreement under any contract, negligence, strict liability or other legal or equitable theory for: (i) any special, incidental or consequential damages; (ii) the cost of procurement for substitute products or services; (iii. for interruption of use or loss or corruption of data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              {APP_NAME} reserves the right, at its sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              These terms were last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
