
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Role } from '@/types/auth.types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const signUpFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  schoolName: z.string().min(2, {
    message: "School name must be at least 2 characters.",
  }).optional(),
  schoolAddress: z.string().optional(),
});

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

const SignUpPage = () => {
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      schoolName: "",
      schoolAddress: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setError(null);
    
    try {
      // Only allow admin registration on this page
      if (selectedRole !== 'admin') {
        setError("Only administrators can register directly. Teachers are added by school administrators.");
        return;
      }

      // Validate required fields for admin
      if (!data.schoolName) {
        setError("School name is required for administrator sign up.");
        return;
      }
      
      // Create schoolInfo object for admin role
      const schoolInfo = {
        name: data.schoolName,
        address: data.schoolAddress
      };
      
      console.log("Signing up admin:", {
        email: data.email,
        role: selectedRole,
        name: data.name,
        schoolInfo
      });
      
      const { user } = await signUp(data.email, data.password, selectedRole, data.name, schoolInfo);
      
      if (user) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during sign up');
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>
            Create your administrator account to get started with Stylus
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="admin" onValueChange={(value) => setSelectedRole(value as Role)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="admin">Administrator</TabsTrigger>
              <TabsTrigger value="teacher" disabled title="Teachers are added by administrators">Teacher</TabsTrigger>
            </TabsList>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter school name" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="schoolAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Address (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter school address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing up..." : "Sign up"}
                </Button>
              </form>
            </Form>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpPage;
