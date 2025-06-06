
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer"; // Added Footer import
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";
import { useEffect } from "react";

// export const metadata: Metadata = {
//   title: `Privacy Policy | ${APP_NAME}`,
//   description: `Privacy Policy for ${APP_NAME}.`,
// };

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = `Privacy Policy | ${APP_NAME}`;
  }, []);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow">
        <div className="max-w-3xl mx-auto bg-card text-card-foreground p-6 sm:p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-primary border-b pb-3">Privacy Policy</h1>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to {APP_NAME}! We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              As a user of {APP_NAME}, we may collect the following types of information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground leading-relaxed mt-2 space-y-1 pl-4">
              <li><strong>Account Information:</strong> If you register for an account, we collect your email address and password. You may optionally provide a display name and profile picture.</li>
              <li><strong>Task Data:</strong> We store the tasks, descriptions, due dates, priorities, tags, subtasks, and any other related data you create within the application.</li>
              <li><strong>Guest Data:</strong> If you use the "Continue as Guest" feature, your task data is stored locally in your browser's localStorage and is not transmitted to our servers. Your Guest ID is also stored locally.</li>
              <li><strong>Usage Data:</strong> We may collect information about how you use our application, such as features accessed and time spent on the app, to improve our services. This data is typically anonymized or aggregated.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect in various ways, including to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground leading-relaxed mt-2 space-y-1 pl-4">
              <li>Provide, operate, and maintain our application.</li>
              <li>Improve, personalize, and expand our application.</li>
              <li>Understand and analyze how you use our application.</li>
              <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the application, and for marketing and promotional purposes (with your consent).</li>
              <li>Process your transactions (if applicable).</li>
              <li>Find and prevent fraud.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Registered Users:</strong> Your data (account information and task data) is stored on secure Firebase servers (Firestore, Firebase Authentication, Firebase Storage for profile pictures). We implement a variety of security measures to maintain the safety of your personal information.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>Guest Users:</strong> Your task data and Guest ID are stored locally in your browser's localStorage. This data is not sent to our servers and is only accessible through your browser. Clearing your browser data will remove this information.
            </p>
          </section>
          
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Sharing Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential. We may also release information when it's release is appropriate to comply with the law, enforce our site policies, or protect ours or others' rights, property or safety.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Your Data Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. Please contact us to make such requests.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page. You are advised to review this privacy policy periodically for any changes.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              This policy was last updated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
