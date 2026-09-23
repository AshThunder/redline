import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/format";

const button = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,color,border-color,transform] duration-150 ease-out-expo active:translate-y-px disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover",
        ai: "bg-accent text-on-accent hover:bg-accent-hover",
        secondary: "border border-hairline-strong bg-surface-1 text-ink hover:bg-surface-2",
        tertiary: "text-ink-subtle hover:bg-surface-2 hover:text-ink",
        danger: "border border-loss/30 bg-loss-subtle text-loss hover:border-loss/60",
      },
      size: {
        sm: "h-7 px-2.5 text-caption",
        md: "h-9 px-3.5 text-body-sm",
        lg: "h-10 px-4 text-body-sm",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

type Props = React.ComponentProps<"button"> & VariantProps<typeof button> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(button({ variant, size }), className)} {...props} />;
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn("num inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-hairline bg-surface-2 px-1 text-[11px] text-ink-subtle", className)}>
      {children}
    </kbd>
  );
}
