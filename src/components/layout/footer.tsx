
import { APP_NAME, DEVELOPER_NAME, DEVELOPER_URL } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {currentYear} {APP_NAME}. Developed by{" "}
          <a
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            {DEVELOPER_NAME}
          </a>
          .
        </p>
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-right">
          AI features powered by Gemini.
        </p>
      </div>
    </footer>
  );
}
