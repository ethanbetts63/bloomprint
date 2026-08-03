export const ORDER_FORM_ID = 'start-order';
export const ORDER_FORM_HIGHLIGHT_EVENT = 'bloomprint:highlight-order-form';

/** How long the brief form stays highlighted after the nav "Order" button is clicked. */
export const ORDER_FORM_HIGHLIGHT_MS = 900;

/**
 * Scrolls the hero brief form into view and flashes it.
 *
 * The flash — not the scroll — is what makes the nav "Order" button feel alive.
 * On desktop the form already sits in the hero's right-hand column, so a user at
 * the top of the page has nowhere to scroll and the button would otherwise appear
 * dead. A plain `#start-order` link has the same problem: browsers skip re-scrolling
 * when the hash already matches.
 *
 * Returns false when the current page has no brief form, so callers can fall back
 * to navigating to the homepage instead.
 */
export const revealOrderForm = (): boolean => {
  const target = document.getElementById(ORDER_FORM_ID);
  if (!target) return false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  window.dispatchEvent(new Event(ORDER_FORM_HIGHLIGHT_EVENT));
  return true;
};
