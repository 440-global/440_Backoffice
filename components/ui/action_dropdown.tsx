"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { RiMore2Fill } from "react-icons/ri";
import { cn } from "./utils";

type ActionItem = {
  label?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  primary?: boolean;
};

type Props = {
  actions: ActionItem[];
  position?: (rect: DOMRect) => React.CSSProperties;
  offset?: number;
  children?: React.ReactNode;
};

const VIEWPORT_MARGIN = 8;
const MIN_HEIGHT = 120;

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), Math.max(min, max));

const ActionDropdown = ({ actions, position, offset = 6, children }: Props) => {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setStyle(null);
  }, []);

  const toggle = () => {
    if (open) return close();
    setOpen(true);
  };

  // Measure the real menu, then place it (runs before paint, so no flicker)
  useLayoutEffect(() => {
    if (!open || !buttonRef.current || !dropdownRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    // Custom positioning still wins
    if (position) {
      setStyle({ position: "fixed", ...position(rect) });
      return;
    }

    const menu = dropdownRef.current;
    const width = menu.offsetWidth;
    const height = menu.scrollHeight; // natural height, ignores maxHeight

    const spaceBelow =
      window.innerHeight - rect.bottom - offset - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - offset - VIEWPORT_MARGIN;

    // Flip up only if it doesn't fit below AND there's more room above
    const openUp = height > spaceBelow && spaceAbove > spaceBelow;
    const available = Math.max(openUp ? spaceAbove : spaceBelow, MIN_HEIGHT);
    const finalHeight = Math.min(height, available);

    const top = openUp ? rect.top - offset - finalHeight : rect.bottom + offset;

    const left = clamp(
      rect.right - width, // right-align with the button
      VIEWPORT_MARGIN,
      window.innerWidth - width - VIEWPORT_MARGIN,
    );

    setStyle({
      position: "fixed",
      top: Math.max(VIEWPORT_MARGIN, top),
      left,
      maxHeight: available,
    });
  }, [open, position, offset, actions.length, children]);

  // Outside click + Escape + close on scroll/resize (fixed menu would detach from button)
  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !dropdownRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        close();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return; // scrolling inside menu
      close();
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true); // capture: catches table/container scroll
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-2 rounded-md hover:bg-(--muted) relative"
      >
        <RiMore2Fill />
      </button>

      {open &&
        createPortal(
          <ul
            ref={dropdownRef}
            role="menu"
            className={cn(
              "z-1000 overflow-y-auto bg-(--surface) border border-(--table-border) rounded-md shadow-lg p-1",
              children ? "min-w-52" : "min-w-40",
            )}
            // Hidden on the first pass so we can measure without a visible jump
            style={
              style ?? {
                position: "fixed",
                top: 0,
                left: 0,
                visibility: "hidden",
              }
            }
          >
            {actions.map((action, i) => (
              <li
                key={action.label ?? i}
                role="menuitem"
                onClick={() => {
                  action.onClick();
                  close();
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm",
                  "hover:bg-(--muted)",
                  action.danger && "text-red-600 hover:bg-red-50",
                  action.primary && "text-(--primary) hover:bg-(--primary)/20",
                )}
              >
                {action.icon}
                {action.label}
              </li>
            ))}
            {children && (
              <li className="mt-1 border-t border-(--table-border) pt-1">
                {children}
              </li>
            )}
          </ul>,
          document.body,
        )}
    </>
  );
};

export default ActionDropdown;