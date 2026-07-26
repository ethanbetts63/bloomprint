"use client"

import { useForm } from "react-hook-form";
import Link from "next/link";
import { cn } from "@/lib/utils"
import { Button } from "@/shared_components/ui/button"
import { Card, CardContent } from "@/shared_components/ui/card"
import { Input } from "@/shared_components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared_components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Spinner } from "@/shared_components/ui/spinner";

type LoginFormData = {
  email: string;
  password: string;
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { loginWithPassword } = useAuth();

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginWithPassword(data.email, data.password);
      // LoginPage redirects to the right dashboard once the profile (and its
      // role) loads, so we don't route here.
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Login Failed", {
        description: "Please check your email and password and try again.",
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 ", className)} {...props}>
      <Card className="overflow-hidden p-0 bg-white text-black shadow-md border-none">
        <CardContent className="p-0">

          <div className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Partner and staff access</h1>
                  <p className="text-muted-foreground text-balance text-sm">
                    Sign in to your FutureFlower business account
                  </p>
                </div>

                <FormField control={form.control} name="email" rules={{ required: 'Email is required' }} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        autoComplete="username"
                        placeholder="m@example.com"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" rules={{ required: 'Password is required' }} render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="ml-auto text-sm underline-offset-2 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="current-password"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full rounded-lg bg-black px-5 py-4 font-semibold text-white transition hover:bg-black/85 disabled:cursor-wait disabled:opacity-70" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <Spinner className="mr-2 h-4 w-4 text-current" />
                      <span>Logging In...</span>
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>

              </form>
            </Form>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
