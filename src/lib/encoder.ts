/* Copyright 2020 The Rational Index Project Developers. See the LICENSE
file at the top-level directory of this distribution and at 
https://github.com/zandaleph/rational-index/blob/main/LICENSE */

// MAX_SAFE_INTEGER is 2^53 - 1
// Base64 encodes 6 bits at a time
// thus 48 bits is a fairly good place to be (8 characters each)

// oh wait, except!
// bitwise shifting operators only operate on 32 bit integers (sigh)
// so 30 bits is where we'll be (5 characters each)

/**
 * The maximum value that can be encoded with this scheme.
 */
export const MAX_ALLOWED_INTEGER = 1073741823; // 2^30 - 1

const MAPPING: readonly string[] = Array.from(
  '+-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
);

const REVERSE_MAPPING: Record<string, number> = MAPPING.reduce(
  (d: Record<string, number>, v, i) => {
    return { ...d, [v]: i };
  },
  {}
);

/**
 * Encodes a number as a string.
 *
 * Encoded values have the following properties:
 *
 * * Critically, Lexicographical comparison of encoded values matches
 *   numerical comparison of decoded values.
 *
 * * Encoded values are uri and filename safe without further encoding
 *   (This may change in a future release but it seemed cute for now).
 *
 * * The values are NOT Base64 encoded per any known RFC Schema.
 *
 * @param v - an integer in range [0, MAX_ALLOWED_INTEGER]
 * @returns Encoded value, or null if invalid
 */
export function encode(v: number): string | null {
  if (v < 0 || v > MAX_ALLOWED_INTEGER || Math.floor(v) !== v) {
    return null;
  }
  return [...Array(5).keys()]
    .map((_, i) => {
      const digit = (v >>> ((4 - i) * 6)) & 63;
      return MAPPING[digit];
    })
    .join('');
}

/**
 * Decodes a string to a number.
 *
 * @param s - a string encoded by [[encode]]
 * @returns Decoded value or null if invalid
 */
export function decode(s: string): number | null {
  if (s.length !== 5) {
    return null;
  }
  return Array.from(s).reduce<number | null>((a: number | null, c) => {
    const v = REVERSE_MAPPING[c];
    if (a == null || v == null) {
      return null;
    }
    return (a << 6) + REVERSE_MAPPING[c];
  }, 0);
}
