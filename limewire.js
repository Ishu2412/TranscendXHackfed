import fetch from "node-fetch";
import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function generateLimeWireImage(prompt) {
  const resp = await fetch(`https://api.limewire.com/api/image/generation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Version": "v1",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.LIME_KEY}`,
    },
    body: JSON.stringify({
      prompt: prompt,
      aspect_ratio: "1:1",
    }),
  });

  const response = await resp.json();
  // Handle the response
  const url = response.data[0].asset_url;
  // Handle the response
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
  console.log(cloudinaryResponse);
  return cloudinaryResponse;
}

// generateLimeWireImage(
//   "Generate a photo of a human posing for photography in a swimming pool setting. The photo should capture a close-up of the human's face, with a realistic and lifelike appearance. Include details such as skin texture, hair, eyes, and facial expression. The background of the photo should feature a swimming pool with a fence and flowers, creating a serene and inviting atmosphere. Ensure that the human's pose is natural and complements the surroundings."
// );

export { generateLimeWireImage };
