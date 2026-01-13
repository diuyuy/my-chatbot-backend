export const SYSTEM_PROMPTS = {
  getSystemPrompt(context?: string) {
    return `If the response might become long, please reply in Markdown format. If there is any content in the Context below, please refer to that context when providing your answer. Answer in the user's message language.

    <context>${context}</context>
    `;
  },
} as const;
