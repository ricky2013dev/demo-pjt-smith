import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

/** Each variant is announced by its own icon, so the message reads at a glance. */
const VARIANT_ICON = {
  default: "info",
  success: "check_circle",
  error: "error",
} as const;

const VARIANT_ICON_COLOR = {
  default: "text-slate-400 dark:text-slate-500",
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
} as const;

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <span
                className={`material-symbols-outlined shrink-0 ${VARIANT_ICON_COLOR[variant]}`}
                // index.css sizes .material-symbols-outlined after Tailwind's
                // utilities, so only an inline size sticks
                style={{ fontSize: "20px" }}
              >
                {VARIANT_ICON[variant]}
              </span>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
