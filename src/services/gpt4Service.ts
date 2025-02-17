// services/llm/openai-service.ts
import OpenAI from "openai"
import { BaseLLMService } from "./baseLLMService"

export class GPT4Service extends BaseLLMService {
    private openai: OpenAI

    constructor(apiKey: string) {
        super(apiKey, "gpt-4")
        this.openai = new OpenAI({ apiKey: this.apiKey })
    }

    protected initializePrompts(): void {
        this.prompts.set("terraform", {
            prompt: `
        Analyze the following Terraform plan JSON output and provide a cost estimation report based on your knowledge of common AWS pricing. The report should meet these requirements:

1. Examine the planned changes in the Terraform plan JSON.
2. Identify all AWS resources that will be added, modified, or deleted.
3. Provide estimated costs by making reasonable assumptions based on general knowledge of AWS pricing. If exact prices are unknown, provide an estimated guess.
4. Calculate estimated costs for:
   - Base Cost (fixed monthly charges)
   - Variable Cost scenarios based on the resource type. Define appropriate usage tiers for each resource:
     * Low Usage (minimal expected usage)
     * Medium Usage (moderate expected usage)
     * High Usage (heavy expected usage)
5. If a cost estimation is not possible, return a JSON with null values for the fields instead of omitting them.
6. In notes, include the cost breakdown for each resource. (i.e. EC2 instance with 0.5$ per hour, 24 hours a day, 30 days a month = some $ per month)
7. when naming resources,  if possible also include the resource type.

Format the response as a structured JSON with the following fields:
 {
   baseCost: number // estimated fixed monthly cost
    variableCosts: { low: number; medium: number; high: number } // variable monthly cost estimates based on usage
    serviceChanges: string[] // list of changes such as added, modified, or removed resources
    detailedCosts: {
        resourceName: string // name of the resource
        resourceType: string // type of the resource
        baseCostEstimate: number // estimated fixed monthly cost for the resource
        variableCostEstimate: { low: number; medium: number; high: number } // variable cost estimates for the resource
    }[],
    notes: string[] // list of notes about the cost estimation
    low_assumptions: string[] // list of assumptions for the low usage scenario
    medium_assumptions: string[] // list of assumptions for the medium usage scenario
    high_assumptions: string[] // list of assumptions for the high usage scenario
 }

Do not include any other text or comments in your response. Response should be json only.

Here's the Terraform plan JSON:`,
            responseFormat: "{ baseCost: number, variableCosts: {...} }",
        })
        this.prompts.set("pulumi", {
            prompt: `
        Analyze the following Pulumi preview JSON output and provide a cost estimation report based on your knowledge of common AWS pricing. The report should meet these requirements:

1. Examine the planned changes in the Pulumi preview JSON.
2. Identify all AWS resources that will be added, modified, or deleted.
3. Provide estimated costs by making reasonable assumptions based on general knowledge of AWS pricing. If exact prices are unknown, provide an estimated guess.
4. Calculate estimated costs for:
   - Base Cost (fixed monthly charges)
   - Variable Cost scenarios based on the resource type. Define appropriate usage tiers for each resource:
     * Low Usage (minimal expected usage)
     * Medium Usage (moderate expected usage)
     * High Usage (heavy expected usage)
5. If a cost estimation is not possible, return a JSON with null values for the fields instead of omitting them.
6. In notes, include the cost breakdown for each resource. (i.e. EC2 instance with 0.5$ per hour, 24 hours a day, 30 days a month = some $ per month)
7. when naming resources,  if possible also include the resource type.

Format the response as a structured JSON with the following fields:
 {
   baseCost: number // estimated fixed monthly cost
    variableCosts: { low: number; medium: number; high: number } // variable monthly cost estimates based on usage
    serviceChanges: string[] // list of changes such as added, modified, or removed resources
    detailedCosts: {
        resourceName: string // name of the resource
        resourceType: string // type of the resource
        baseCostEstimate: number // estimated fixed monthly cost for the resource
        variableCostEstimate: { low: number; medium: number; high: number } // variable cost estimates for the resource
    }[],
    notes: string[] // list of notes about the cost estimation
    low_assumptions: string[] // list of assumptions for the low usage scenario
    medium_assumptions: string[] // list of assumptions for the medium usage scenario
    high_assumptions: string[] // list of assumptions for the high usage scenario
 }

Do not include any other text or comments in your response. Response should be json only.

Here's the Pulumi preview JSON:`,
            responseFormat: "{ baseCost: number, variableCosts: {...} }",
        })
    }

    async getResponse(content: string, iacType: string): Promise<string> {
        const { prompt } = this.getPrompt(iacType)

        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content:
                            "You're an assistant that only speaks JSON. Do not write normal text.",
                    },
                    { role: "user", content: `${prompt}\n\n${content}` },
                ],
                temperature: 0.7,
            })

            return response.choices[0].message.content || ""
        } catch (error) {
            throw new Error(`OpenAI API error: ${error}`)
        }
    }
}
