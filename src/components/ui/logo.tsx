
import { School } from "lucide-react";

interface LogoProps {
  variant?: "default" | "white";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ variant = "default", size = "md", showText = true }: LogoProps) => {
  const logoSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`relative ${size === "sm" ? "h-6 w-6" : size === "md" ? "h-8 w-8" : "h-10 w-10"}`}>
        <div className="absolute inset-0">
          <img
            src="/lovable-uploads/d8777bf8-0a61-4111-b539-e4dfaa925140.png"
            alt="ScriptSense Logo"
            className="object-contain w-full h-full"
          />
        </div>
      </div>
      
      {showText && (
        <span 
          className={`font-bold ${textSizes[size]} ${
            variant === "white" ? "text-white" : "text-scriptsense-primary"
          }`}
        >
          scriptSense
        </span>
      )}
    </div>
  );
};
