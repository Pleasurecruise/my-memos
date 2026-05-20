import { createAiGateway } from "ai-gateway-provider";
import { createUnified } from "ai-gateway-provider/providers/unified";

export function createProvider(env: {
  CF_ACCOUNT_ID: string;
  CF_GATEWAY_NAME: string;
  CF_AIG_TOKEN: string;
}) {
  const aigateway = createAiGateway({
    accountId: env.CF_ACCOUNT_ID,
    gateway: env.CF_GATEWAY_NAME,
    apiKey: env.CF_AIG_TOKEN,
  });

  const unified = createUnified();

  return {
    chat(modelId: string) {
      return aigateway(unified(modelId));
    },
  };
}
