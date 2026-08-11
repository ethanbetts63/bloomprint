/**
 * Global system constants that should match backend configuration.
 */
export const MIN_DAYS_BEFORE_CREATE = 3;
export const MIN_DAYS_BEFORE_EDIT = 7;
export const MIN_BUDGET = 65;

/**
 * The earliest delivery date the customer may pick, as a yyyy-mm-dd string.
 * Editing an existing order needs more lead time than creating one.
 */
export function minDeliveryDate(isEdit = false): string {
  const date = new Date();
  date.setDate(date.getDate() + (isEdit ? MIN_DAYS_BEFORE_EDIT : MIN_DAYS_BEFORE_CREATE));
  return date.toISOString().split('T')[0];
}
/**
 * Display only. The server computes the fee it charges (see DELIVERY_FEE and
 * DELIVERY_INCLUDED_THRESHOLD in settings.py) and returns it on the order as
 * `delivery_fee` — always price the checkout from that, never from these.
 */
export const DELIVERY_INCLUDED_THRESHOLD = 100;
export const DELIVERY_FEE = 18;

export const MS_PER_DAY = 86400000;
