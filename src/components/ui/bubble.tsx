import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const bubbleVariants = cva(
  "relative px-3.5 py-2 text-sm shadow-xs break-words max-w-full leading-relaxed transition-colors duration-200 rounded-2xl",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white",
        muted: "bg-zinc-800 text-zinc-100 border border-white/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Bubble({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof bubbleVariants>) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      className={cn(bubbleVariants({ variant, className }))}
      {...props}
    />
  )
}

function BubbleContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-content"
      className={cn("whitespace-pre-wrap", className)}
      {...props}
    />
  )
}

function BubbleGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}

function BubbleReactions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-reactions"
      className={cn("flex items-center gap-1 mt-1 text-xs select-none", className)}
      {...props}
    />
  )
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions, bubbleVariants }
