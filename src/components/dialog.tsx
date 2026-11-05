"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icons";
export function Dialog({
  title,
  onClose,
  children,
  wide = false,
  className = "",
  overlay,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  className?: string;
  overlay?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement;
    const dialog = ref.current;
    const viewport = window.visualViewport;
    const resize = () => {
      dialog?.style.setProperty(
        "--dialog-viewport-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
      dialog?.style.setProperty(
        "--dialog-viewport-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
      dialog?.style.setProperty(
        "--dialog-effect-height", `${dialog.clientHeight}px`,
      );
    };
    dialog?.showModal();
    resize();
    const observer = new ResizeObserver(resize);
    if (dialog) observer.observe(dialog);
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      observer.disconnect();
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
      document.body.style.overflow = previousOverflow;
      returnFocus.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? "dialog-wide" : ""} ${className}`}
      aria-label={title}
      onScroll={(event) => {
        event.currentTarget.style.setProperty(
          "--dialog-scroll-top", `${event.currentTarget.scrollTop}px`,
        );
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          event.clientX !== 0 &&
          event.clientY !== 0
        ) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-header">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Lukk dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
      {overlay && <div className="dialog-effects">{overlay}</div>}
    </dialog>
  );
}
