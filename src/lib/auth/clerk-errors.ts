export function getClerkErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors: { longMessage?: string; message?: string }[] }).errors;
    const first = errors?.[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isClerkAlreadySignedInError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes("already signed in");
  }
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors: { code?: string; message?: string }[] }).errors;
    return errors?.some(
      (entry) =>
        entry.code === "session_exists" ||
        entry.message?.toLowerCase().includes("already signed in"),
    ) ?? false;
  }
  return false;
}
