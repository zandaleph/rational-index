/* eslint-disable functional/no-loop-statement,functional/no-let */

import test from 'ava';

import { decode, encode } from './encoder';

test('encode', (t) => {
  t.is(encode(0), '+++++');
  t.is(encode(1), '++++-');
  t.is(encode(1073741823), 'zzzzz');
  t.is(encode(536870912), 'U++++');
  t.is(encode(1 << 29), 'U++++');
});

test('encode limits', (t) => {
  t.is(encode(-1), null);
  t.is(encode(1073741824), null);
  t.is(encode(1.1), null);
});

test('encode ordering', (t) => {
  for (let i = 0; i < 65; ++i) {
    const left = encode(i) as string;
    const right = encode(i + 1) as string;
    t.true(left < right, `encoded ${i} (${left}) > ${i + 1} (${right})`);
  }
});

test('decode', (t) => {
  t.is(decode('+++++'), 0);
  t.is(decode('++++-'), 1);
  t.is(decode('zzzzz'), 1073741823);
  t.is(decode('U++++'), 536870912);
});

test('decode limits', (t) => {
  t.is(decode(''), null);
  t.is(decode('++++++++'), null);
  t.is(decode('~#%@!'), null);
});
