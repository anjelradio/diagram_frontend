import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

interface MessageContextValue {
  align: "start" | "end"
}

const MessageContext = React.createContext<MessageContextValue>({
  align: "start",
})

const messageVariants = cva("group/message relative flex w-full gap-2 items-start", {
  variants: {
    align: {
      start: "flex-row justify-start",
      end: "flex-row-reverse justify-start",
    },
  },
  defaultVariants: {
    align: "start",
  },
})

function Message({
  className,
  align = "start",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof messageVariants>) {
  const currentAlign = align ?? "start"

  return (
    <MessageContext.Provider value={{ align: currentAlign }}>
      <div
        data-slot="message"
        data-align={currentAlign}
        className={cn(messageVariants({ align: currentAlign, className }))}
        {...props}
      >
        {children}
      </div>
    </MessageContext.Provider>
  )
}

function MessageAvatar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-avatar"
      className={cn("shrink-0 select-none self-start", className)}
      {...props}
    />
  )
}

function MessageContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { align } = React.useContext(MessageContext)

  return (
    <div
      data-slot="message-content"
      className={cn(
        "flex flex-col gap-1 max-w-[82%] min-w-0",
        align === "end" ? "items-end" : "items-start",
        className
      )}
      {...props}
    />
  )
}

function MessageFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { align } = React.useContext(MessageContext)

  return (
    <div
      data-slot="message-footer"
      className={cn(
        "text-[10px] text-zinc-400 mt-1 select-none",
        align === "end" ? "text-right self-end" : "text-left self-start",
        className
      )}
      {...props}
    />
  )
}

function Marker({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="marker"
      className={cn("flex w-full items-center justify-center py-2 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function MarkerContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="marker-content"
      className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-xs text-zinc-400", className)}
      {...props}
    />
  )
}

export {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  Marker,
  MarkerContent,
  messageVariants,
}
