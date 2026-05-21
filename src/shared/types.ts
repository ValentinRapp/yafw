import type { RPCSchema } from "electrobun/bun";

export type AppRPCType = {
  bun: RPCSchema<{
    requests: {
      calculateFibonacci: { 
        params: { n: number }; 
        response: { n: number; result: number }; 
      };
    };
    messages: {};
  }>;
  webview: RPCSchema<{
    requests: {};
    messages: {};
  }>;
};