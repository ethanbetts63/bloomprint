

// src/pages/flow/BlocklistSuccessPage.tsx

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MailX } from 'lucide-react';

export default function Page() {
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader className="flex flex-col items-center text-center">
          <MailX className="h-16 w-16 text-red-500 mb-4" />
          <CardTitle className="text-2xl">You've Been Unsubscribed</CardTitle>
          <CardDescription className="pt-2">
            Your email address has been successfully added to our blocklist.
            You will not receive any further automated emails from Bloom Print.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            If this was a mistake, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
