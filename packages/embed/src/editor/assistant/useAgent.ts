import { createGroq } from '@ai-sdk/groq'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { isStepCount, streamText, tool } from 'ai'
import { z } from 'zod'
import { findRuleViolations } from '../hooks/useViolations'
import { LayoutItemScheme, type LayoutItem } from '../items'
import type { AssistantPanelProps, ToolCallMessage } from './AssistantPanel'
/**
 * Handles communications with AI agents  
 */
export type UseAssistantResult = {
  messageAssistant: (input: string) => Promise<unknown>
}

/** AI API key */
export type AssistentApiKey = {
  name: 'groq' | 'openrouter'
  model: string
  key: string
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
    description: 'Suggest a solution by moving an item',
    inputSchema: z.object({
      item: LayoutItemScheme.omit({ item: true }).describe(
        'The new state of the item to move'
      ),
      message: z.string().optional().describe('message to the user'),
    }),

    execute: (input) => {
      let movedItem: LayoutItem | undefined = undefined
      const newLayout: LayoutItem[] = props.items.map((item) => {
        if (item.id === input.item.id) {
          movedItem = item
          return {
            ...item,
            x: input.item.x,
            z: input.item.z,
            rotation: input.item.rotation,
          }
        }
        return item
      })
      const violations = findRuleViolations(newLayout)

      if (violations.length) {
        return violations
      }
      if (!movedItem) {
        // The user made the same fix before the assistant could respond.
        return
      }
      props.setProposal({
        ghost: {
          ...(movedItem as LayoutItem),
          ...input.item,
        },
      })
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
    if (
      !props.assistentApiKey?.key &&
      !props.assistentApiKey?.model &&
      !props.assistentApiKey?.name
    ) {
      props.setStreamedMessage(
        'No API key provided. You can provide one using the form below.'
      )
      return
    }

    const provider =
      props.assistentApiKey.name === 'openrouter'
        ? createOpenRouter
        : createGroq
    const providerHandle = provider({ apiKey: props.assistentApiKey.key })

    props.setStreaming(true)
    props.setToolCallMessages([])

    const { textStream } = streamText({
      model: providerHandle(props.assistentApiKey.model),
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
