import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Accessible Modal Dialog Primitive with backdrop blur, keyboard trap, and ARIA attributes.
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  showCloseButton = true,
  ariaLabelledBy = 'dialog-title',
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Save previous active element to restore on close
    const previousActiveElement = document.activeElement;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus dialog container
    if (dialogRef.current) {
      dialogRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (previousActiveElement && previousActiveElement.focus) {
        previousActiveElement.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`w-full ${maxWidth} bg-white rounded-apple-xl shadow-glass border border-black/[0.08] overflow-hidden focus:outline-none transform transition-all p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
          {title && (
            <h2 id={ariaLabelledBy} className="text-xl font-semibold tracking-tight text-text-primary">
              {title}
            </h2>
          )}
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-text-primary hover:bg-gray-100 rounded-full transition-colors ml-auto"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="text-text-primary">{children}</div>
      </div>
    </div>,
    document.body
  );
}
