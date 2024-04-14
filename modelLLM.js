import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import env from "dotenv";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import { createCanvas, loadImage } from "canvas";

// Access your API key as an environment variable (see "Set up your API key" above)
env.config();
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

//generating caption for the image
async function llmGenerator(prompt) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    safetySettings: [],
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  console.log(text);
  return text;
}

//downloading images
async function downloadImage(
  url,
  localPath,
  rangeStart = 0,
  rangeEnd = undefined
) {
  const headers = {};

  if (rangeEnd !== undefined) {
    headers["Range"] = `bytes=${rangeStart}-${rangeEnd}`;
  }

  const response = await fetch(url, { headers });
  const imageBuffer = await response.arrayBuffer();
  fs.writeFileSync(localPath, Buffer.from(imageBuffer));
}

// Converts local file information to a GoogleGenerativeAI.Part object.
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}

async function textSolutionGenerator(url) {
  //image type
  const regex = /[^.]+$/;
  const type = url.match(regex)[0];

  const name = url.replace(/\.[^/.]+$/, "");

  console.log(name);

  //downloading image
  await downloadImage(`${name}.jpg`, `public/images/image.jpg`, 0, 712 * 712);

  // For text-and-image input (multimodal), use the gemini-pro-vision model
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const prompt =
    "Analyze the provided photograph and describe the pose of the human subject in a step-by-step format, focusing on body position, limb placement, weight distribution, and facial expression.Body position: Is the subject standing, sitting, kneeling, or lying down? Describe their posture (straight, slouched, arched).Limb placement: For each limb (head, arms, legs), describe its position relative to the body (raised, lowered, bent, extended). Specify any specific angles (e.g., arm raised at a 45-degree angle).Weight distribution: On which foot is the subject's weight resting primarily? Are they evenly balanced?Facial expression: Describe the subject's facial expression (smiling, frowning, neutral). Are their eyes open or closed?";

  const imageParts = [
    fileToGenerativePart("public/images/image.png", "image/png"),
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = result.response;
  const text = response.text();
  // console.log(text);
  return text;
}

//chat function

async function generateMessage(msg, hist) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1024,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: hist,
  });

  const result = await chat.sendMessage(msg);
  const response = result.response;
  const text = response.text();
  console.log(text);
  return text;
}

// run(
//   "https://res.cloudinary.com/dvmk4d0kb/image/upload/v1706997833/olympic_flag.png"
// );

// captionGenerator(
//   [
//     "a child smiling at the camera",
//     "a child smiling at the camera",
//     "a child wearing a striped shirt",
//     "close up of a child's nose",
//     "a close up of an ear",
//     "a close up of a person's face",
//     "a close-up of a glass",
//     "a close up of an eye",
//     "a close up of a person's neck",
//     "a close-up of a blue and white striped shirt",
//   ],
//   "instagram"
// );

// run();

export { llmGenerator, textSolutionGenerator, generateMessage };
