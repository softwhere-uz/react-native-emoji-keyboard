/**
 * `useMultiSelect` — selection state for batch/multi insert. Verifies the
 * uncontrolled internal batch set (toggle add/remove, same-tick composition),
 * the controlled mode (prop owns selection; toggle reports prior membership
 * without mutating), and that highlighting works with multi-select off but a
 * controlled array present.
 */
import * as React from 'react';
import { act, render } from '@testing-library/react';
import { useMultiSelect } from '../useMultiSelect';

let api: ReturnType<typeof useMultiSelect>;
function Probe(props: Parameters<typeof useMultiSelect>[0]): React.ReactElement {
  api = useMultiSelect(props);
  return <div />;
}

const asArray = (s: ReadonlySet<string> | undefined) => [...(s ?? [])].sort();

describe('useMultiSelect — uncontrolled (internal batch)', () => {
  it('toggles a glyph in and out, reporting prior membership', async () => {
    await act(async () => {
      render(<Probe enabled />);
    });
    expect(api.selectedSet && [...api.selectedSet]).toEqual([]);

    let prior: boolean | undefined;
    await act(async () => {
      prior = api.toggle('😀');
    });
    expect(prior).toBe(false); // was not selected
    expect(asArray(api.selectedSet)).toEqual(['😀']);

    await act(async () => {
      prior = api.toggle('😀');
    });
    expect(prior).toBe(true); // was selected → now removed
    expect(asArray(api.selectedSet)).toEqual([]);
  });

  it('composes two toggles in the SAME tick (no stale-closure loss)', async () => {
    await act(async () => {
      render(<Probe enabled />);
    });
    await act(async () => {
      api.toggle('😀');
      api.toggle('❤️');
    });
    expect(asArray(api.selectedSet)).toEqual(['❤️', '😀'].sort());
  });
});

describe('useMultiSelect — controlled', () => {
  it('reflects the selected array and never mutates it on toggle', async () => {
    await act(async () => {
      render(<Probe enabled selected={['😀', '❤️']} />);
    });
    expect(asArray(api.selectedSet)).toEqual(['❤️', '😀'].sort());

    let prior: boolean | undefined;
    await act(async () => {
      prior = api.toggle('😀');
    });
    expect(prior).toBe(true); // already in the controlled set
    // Controlled: the hook does NOT change its own selection — the consumer would.
    expect(asArray(api.selectedSet)).toEqual(['❤️', '😀'].sort());
  });
});

describe('useMultiSelect — disabled', () => {
  it('tracks nothing when disabled and uncontrolled', async () => {
    await act(async () => {
      render(<Probe enabled={false} />);
    });
    expect(api.selectedSet).toBeUndefined();

    let prior: boolean | undefined;
    await act(async () => {
      prior = api.toggle('😀');
    });
    expect(prior).toBe(false);
    expect(api.selectedSet).toBeUndefined();
  });

  it('still highlights a controlled selection even with multi-select off', async () => {
    await act(async () => {
      render(<Probe enabled={false} selected={['😀']} />);
    });
    expect(asArray(api.selectedSet)).toEqual(['😀']);
    let prior: boolean | undefined;
    await act(async () => {
      prior = api.toggle('😀');
    });
    expect(prior).toBe(true);
  });
});
