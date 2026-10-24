const test = require('node:test');
const assert = require('node:assert/strict');

const { JAMB_SUBJECTS, normalizeJambSubjects } = require('../src/utils/jambSubjects');

test('provides the major Nigerian JAMB subjects', () => {
  assert.equal(JAMB_SUBJECTS.length, 17);
  assert.deepEqual(JAMB_SUBJECTS.slice(0, 4), [
    'English Language',
    'Mathematics',
    'Physics',
    'Chemistry',
  ]);
});

test('accepts exactly four distinct subjects', () => {
  assert.deepEqual(normalizeJambSubjects([
    'English Language',
    'Mathematics',
    'Physics',
    'Chemistry',
  ]), [
    'English Language',
    'Mathematics',
    'Physics',
    'Chemistry',
  ]);
});

test('accepts the subject names used in the registration form', () => {
  assert.deepEqual(normalizeJambSubjects([
    'English Language',
    'Mathematics',
    'Islamic Studies',
    'Christian Religious Studies',
  ]), [
    'English Language',
    'Mathematics',
    'Islamic Religious Studies',
    'Christian Religious Studies',
  ]);
});

test('rejects invalid subject combinations', () => {
  assert.throws(() => normalizeJambSubjects(['English Language', 'Mathematics', 'Physics']), /exactly four/i);
  assert.throws(() => normalizeJambSubjects(['English Language', 'Mathematics', 'Physics', 'Physics']), /distinct/i);
  assert.throws(() => normalizeJambSubjects(['English Language', 'Mathematics', 'Physics', 'Unknown']), /valid JAMB subject/i);
});
