import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            cardBox: "shadow-none border-0",
            card: "shadow-none border border-neutral-200 rounded-xl bg-white",
            headerTitle: "text-xl font-semibold text-neutral-900",
            headerSubtitle: "text-sm text-neutral-500",
            socialButtonsBlockButton: "border-neutral-200 hover:bg-neutral-50 text-neutral-700",
            formFieldLabel: "text-sm font-medium text-neutral-700",
            formFieldInput: "border-neutral-200 focus:border-neutral-400 focus:ring-neutral-400/20 rounded-lg",
            formButtonPrimary: "bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg",
            footerActionLink: "text-neutral-900 hover:text-neutral-700 font-medium",
            dividerLine: "bg-neutral-200",
            dividerText: "text-neutral-400 text-xs",
            footer: "hidden",
          },
        }}
      />
    </div>
  );
}
