
import { APP_NAME, DEVELOPER_NAME, DEVELOPER_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t mt-auto">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          I have built this tool with help from Firebase Studio, powered by Gemini. &copy; {new Date().getFullYear()} {APP_NAME}.
          Developed by <a href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">{DEVELOPER_NAME}</a>.
        </p>
      </div>
    </footer>
  );
}

