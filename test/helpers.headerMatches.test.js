import test from 'node:test';
import assert from 'node:assert/strict';
import { headerMatches, buildIndex } from '../src/parsers/helpers.js';

test('headerMatches: returns false when required fields missing', () => {
    const headerLower = ['foo', 'bar', 'baz'];
    const sig = { start: [/start/], end: [/end/], kwh: [/kwh/] };
    assert.equal(headerMatches(headerLower, sig), false);
});

test('buildIndex: maps regexes to indices', () => {
    const headerLower = ['start time', 'end time', 'consumption (kwh)'];
    const idx = buildIndex(headerLower, {
        start: [/start/],
        end: [/end/],
        kwh: [/kwh/]
    });
    assert.equal(idx.start, 0);
    assert.equal(idx.end, 1);
    assert.equal(idx.kwh, 2);
});
