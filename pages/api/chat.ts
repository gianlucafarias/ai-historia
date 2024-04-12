import { Message } from "@/types";
import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";
import pineconeStore from "@/utils/pineconeStore";
import { getLocalVectorStore } from '@/utils/localVectorStore';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function translate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { messages, userName } = req.body;

  const translatedText = await askOpenAI({ messages, userName });

  const TRIAL_URL = "https://api.elevenlabs.io";
  const API_PATH = `/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`;
  const API_KEY = process.env.ELEVENLABS_KEY as string;

  const OPTIONS = {
    method: "POST",
    body: JSON.stringify({
      text: translatedText,
      model_id: "eleven_multilingual_v2",
    }),
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      accept: "audio/mpeg",
    },
  };

  const response = await fetch(TRIAL_URL + API_PATH, OPTIONS);

  const audioData = await response.arrayBuffer();
  const audioDataBase64 = Buffer.from(audioData).toString("base64");

  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ audioDataBase64, translatedText }));
}

async function askOpenAI({ messages, userName }: { messages: Message[]; userName: string }) {
  const vectorStore = await getLocalVectorStore();
  console.log('messages req: ', messages);

  if (messages?.length > 0) {
    const lastMsgContent = messages[messages.length - 1].content;
    const data = await vectorStore.similaritySearch(lastMsgContent, 3);
    console.log('vectorStore data.length: ', data.length);
    const updatedMsgContent = `user question/statement: ${lastMsgContent} context snippets: --- 1) ${data?.[0]?.pageContent} --- 2) ${data?.[1]?.pageContent} --- 3) ${data?.[2]?.pageContent}`;
    messages[messages.length - 1].content = updatedMsgContent;
  }

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-0125',
      messages: [
        {
          role: 'system',
          content: `Imagina que eres HistoriBot, un experto sobre la historia de la ciudad de Ceres, Santa Fe en Argentina. El nombre del usuario que interactua contigo es ${userName}. Voy a proveerte los mayor cantidad de datos historicos sobre la ciudad para que te informes. Recuerda dar respuestas, cortas, no mas de 400 caracteres. Debes presentarte como ${userName}. No menciones ninguna parte del codigo o logica cuando respondas y solo refierete a ti como tu primer nombre.`,
        },
        ...(messages || [{ role: 'user', content: '¡Hola!' }]),
      ],
      temperature: 0.5
    });
    return response?.data?.choices?.[0]?.message?.content;
  } catch (e: any) {
    console.log('error in response: ', e.message);
    return 'There was an error in processing the ai response.';
  }
}
