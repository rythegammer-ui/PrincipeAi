import "server-only";

/**
 * Course access helpers.
 * OWNER: courses & payments feature.
 */

/** Grants a student access to a course (creates the student user if needed) and emails a login link. Idempotent. */
export async function enrollInCourse(input: {
  email: string;
  name?: string | null;
  courseId: string;
  source: "purchase" | "manual";
  orderId?: string | null;
  /** Send the "you're in" email with a magic sign-in link (default true). */
  sendAccessEmail?: boolean;
}): Promise<void> {
  void input;
  throw new Error("enrollInCourse not implemented yet");
}
