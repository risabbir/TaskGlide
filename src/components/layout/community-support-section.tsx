import Link from 'next/link';
import { Github } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GITHUB_URL, APP_NAME } from '@/lib/constants';

export function CommunitySupportSection() {
  return (
    <Alert variant="default" className="bg-accent/50 border-accent text-accent-foreground mt-8">
      <Github className="h-5 w-5 !text-primary mt-0.5" />
      <AlertTitle className="font-semibold text-foreground">Community & Support</AlertTitle>
      <AlertDescription className="text-accent-foreground/90">
        For technical issues or bug reports, please head over to our{' '}
        <Link href={GITHUB_URL} legacyBehavior>
          <a target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline">
            GitHub repository
          </a>
        </Link>
        . If you enjoy using {APP_NAME}, consider giving it a star—it helps a lot! ⭐
      </AlertDescription>
    </Alert>
  );
}
