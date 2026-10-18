import "server-only";

/**
 * Booking lifecycle helpers used outside the scheduling feature.
 * OWNER: scheduling feature.
 */

/** Called by payments.fulfillOrder when a paid meeting's checkout completes. Confirms + emails. Idempotent. */
export async function confirmPaidBooking(bookingId: string): Promise<void> {
  void bookingId;
  throw new Error("confirmPaidBooking not implemented yet");
}

/** Called by the cron job: sends reminder emails for upcoming confirmed bookings. Returns how many were sent. */
export async function sendDueBookingReminders(): Promise<number> {
  return 0;
}

/** Called by the cron job: cancels unpaid pending_payment bookings whose hold expired. Returns how many were released. */
export async function releaseExpiredHolds(): Promise<number> {
  return 0;
}
