/**
 * §4 guard (behavioral): the grid reveals via `requestAnimationFrame` (never via
 * a deferred interaction callback) as soon as data is present, and then STAYS
 * revealed. A category change from scrolling or a search keystroke must never
 * blank the grid — that feedback loop is exactly what reintroduces the §4
 * empty-grid bug. Proven here with no React Native runtime.
 */
import * as React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useReveal } from '../useReveal';

/**
 * Flush exactly one animation-frame turn inside `act`. jsdom implements
 * `requestAnimationFrame` on a macrotask; we advance real timers a hair to let
 * the queued frame callback run, then let React commit the resulting update.
 */
async function flushFrame(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 32);
    });
  });
}

function Probe(props: { dataLength: number }): React.ReactElement {
  const revealed = useReveal({ dataLength: props.dataLength });
  return <div data-testid="probe">{revealed ? 'revealed' : 'hidden'}</div>;
}

describe('useReveal (§4 rAF reveal, no InteractionManager)', () => {
  it('is hidden synchronously on mount, then revealed on the next animation frame', async () => {
    await act(async () => {
      render(<Probe dataLength={10} />);
    });

    // Synchronous first commit: the grid must not paint before rAF fires.
    expect(screen.getByTestId('probe')).toHaveTextContent('hidden');

    await flushFrame();

    expect(screen.getByTestId('probe')).toHaveTextContent('revealed');
  });

  it('reveals once data arrives (length 0 → >0) via rAF — the core §4 scenario', async () => {
    let rerender!: (ui: React.ReactElement) => void;
    await act(async () => {
      ({ rerender } = render(<Probe dataLength={0} />));
    });
    await flushFrame();
    // No data yet → nothing to reveal.
    expect(screen.getByTestId('probe')).toHaveTextContent('hidden');

    await act(async () => {
      rerender(<Probe dataLength={12} />);
    });
    await flushFrame();
    expect(screen.getByTestId('probe')).toHaveTextContent('revealed');
  });

  it('STAYS revealed across category/data changes (scroll-sync never blanks the grid)', async () => {
    let rerender!: (ui: React.ReactElement) => void;
    await act(async () => {
      ({ rerender } = render(<Probe dataLength={10} />));
    });
    await flushFrame();
    expect(screen.getByTestId('probe')).toHaveTextContent('revealed');

    // Simulate a scroll-driven category change / search keystroke: the data
    // identity churns, but the grid must remain visible (never re-hide).
    await act(async () => {
      rerender(<Probe dataLength={25} />);
    });
    expect(screen.getByTestId('probe')).toHaveTextContent('revealed');
    await flushFrame();
    expect(screen.getByTestId('probe')).toHaveTextContent('revealed');
  });

  it('stays hidden when there is no data to show', async () => {
    await act(async () => {
      render(<Probe dataLength={0} />);
    });
    await flushFrame();
    expect(screen.getByTestId('probe')).toHaveTextContent('hidden');
  });
});
