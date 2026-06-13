import { generateText, Output } from "ai"
import { z } from "zod"

const res = await generateText({
  model: "google/gemini-3.5-flash",
  output: Output.object({
    schema: z.object({ summary: z.string(), score: z.number() }),
  }),
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Rate a bare suburban lawn's biodiversity 0-100 and give a one-sentence summary.",
        },
      ],
    },
  ],
})

console.log("GATEWAY OK:", JSON.stringify(res.experimental_output))
