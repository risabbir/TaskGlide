
import Link from "next/link";
import { APP_NAME, DEVELOPER_NAME, DEVELOPER_URL } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t mt-auto bg-background text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">{APP_NAME}</h3>
            <p className="text-sm text-muted-foreground">
              Organize your life, one task at a time. {APP_NAME} helps you stay productive and focused.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Legal</h3>
            <nav className="space-y-2">
              <Link href="/privacy-policy" legacyBehavior>
                <a className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
              </Link>
              <br />
              <Link href="/terms-of-service" legacyBehavior>
                <a className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
              </Link>
            </nav>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Support & Community</h3>
            <nav className="space-y-2">
              <Link href="/faq" legacyBehavior>
                <a className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</a>
              </Link>
              <br />
              <Link href="/feature-request" legacyBehavior>
                <a className="text-sm text-muted-foreground hover:text-primary transition-colors">Request a Feature</a>
              </Link>
            </nav>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="text-center text-sm text-muted-foreground">
          <p>
            &copy; {currentYear} {APP_NAME}. All Rights Reserved.
          </p>
          <p className="mt-1">
            Built by <a href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{DEVELOPER_NAME}</a> in Firebase Studio, with AI assistance from Gemini.
          </p>
        </div>
      </div>
    </footer>
  );
}
