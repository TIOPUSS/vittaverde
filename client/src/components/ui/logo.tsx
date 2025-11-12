import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <svg 
      width="40" 
      height="40" 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeClasses[size], className)}
      data-testid="logo"
    >
      {/* Leaf shape with heart center - inspired by the VittaVerde logo */}
      <path 
        d="M20 5L25 10L20 15L15 10L20 5Z" 
        fill="currentColor" 
        className="text-vitta-primary"
      />
      <path 
        d="M10 20L20 30L30 20L20 10L10 20Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
        className="text-vitta-primary"
      />
      <circle 
        cx="20" 
        cy="20" 
        r="2" 
        fill="currentColor"
        className="text-vitta-primary"
      />
      {/* Additional leaf elements for a more complete design */}
      <path 
        d="M12 12L20 20L28 12" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
        className="text-vitta-secondary opacity-60"
      />
      <path 
        d="M12 28L20 20L28 28" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
        className="text-vitta-secondary opacity-60"
      />
    </svg>
  );
}
