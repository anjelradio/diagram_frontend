"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type AppAlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  cancelText?: string;
  actionText?: string;
  onAction: () => void;
  actionDisabled?: boolean;
};

export function AppAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelText = "Cancelar",
  actionText = "Confirmar",
  onAction,
  actionDisabled = false,
}: AppAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl bg-popover text-popover-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-foreground">
            {title}
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex w-full flex-col gap-3 sm:flex-row-reverse sm:justify-end sm:space-x-0">
          <AlertDialogAction
            className="w-full sm:w-auto"
            disabled={actionDisabled}
            onClick={onAction}
          >
            {actionText}
          </AlertDialogAction>
          <AlertDialogCancel
            variant="secondary"
            className="mt-0 w-full sm:mt-0 sm:w-auto"
          >
            {cancelText}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
