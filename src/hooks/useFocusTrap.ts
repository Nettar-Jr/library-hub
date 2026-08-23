import { useEffect, useRef } from 'react';

/**
 * Custom React hook to trap keyboard focus within an active modal container
 * and handle the Escape key to close the overlay.
 * Meets WCAG 2.1 - 2.4.3 (Focus Order) & 2.1.2 (No Keyboard Trap escaping boundaries).
 */
export function useFocusTrap(isActive: boolean, onEscape?: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store previous focused element before modal opened
    if (document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Find all focusable elements within the modal
    const focusableSelector = 
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return [];
      const nodes = container.querySelectorAll(focusableSelector);
      const elements: HTMLElement[] = [];
      nodes.forEach((node) => {
        if (node instanceof HTMLElement && !node.hasAttribute('disabled') && node.offsetParent !== null) {
          elements.push(node);
        }
      });
      return elements;
    };

    // Auto-focus the first element in the modal
    const initialElements = getFocusableElements();
    if (initialElements.length > 0) {
      initialElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: if on first element, wrap to last element
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, wrap to first element
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to original element when modal unmounts
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, onEscape]);

  return containerRef;
}
