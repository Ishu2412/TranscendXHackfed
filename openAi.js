import { OpenAI } from "openai";
import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

config();

// Initialize the OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to generate image using OpenAI API
async function generateImage(prompt) {
  try {
    // Call the OpenAI API
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: prompt,
      size: "1024x1024",
      n: 1,
      quality: "hd",
    });

    // Handle the response
    const url = response.data[0].url;
    const cloudinaryResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        url,
        { public_id: "olympic_flag1" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error.message);
            reject(error);
          } else {
            const publicUrl = result.url;
            console.log(`Uploaded to Cloudinary. URL: ${publicUrl}`);
            resolve(publicUrl);
          }
        }
      );
    });
    return cloudinaryResponse;
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Example usage
// const prompt =
//   "Generate an image of girl posing in front of beach for photography learning purpose with face of actress, try to produce human like face with smile and happy gestures on face";

// generateImage(prompt);

export { generateImage };
