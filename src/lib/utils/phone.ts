/**
 * Normalizes Nigerian phone numbers to a standard +234 format.
 * Examples:
 * 08012345678 -> +2348012345678
 * +2348012345678 -> +2348012345678
 * 8012345678 -> +2348012345678
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.trim().replace(/\s+/g, "");

  // If already in +234 format, return it
  if (cleaned.startsWith("+234")) {
    return cleaned;
  }

  // If starts with 0, replace with +234
  if (cleaned.startsWith("0")) {
    return "+234" + cleaned.substring(1);
  }

  // If starts with 234 but no +, add +
  if (cleaned.startsWith("234")) {
    return "+" + cleaned;
  }

  // If 10 digits (e.g. 8012345678), add +234
  if (cleaned.length === 10) {
    return "+234" + cleaned;
  }

  return cleaned;
}
