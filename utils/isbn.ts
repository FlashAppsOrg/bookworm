export function validateISBN13(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, '');

  if (cleaned.length !== 13 || !/^\d+$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleaned[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleaned[12]);
}

export function validateISBN10(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, '');

  if (cleaned.length !== 10) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    if (!/\d/.test(cleaned[i])) return false;
    sum += parseInt(cleaned[i]) * (10 - i);
  }

  const lastChar = cleaned[9];
  const checkDigit = lastChar === 'X' ? 10 : parseInt(lastChar);
  if (isNaN(checkDigit) && lastChar !== 'X') return false;

  sum += checkDigit;
  return sum % 11 === 0;
}

export function convertISBN10toISBN13(isbn10: string): string | null {
  const cleaned = isbn10.replace(/[-\s]/g, '');

  if (cleaned.length !== 10 || !validateISBN10(cleaned)) {
    return null;
  }

  const base = '978' + cleaned.substring(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return base + checkDigit;
}

export function normalizeISBN(isbn: string): string | null {
  if (!isbn) return null;

  const cleaned = isbn.replace(/[-\s]/g, '');

  if (cleaned.length === 13 && validateISBN13(cleaned)) {
    return cleaned;
  }

  if (cleaned.length === 10) {
    return convertISBN10toISBN13(cleaned);
  }

  return null;
}

export function extractISBNFromBarcode(barcode: string): string | null {
  const cleaned = barcode.replace(/[-\s]/g, '');

  if (cleaned.startsWith('978') || cleaned.startsWith('979')) {
    if (cleaned.length === 13 && validateISBN13(cleaned)) {
      return cleaned;
    }
  }

  if (cleaned.length === 10 && validateISBN10(cleaned)) {
    return cleaned;
  }

  if (cleaned.length === 12 && /^\d+$/.test(cleaned)) {
    const isbn13 = '978' + cleaned.substring(0, 9);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn13[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const fullISBN = isbn13 + checkDigit;

    if (validateISBN13(fullISBN)) {
      return fullISBN;
    }
  }

  return null;
}