import axios from 'axios'

const API_URL = "https://api.siliconflow.cn/v1/chat/completions"
const API_KEY = "sk-uqdmjvjhiyggiznhihznibdgsnpjdwdscqfqrywpgolismns"

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function chatWithAI(messages: Message[]) {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "Qwen/Qwen2-7B-Instruct",
        messages: messages,
        stream: false,
        max_tokens: 512,
        stop: null,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1,
        response_format: { type: "text" }
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content
    } else {
      throw new Error('No response from AI')
    }
  } catch (error) {
    console.error('AI Chat Error:', error)
    throw error
  }
} 