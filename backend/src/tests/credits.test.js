const { MODEL_CREDIT_COSTS } = require('../services/aiService');

describe('Credit cost constants', () => {
  it('gemini costs 0.5 credits', () => {
    expect(MODEL_CREDIT_COSTS.gemini).toBe(0.5);
  });

  it('claude costs 1 credit', () => {
    expect(MODEL_CREDIT_COSTS.claude).toBe(1);
  });

  it('openai costs 1.5 credits', () => {
    expect(MODEL_CREDIT_COSTS.openai).toBe(1.5);
  });
});
