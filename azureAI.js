import axios from "axios";
import env from "dotenv";

env.config();

const subscriptionKey = process.env.AZURE_KEY;
const endpoint = process.env.AZURE_ENDPOINT;
const version = "2023-02-01-preview";

const headers = {
  "Content-Type": "application/json",
  "Ocp-Apim-Subscription-Key": subscriptionKey,
};

async function analyzeImage(imageUrl) {
  try {
    const requestData = {
      url: imageUrl,
    };
    const response = await axios.post(
      `${endpoint}?api-version=${version}&features=denseCaptions&language=en`,
      requestData,
      { headers }
    );
    const textArray = response.data["denseCaptionsResult"]["values"].map(
      (value) => value.text
    );
    console.log(textArray);
    return textArray;
    // Handle the response here
  } catch (error) {
    console.error("Error:", error.message);
    // Handle errors here
  }
}

// Call the async function
// analyzeImage(
//   "https://res.cloudinary.com/dvmk4d0kb/image/upload/v1706997833/olympic_flag.png"
// );

export { analyzeImage };
