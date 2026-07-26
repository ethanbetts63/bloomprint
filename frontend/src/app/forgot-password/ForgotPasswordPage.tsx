// frontend/src/pages/ForgotPasswordPage.tsx

"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from "sonner";
import { requestPasswordReset } from '@/api';
import { errorMessage } from '@/lib/errors';

type EmailFormData = {
  email: string;
};

const ForgotPasswordPage = () => {
  const form = useForm<EmailFormData>({
    defaultValues: {
      email: '',
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = form;

  const onSubmit: SubmitHandler<EmailFormData> = async (data) => {
    try {
      const response = await requestPasswordReset(data.email);
      toast.info(response.detail); // Show the generic message from the backend
      reset();
    } catch (err) {
      toast.error(errorMessage(err) || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="bg-[var(--surface-beige)] flex flex-grow min-h-full flex-col items-center justify-center p-6 md:p-10">
      <div className="flex flex-col gap-6 w-full max-w-sm md:max-w-md">
        <Card className="overflow-hidden p-0 bg-white text-black shadow-md border-none">
          <CardContent className="p-0">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Forgot Your Password?</h1>
                    <p className="text-muted-foreground text-balance text-sm">
                      Enter your email and we'll send you a reset link.
                    </p>
                  </div>

                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        disabled={isSubmitting}
                        {...register('email', { required: 'Email address is required' })}
                      />
                    </FormControl>
                    <FormMessage>{errors.email?.message}</FormMessage>
                  </FormItem>

                  <Button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-black px-5 py-4 font-semibold text-white transition hover:bg-black/85 disabled:cursor-wait disabled:opacity-70">
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <Spinner className="mr-2 h-4 w-4 text-current" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>

                  <div className="text-center text-sm text-black">
                    Remember your password?{" "}
                    <Link href="/login" className="underline underline-offset-2 hover:underline hover:text-primary">
                      Back to login
                    </Link>
                  </div>

                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );};

export default ForgotPasswordPage;
