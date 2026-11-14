/**
 * Formats integer poisha into human-readable currency (e.g. 1000000 -> "৳ 10,000" or "BDT 10,000.00").
 * Avoids floating-point arithmetic on totals by splitting integer quotient and remainder.
 */
export function formatPoisha(poisha: number | string | undefined | null, currency = 'BDT'): string {
  if (poisha === undefined || poisha === null) return currency === 'BDT' ? '৳ 0' : `${currency} 0`;
  const numeric = typeof poisha === 'string' ? Number(poisha) : poisha;
  if (!Number.isFinite(numeric)) return currency === 'BDT' ? '৳ 0' : `${currency} 0`;
  const val = Math.trunc(numeric);
  const sign = val < 0 ? '-' : '';
  const abs = Math.abs(val);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const formattedWhole = new Intl.NumberFormat('en-IN').format(whole);
  const prefix = currency === 'BDT' ? '৳' : `${currency}`;
  if (frac === 0) {
    return `${sign}${prefix} ${formattedWhole}`;
  }
  return `${sign}${prefix} ${formattedWhole}.${String(frac).padStart(2, '0')}`;
}

export function formatLocalDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'TBD';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return 'TBD';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateTimeInTz(
  dateInput: string | Date | null | undefined,
  timezone = 'Asia/Dhaka',
): string {
  if (!dateInput) return 'TBD';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return 'TBD';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
