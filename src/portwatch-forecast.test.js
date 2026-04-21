const { calcAppearanceRate, buildForecast, predictedPorts, formatForecastReport } = require('./portwatch-forecast');

const HOUR = 3600000;

function makeHistory(portList, timestamps) {
  return timestamps.map(ts => ({
    timestamp: new Date(ts).toISOString(),
    ports: portList.map(p => ({ port: p }))
  }));
}

describe('calcAppearanceRate', () => {
  test('returns 0 for empty or single timestamp', () => {
    expect(calcAppearanceRate([])).toBe(0);
    expect(calcAppearanceRate([Date.now()])).toBe(0);
  });

  test('calculates rate correctly', () => {
    const now = Date.now();
    const ts = [now, now + HOUR, now + 2 * HOUR];
    const rate = calcAppearanceRate(ts, HOUR);
    expect(rate).toBeCloseTo(1.5, 1);
  });
});

describe('buildForecast', () => {
  test('returns empty object for empty history', () => {
    expect(buildForecast([])).toEqual({});
  });

  test('builds forecast entries for each port', () => {
    const now = Date.now();
    const timestamps = Array.from({ length: 6 }, (_, i) => now + i * HOUR);
    const history = makeHistory([3000, 8080], timestamps);
    const forecast = buildForecast(history, { windowMs: HOUR, minRate: 0.5 });
    expect(forecast['3000']).toBeDefined();
    expect(forecast['8080']).toBeDefined();
    expect(forecast['3000'].port).toBe(3000);
    expect(typeof forecast['3000'].rate).toBe('number');
    expect(typeof forecast['3000'].confidence).toBe('number');
  });

  test('marks port as predicted when rate >= minRate', () => {
    const now = Date.now();
    const timestamps = Array.from({ length: 8 }, (_, i) => now + i * HOUR);
    const history = makeHistory([5000], timestamps);
    const forecast = buildForecast(history, { windowMs: HOUR, minRate: 0.5 });
    expect(forecast['5000'].predicted).toBe(true);
  });

  test('confidence caps at 1.0', () => {
    const now = Date.now();
    const timestamps = Array.from({ length: 20 }, (_, i) => now + i * HOUR);
    const history = makeHistory([9000], timestamps);
    const forecast = buildForecast(history, { windowMs: HOUR });
    expect(forecast['9000'].confidence).toBe(1);
  });
});

describe('predictedPorts', () => {
  test('returns only predicted entries', () => {
    const forecast = {
      '3000': { port: 3000, predicted: true, rate: 1.2, confidence: 0.8, lastSeen: '' },
      '4000': { port: 4000, predicted: false, rate: 0.1, confidence: 0.2, lastSeen: '' }
    };
    const result = predictedPorts(forecast);
    expect(result).toHaveLength(1);
    expect(result[0].port).toBe(3000);
  });
});

describe('formatForecastReport', () => {
  test('returns message for empty forecast', () => {
    expect(formatForecastReport({})).toMatch(/No forecast/);
  });

  test('includes port numbers and rates', () => {
    const forecast = {
      '3000': { port: 3000, predicted: true, rate: 2.5, confidence: 0.9, lastSeen: '2024-01-01T00:00:00.000Z' }
    };
    const report = formatForecastReport(forecast);
    expect(report).toMatch('3000');
    expect(report).toMatch('2.5');
    expect(report).toMatch('✓');
  });
});
