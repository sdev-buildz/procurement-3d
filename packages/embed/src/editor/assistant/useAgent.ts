import { createGroq } from '@ai-sdk/groq'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { isStepCount, streamText, tool } from 'ai'
import { z } from 'zod'
import { findRuleViolations } from '../hooks/useViolations'
import { LayoutItemScheme, type LayoutItem } from '../items'
import type { AssistantPanelProps, ToolCallMessage } from './AssistantPanel'
import { createProposalGhosts } from './assistantReply'
/**
 * Handles communications with AI agents  
 */
export type UseAssistantResult = {
  messageAssistant: (input: string) => Promise<unknown>
}

/** AI API key */
export type AssistentApiKey = {
  name: 'groq' | 'openrouter' | 'local'
  model: string
  key: string
  url: string
}

/**
 *   An Agentic AI assistant.
 */
export const useAssistant = (
  props: Pick<
    AssistantPanelProps,
    'items' | 'violations' | 'proposal' | 'setProposal' | 'historyState'
  > & {
    setStreaming: (value: boolean) => void
    toolCallMessages: ToolCallMessage[]
    setToolCallMessages: (msg: ToolCallMessage[]) => void
    setStreamedMessage: (msg: string) => void
    assistentApiKey: AssistentApiKey | undefined
  }
): UseAssistantResult => {
  const getToolCallStreamer = (
    toolName: string
  ): Pick<
    Parameters<typeof tool>[0],
    'onInputStart' | 'onInputDelta' | 'onInputAvailable'
  > => {
    return {
      onInputStart() {
        console.log('Model started generating inputs for getWeather...')
        props.setToolCallMessages([
          ...props.toolCallMessages,
          {
            toolName,
            message: '',
          },
        ])
      },
      onInputDelta({ inputTextDelta }) {
        // Raw JSON text chunks as they arrive from the LLM
        console.log('Streaming input chunk:', inputTextDelta)
        props.setToolCallMessages([
          ...props.toolCallMessages,
          {
            toolName,
            message:
              props.toolCallMessages[props.toolCallMessages.length - 1]
                ?.message + inputTextDelta,
          },
        ])
      },
      onInputAvailable({ input }) {
        // The complete, schema-validated input object is ready
        console.log('Streaming finished. Full input parsed:', input)
        props.setToolCallMessages([
          ...props.toolCallMessages,
          {
            toolName,
            message:
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (input as any).reason ?? props.toolCallMessages[0]?.message ?? '',
          },
        ])
      },
    }
  }

  const getLayout = tool({
    description: 'Get the current layout of the items in the room',
    inputSchema: z.object({
      rationalle: z
        .string()
        .optional()
        .describe('message to display to the user'),
    }),
    execute: () => props.items,
  })

  const getViolations = tool({
    description: 'Get the rule violations of the items in the room',
    inputSchema: z.object({
      reason: z.string().optional().describe('message to display to the user'),
    }),
    // Hook into the streaming inputs
    ...{
      ...getToolCallStreamer('get-violations'),
    },
    execute: () => props.violations,
  })

  const suggestSolution = tool({
    description: 'Suggest a solution by moving one or more items',
    inputSchema: z.object({
      items: z
        .array(
          LayoutItemScheme.pick({
            id: true,
            x: true,
            z: true,
            rotation: true,
          }).describe('A new transform for an existing item')
        )
        .min(1)
        .describe('New transforms for one or more existing layout items'),
      message: z.string().optional().describe('message to the user'),
    }),

    execute: (input) => {
      const ghosts = createProposalGhosts(props.items, input.items)
      if (!ghosts) return 'Every proposed item must be a unique existing item.'

      const ghostsById = new Map(ghosts.map((item) => [item.id, item]))
      const newLayout: LayoutItem[] = props.items.map(
        (item) => ghostsById.get(item.id) ?? item
      )
      const violations = findRuleViolations(newLayout)

      if (violations.length) {
        return violations
      }
      props.setProposal({ ghosts })
    },
  })

  const message = tool({
    description: `message the user`,
    inputSchema: z.object({
      message: z.string().describe('The message to the user'),
    }),
    execute: () => undefined,
  })

  const tools = {
    get_layout: getLayout,
    get_violations: getViolations,
    suggest_solution: suggestSolution,
    message,
  }

  const messageAssistant = async (input: string) => {
    if (!props.assistentApiKey?.model) {
      props.setStreamedMessage(
        'No model provided. You can provide one using the form below.'
      )
      return
    }

    if (props.assistentApiKey.name !== 'local' && !props.assistentApiKey.key) {
      props.setStreamedMessage(
        'No API key provided. You can provide one using the form below.'
      )
      return
    }

    let model
    if (props.assistentApiKey.name === 'openrouter') {
      const providerHandle = createOpenRouter({
        apiKey: props.assistentApiKey.key,
      })
      model = providerHandle(props.assistentApiKey.model)
    } else if (props.assistentApiKey.name === 'groq') {
      const providerHandle = createGroq({
        apiKey: props.assistentApiKey.key,
      })
      model = providerHandle(props.assistentApiKey.model)
    } else {
      if (!props.assistentApiKey.url) {
        props.setStreamedMessage(
          'No base URL provided. Enter an OpenAI-compatible server URL.'
        )
        return
      }

      let baseURL: string
      try {
        baseURL = new URL(props.assistentApiKey.url)
          .toString()
          .replace(/\/$/, '')
      } catch {
        props.setStreamedMessage(
          'Invalid base URL. Enter a complete URL such as http://localhost:1234/v1.'
        )
        return
      }

      const providerHandle = createOpenAICompatible({
        name: 'local',
        baseURL,
        ...(props.assistentApiKey.key
          ? { apiKey: props.assistentApiKey.key }
          : {}),
      })
      model = providerHandle.chatModel(props.assistentApiKey.model)
    }

    props.setStreaming(true)
    props.setToolCallMessages([])

    const { textStream } = streamText({
      model,
      system:
        'You are assistant in an interactive 3D electrical room configuration tool.',
      prompt: input,
      tools,
      stopWhen: isStepCount(5),
      onError: (err) => {
        if (
          err.error &&
          err.error instanceof Error &&
          'responseBody' in err.error
        )
          props.setStreamedMessage(err.error.responseBody as string)
        console.log(err)
      },
    })

    let response = ''
    for await (const textPart of textStream) {
      console.log(textPart)
      response += textPart
      props.setStreamedMessage(response)
    }
    props.setStreaming(false)
    return response
  }

  return {
    messageAssistant,
  }
}
