import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Format Turkish phone number
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.replace(
      /(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})/,
      "$1 $2 $3 $4 $5"
    );
  }

  return phone;
}

export function validateTCKN(tckn: string): boolean {
  if (!/^\d{11}$/.test(tckn)) {
    return false;
  }

  const digits = tckn.split("").map(Number);

  // Check if all digits are the same
  if (digits.every((digit) => digit === digits[0])) {
    return false;
  }

  // Calculate checksum
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];

  const check1 = (sum1 * 7 - sum2) % 10;
  const check2 = (sum1 + sum2 + digits[9]) % 10;

  return check1 === digits[9] && check2 === digits[10];
}

export function validateVKN(vkn: string): boolean {
  if (!/^\d{10}$/.test(vkn)) {
    return false;
  }

  const digits = vkn.split("").map(Number);

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const temp = (digits[i] + (9 - i)) % 10;
    sum += (temp * Math.pow(2, 9 - i)) % 9;
    if (temp !== 0 && sum >= 9) {
      sum -= 9;
    }
  }

  const check = (10 - sum) % 10;
  return check === digits[9];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
