import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 font-serif">Create an account</h1>
          <p className="mt-1 text-sm text-neutral-500">Get started with your workspace</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "shadow-none border border-neutral-200 rounded-lg",
              card: "shadow-none",
            },
          }}
        />
      </div>
    </div>
  );
}
