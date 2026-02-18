// Model pricing in USD per million tokens (via OpenRouter)
interface ModelPricing {
  input: number;  // $/M input tokens
  output: number; // $/M output tokens
}

const PRICING: Record<string, ModelPricing> = {
  "minimax/minimax-m2.5": { input: 1.10, output: 4.40 },
  "moonshotai/kimi-k2.5": { input: 0.60, output: 2.40 },
};

export function estimateCost(inputTokens: number, outputTokens: number, modelId?: string): number {
  // Try exact match first, then partial match
  let pricing: ModelPricing | undefined;
  if (modelId) {
    pricing = PRICING[modelId];
    if (!pricing) {
      const key = Object.keys(PRICING).find((k) => modelId.includes(k));
      if (key) pricing = PRICING[key];
    }
  }
  // Default: use first entry (primary model)
  if (!pricing) pricing = Object.values(PRICING)[0];
  if (!pricing) return 0;

  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

export function formatCost(cost: number): string {
  if (cost < 0.001) return "< $0.001";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}
