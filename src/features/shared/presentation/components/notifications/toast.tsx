import { sileo } from "sileo";
import { CircleCheck, CircleX, CircleAlert, TriangleAlert } from "lucide-react";

const DEFAULT_ERROR_MESSAGE = "Ocurrió un error inesperado";
const DEFAULT_ERROR_TITLE = "Error";

type ErrorToastOptions = {
  title?: string;
};

export function showErrorList(
  messages?: string[],
  options?: ErrorToastOptions,
) {
  const renderErrorToast = (message: string) => {
    sileo.error({
      title: options?.title ?? DEFAULT_ERROR_TITLE,
      description: message,
      icon: <CircleX className="text-destructive size-5" />,
    });
  };

  if (!messages || messages.length === 0) {
    renderErrorToast(DEFAULT_ERROR_MESSAGE);
    return;
  }

  const uniqueMessages = [...new Set(messages.filter(Boolean))];
  uniqueMessages.forEach((message) => renderErrorToast(message));
}

export const appToast = {
  success: (message: string) =>
    sileo.success({
      title: message,
      icon: <CircleCheck className="text-emerald-500 size-5" />,
    }),
  error: (title: string, message: string) =>
    sileo.error({
      title: title,
      description: message,
      icon: <CircleX className="text-destructive size-5" />,
    }),
  info: (message: string) =>
    sileo.info({
      title: message,
      icon: <CircleAlert className="text-blue-500 size-5" />,
    }),
  warning: (message: string) =>
    sileo.warning({
      title: message,
      icon: <TriangleAlert className="text-amber-500 size-5" />,
    }),
};
