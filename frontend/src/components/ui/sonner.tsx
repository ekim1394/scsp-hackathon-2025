import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--toast-width": "400px",
          "--toast-min-height": "64px",
          "--toast-font-size": "1.125rem",
          "--toast-padding": "1.25rem 1.5rem",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
