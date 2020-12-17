/* Copyright 2020 The Rational Index Project Developers. See the LICENSE
file at the top-level directory of this distribution and at
https://github.com/zandaleph/rational-index/blob/main/LICENSE */

import bigInt, { BigInteger } from 'big-integer';

/**
 * Value representing no smaller indicies exist.
 */
export const LIST_HEAD = 1;

/**
 * Value representing no larger indicies exist.
 */
export const LIST_TAIL = 2;

/**
 * Represents the start of an insertion range.
 */
export type StartIndex = string | typeof LIST_HEAD;

/**
 * Represents the end of an insertion range.
 */
export type EndIndex = string | typeof LIST_TAIL;

/**
 * Represents the start or end of an insertion range.
 */
type Index = StartIndex | EndIndex;

/**
 * The default, pre-ordered Base64 Alphabet for indicies.
 *
 * This character set was chosen to be
 *
 * - distinct from any well known Base64 RFC alphabet
 * - usable in URIs without escaping.
 *
 * However, neither of these properties should be considered supported.
 */
export const DEFAULT_BASE64_ALPHABET =
  '-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Provides utilities for creating new indicies with a given alphabet.
 */
export class Inserter {
  /**
   * The allowed character set for this inserter.
   */
  private readonly alphabet: readonly string[];

  /**
   * A reverse lookup of `alphabet`, mapping letter to index.
   */
  private readonly lookup: Record<string, number>;

  /**
   * A shorthand for `alphabet.length`.
   */
  private readonly base: number;

  /**
   * A shorthand for `alphabet[0]`.
   */
  private readonly zero: string;

  /**
   * Most significant digit value under which we add an additional digit
   * of precision to our calculations.
   *
   * Right now this is computed as `Math.round(Math.sqrt(this.base))`, as it
   * seems to provide the right tradeoff of nearly-equally sized gaps between
   * points and shorter indicies.  However, this might change as our approach
   * changes, and should be considered an implementation detail.
   */
  private readonly cutoff: number;

  /**
   * Creates a new Inserter with the given alphabet
   *
   * @param {string} alphabet - the characters allowed in an index value.
   * @throws "Invalid Alphabet" - If the given alphabet has repeats.
   */
  constructor(alphabet = DEFAULT_BASE64_ALPHABET) {
    this.alphabet = Array.from(alphabet).sort();
    this.base = this.alphabet.length;
    this.zero = this.alphabet[0];
    this.lookup = this.alphabet.reduce((d: Record<string, number>, v, i) => {
      return { ...d, [v]: i };
    }, {});
    // If duplicate characters are provided in the input alphabet, throw
    if (Object.keys(this.lookup).length !== this.base) {
      throw 'Invalid Alphabet';
    }
    this.cutoff = Math.round(Math.sqrt(this.base));
  }

  /**
   * Converts an index value into an integer representation.
   *
   * @param {Index} index - the index to convert.
   * @param {number} length - the number of digits used for computation.
   * @returns {BigInteger} the value of the index as an integer.
   */
  private decode(index: Index, length: number): BigInteger {
    if (index === LIST_HEAD) {
      return bigInt();
    } else if (index === LIST_TAIL) {
      return bigInt(this.base).pow(length);
    } else {
      return bigInt.fromArray(
        Array.from(index.padEnd(length, this.zero)).map((l) => this.lookup[l]),
        this.base
      );
    }
  }

  /**
   * Converts a integer representation of an index back to a string.
   *
   * @param {BigInteger} value - The value of an index.
   * @param {number} length - The maximum encoded representation length.
   * @returns {string} An index string.
   */
  private encode(value: BigInteger, length: number): string {
    const s = value
      .toArray(this.base)
      .value.map((x) => this.alphabet[x])
      .join('')
      .padStart(length, this.zero);

    let index = s.length;
    for (; index > 0; --index) {
      if (s.charAt(index - 1) !== this.zero) break;
    }
    return s.substring(0, index);
  }

  /**
   * Creates `count` indicies roughly equally spaced between `start` and
   * `end`.
   *
   * An index is a lexicographically comparable string which represents a
   * position within an ordered list.
   *
   * @param {StartIndex} start - The next smallest index, or `LIST_HEAD`.
   * @param {EndIndex} end - The next largest index, or `LIST_TAIL`.
   * @param {number} count - The number of new indicies to create.
   * @returns {string[]} `count` ordered indicies between `start` and `end`.
   */
  insert(start: StartIndex, end: EndIndex, count = 1): readonly string[] {
    const start_len = start === LIST_HEAD ? 0 : start.length;
    const end_len = end === LIST_TAIL ? 0 : end.length;

    // If we are creating a lot of indicies, we will need more digits of
    // precision to avoid creating duplicate values.
    const workspace_len =
      Math.round(Math.log(count + 1) / Math.log(this.base)) + 1;

    const calculation_len = Math.max(start_len, end_len, 1) + workspace_len;
    const sv = this.decode(start, calculation_len);
    const ev = this.decode(end, calculation_len);
    const delta = ev.minus(sv).divide(count + 1);
    const delta_array = delta.toArray(this.base).value;

    // If the most significant digit of delta is less than cutoff we use two
    // digits of precision instead of one to ensure that gaps between
    // consecutive indicies are reasonably close to each other.
    const output_len =
      calculation_len -
      delta_array.length +
      (delta_array[0] < this.cutoff ? 2 : 1);

    return [...Array(count).keys()].map((_, i) => {
      const value = delta.times(i + 1).add(sv);
      const digits = value.toArray(this.base).value;
      const padded = Array(calculation_len - digits.length)
        .fill(0)
        .concat(digits);

      // We truncate to output_len digits, but round up if the first dropped
      // digit is greater than half of the alphabet size (the base).
      const rounded = bigInt
        .fromArray(padded.slice(0, output_len), this.base)
        // Round to the nearest whole number at the given output_len
        .add(padded[output_len] >= this.base / 2 ? 1 : 0);
      return this.encode(rounded, output_len);
    });
  }
}
