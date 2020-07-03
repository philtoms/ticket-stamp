import test from 'ava';
import pick from './pick';

test('empty object', (t) => {
  t.is(pick({}, 'x./y'), undefined);
});
test('empty array', (t) => {
  t.is(pick({ x: [] }, 'x.y'), undefined);
});
test('empty array item', (t) => {
  t.is(pick({ x: [{}, { y: 1 }] }, 'x.y'), 1);
});
test('first array item', (t) => {
  t.is(pick({ x: [{ y: 1 }] }, 'x.y'), 1);
});
test('first matched array item', (t) => {
  t.is(pick({ x: [{ z: 2 }, { y: 1 }] }, 'x.y'), 1);
});
test('first deep matched array item', (t) => {
  t.is(pick({ x: [{}, { y: [{ z: 1 }] }] }, 'x.y.z'), 1);
});
