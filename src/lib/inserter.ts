/* Copyright 2020 The Rational Index Project Developers. See the LICENSE
file at the top-level directory of this distribution and at
https://github.com/zandaleph/rational-index/blob/main/LICENSE */

import { MAX_ALLOWED_INTEGER } from './encoder';

export const LIST_HEAD = 'LIST_HEAD';
export const LIST_TAIL = 'LIST_TAIL';
export const NO_SOLUTION = 'NO_SOLUTION';

type LeftIndex = number | typeof LIST_HEAD;
type RightIndex = number | typeof LIST_TAIL;
type MaybeIndex = number | typeof NO_SOLUTION;
type MaybeIndicies = readonly number[] | typeof NO_SOLUTION;

/**
 * Computes an index between two existing indicies.
 *
 * For this trivial version, we assume later insertion is equally likely
 * before and after the newly created index, so we just pick the midpoint
 * between the two indicies.  If left + 1 >= right, we have to return null
 * because no valid index exists without rebalancing.
 *
 * @param left - the closest smaller index in range [0, MAX_ALLOWED_INTEGER],
 *               or null to indicate no smaller indicies exist.
 * @param right - the closest larger index in range [0, MAX_ALLOWED_INTEGER],
 *                or null to indicate no larger indicies exist.
 * @returns an index s.t. left < result < right,
 *          or null if no valid index exists.
 */
export function insert(left: LeftIndex, right: RightIndex): MaybeIndex {
  const solution = insertMany(left, right, 1);
  return solution !== NO_SOLUTION ? solution[0] : NO_SOLUTION;
}

/**
 * Computes multiple indicies between two existing indicies.
 *
 * For this version, we assume later insertion is equally likely before
 * and after each newly created index, so we just pick equally spaced points
 * between the two indicies.  If left + count >= right, we have to return null
 * because no valid set of indicies exists without rebalancing.
 *
 * @param left - the closest smaller index in range [0, MAX_ALLOWED_INTEGER],
 *               or [[LIST_HEAD]] to indicate no smaller indicies exist.
 * @param right - the closest larger index in range [0, MAX_ALLOWED_INTEGER],
 *                or [[LIST_TAIL]] to indicate no larger indicies exist.
 * @param count - the number of indicies to include in the result set.
 * @returns `count` sorted indicies s.t. left < all results < right,
 *          or [[NO_SOLUTION]] if no valid set of indicies exists.
 */
export function insertMany(
  left: LeftIndex,
  right: RightIndex,
  count: number
): MaybeIndicies {
  const lv = left === LIST_HEAD ? -1 : left;
  if (lv < -1 || lv > MAX_ALLOWED_INTEGER || Math.floor(lv) !== lv) {
    return NO_SOLUTION;
  }
  const rv = right === LIST_TAIL ? MAX_ALLOWED_INTEGER + 1 : right;
  if (rv < 0 || rv > MAX_ALLOWED_INTEGER + 1 || Math.floor(rv) !== rv) {
    return NO_SOLUTION;
  }
  const diff = rv - lv;
  if (diff < count + 1) {
    return NO_SOLUTION;
  }
  return [...Array(count).keys()].map((_, i) =>
    Math.floor(lv + ((i + 1) * diff) / (count + 1))
  );
}
