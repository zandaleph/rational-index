/* Copyright 2020 The Rational Index Project Developers. See the LICENSE
file at the top-level directory of this distribution and at
https://github.com/zandaleph/rational-index/blob/main/LICENSE */

import test from 'ava';

import {
  insert,
  insertMany,
  LIST_HEAD,
  LIST_TAIL,
  NO_SOLUTION,
} from './inserter';

// between (open) and 4 is 2 (2 left, 1 right) or 1 (1 left, 2 right)
// between (open) and 16 is 7 (7 left, 8 right)

// between 4 and 8 (fake open?) is 6 (1 left, 1 right)
// between 16 and 32 is 24 (7 each side)

// between (open) and 8 (fake open) is 3 (012 v 4567)

test('insert', (t) => {
  t.is(insert(LIST_HEAD, LIST_TAIL), 536870911);
  t.is(insert(LIST_HEAD, insert(LIST_HEAD, LIST_TAIL) as number), 268435455);
  t.is(insert(insert(LIST_HEAD, LIST_TAIL) as number, LIST_TAIL), 805306367);
  t.is(insert(LIST_HEAD, 1), 0);
  t.is(insert(0, 2), 1);
  t.is(insert(1, 3), 2);

  t.is(insert(1073741822, LIST_TAIL), 1073741823);
  t.is(insert(1073741821, 1073741823), 1073741822);
});

test('insert has no solution when too narrow', (t) => {
  t.is(insert(LIST_HEAD, 0), NO_SOLUTION);
  t.is(insert(100, 101), NO_SOLUTION);
});

test('insertMany', (t) => {
  t.deepEqual(insertMany(100, 200, 1), [150]);
  t.deepEqual(insertMany(100, 200, 2), [133, 166]);
  t.deepEqual(insertMany(100, 200, 3), [125, 150, 175]);
  t.deepEqual(insertMany(100, 200, 4), [120, 140, 160, 180]);
  t.deepEqual(insertMany(100, 200, 5), [116, 133, 150, 166, 183]);

  t.deepEqual(insertMany(100, 104, 3), [101, 102, 103]);
});

test('insertMany has no solution when too narrow', (t) => {
  t.is(insertMany(100, 102, 2), NO_SOLUTION);
  t.is(insertMany(100, 103, 3), NO_SOLUTION);
  t.is(insertMany(LIST_HEAD, 1, 3), NO_SOLUTION);
});
