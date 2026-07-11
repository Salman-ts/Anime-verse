// Deno type declarations for Edge Functions
declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
}

declare module "jsr:@supabase/supabase-js@2.49.8" {
  export * from "@supabase/supabase-js";
}