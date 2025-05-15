import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/80 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:animate-glow group-[.toaster]:relative group-[.toaster]:overflow-hidden",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary/90 group-[.toast]:text-primary-foreground group-[.toast]:backdrop-blur-sm group-[.toast]:hover:bg-primary/80 group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-muted/90 group-[.toast]:text-muted-foreground group-[.toast]:backdrop-blur-sm group-[.toast]:hover:bg-muted/80 group-[.toast]:transition-colors",
          title: "group-[.toast]:font-medium group-[.toast]:text-base",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
