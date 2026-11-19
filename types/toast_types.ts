// Toast Types
export type ToastVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger";

export type ToastPlacement = "top-right" | "bottom-right";

export type ToastItem = {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
};