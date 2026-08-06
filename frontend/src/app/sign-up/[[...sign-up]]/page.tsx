import { SignUp } from "@clerk/nextjs";
export default function SignUpPage(){
  return(
    <main className="flex min-h-[calc(100vh-4rem)] item-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
        </div>
        <div className="rounded-2xl border border-b/70 bg-card p-6 backdrop-blur-sm">
           <SignUp routing="path" path="/sign-up" signUpUrl="/sign-in" fallbackRedirectUrl="/"/>
        </div>
      </div>
    </main>
  )
}
