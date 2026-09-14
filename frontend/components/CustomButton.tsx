import React from "react";

type Variant = "primary" | "secondary" | "ghost";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const baseStyle =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-white text-gray-900 hover:bg-purple-400 active:bg-purple-700",
  secondary: "bg-purple-500/60 text-white hover:bg-purple-600 ",
  ghost:
    "bg-transparent text-gray-400 hover:text-purple-400 hover:bg-purple-500/10",
};

export const CustomButton: React.FC<CustomButtonProps> = ({
  variant = "secondary",
  icon,
  children,
  className,
  ...props
}) => {
  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
