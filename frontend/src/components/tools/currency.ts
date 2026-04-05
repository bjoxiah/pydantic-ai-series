export const CONFIRM_CURRENCY_TOOL = {
  name: "confirm_currency",
  description: "Show the user the target currency list screen and ask for confirmation.",
  parameters: {
    type: "object",
    properties: {
      target_currencies: {
        type: "array",
        description: "List of target currencies",
        items: {
          type: "object",
          properties: {
            code: { type: "string", description: "Currency code e.g. GBP" },
            name: { type: "string", description: "Currency name e.g. Great British Pound" }
          }
        }
      }
    },
    required: ["target_currencies"],
  }
}