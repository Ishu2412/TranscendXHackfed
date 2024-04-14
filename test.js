import { GoogleGenerativeAI } from "@google/generative-ai";
import env from "dotenv";
import fs from "fs";
import fetch from "node-fetch";
import imageSize from "image-size";
import resizeBuffer from "buffer-crop-resize";

env.config();
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Function to resize image data
async function resizeImage(imageBuffer, targetWidth, targetHeight) {
  const { width, height } = imageSize(imageBuffer);

  // Calculate the aspect ratio
  const aspectRatio = width / height;

  // Resize using buffer-crop-resize library
  const resizedBuffer = resizeBuffer(
    imageBuffer,
    targetWidth,
    Math.floor(targetWidth / aspectRatio)
  );

  return resizedBuffer;
}

// Function to get image dimensions
async function getImageDimensions(imageUrl) {
  const response = await fetch(imageUrl);
  const imageBuffer = await response.buffer();
  const dimensions = imageSize(imageBuffer);
  return dimensions;
}

//generating caption for the image
async function captionGenerator(imageInfo, app) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `${imageInfo} - Generate a caption for this information about image for ${app} post`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return text;
}

async function imageToBase64(imageUrl) {
  const response = await fetch(imageUrl);
  const imageBuffer = await response.buffer();
  return Buffer.from(imageBuffer).toString("base64");
}

async function fileToGenerativePart(
  imageUrl,
  mimeType,
  targetWidth,
  targetHeight
) {
  // Get image dimensions
  const dimensions = await getImageDimensions(imageUrl);

  // Resize image based on desired dimensions (adjust as needed)
  const resizedImageData = await resizeImage(
    Buffer.from(await imageToBase64(imageUrl)),
    targetWidth,
    targetHeight
  );

  return {
    inlineData: {
      data: resizedImageData.toString("base64"),
      mimeType,
    },
  };
}

async function run(path) {
  // For text-and-image input (multimodal), use the gemini-pro-vision model
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const prompt =
    "Extract information from image as a photographer for photography purpose";

  const targetWidth = 800; // Set your desired width
  const targetHeight = 600; // Set your desired height

  const imageParts = [
    await fileToGenerativePart(path, "image/jpeg", targetWidth, targetHeight),
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = result.response;
  const text = response.text();
  console.log(text);
}

run(
  "https://res.cloudinary.com/dvmk4d0kb/image/upload/v1706997833/olympic_flag.png"
);
