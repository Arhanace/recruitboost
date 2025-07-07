import { Button } from "@/components/ui/button";
import { GoogleIcon, AppleIcon } from "./auth-icons";
import { cn } from "@/lib/utils";

interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: "google" | "apple";
  onClick: () => void;
}

export function SocialButton({ provider, onClick, className, ...props }: SocialButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("flex items-center justify-center gap-2 w-full", className)}
      onClick={onClick}
      {...props}
    >
      {provider === "google" ? <GoogleIcon className="h-5 w-5" /> : <AppleIcon className="h-5 w-5" />}
      Sign in with {provider === "google" ? "Google" : "Apple"}
    </Button>
  );
}