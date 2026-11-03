import { glyphTextMetrics } from '../glyphMetrics';

describe('glyphTextMetrics', () => {
  it('sets the size, a 1.25 line height and a box at least that wide', () => {
    expect(glyphTextMetrics(28)).toEqual({ fontSize: 28, lineHeight: 35, minWidth: 35 });
  });

  it('rounds the line height and the width together', () => {
    const metrics = glyphTextMetrics(30);
    expect(metrics.lineHeight).toBe(38);
    expect(metrics.minWidth).toBe(metrics.lineHeight);
  });
});
