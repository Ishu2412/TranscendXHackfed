import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import {
  connect,
  closeConnection,
  addUser,
  findUser,
  updateUser,
  getProfileData,
  updateHistory,
  getHistory,
} from "./mongoMethods.js";
import bcrypt from "bcrypt";
import env from "dotenv";
import cors from "cors";
import { generateImage } from "./openAi.js";
import { analyzeImage } from "./azureAI.js";
import {
  llmGenerator,
  textSolutionGenerator,
  generateMessage,
} from "./modelLLM.js";
import { generateLimeWireImage } from "./limewire.js";

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
env.config();

connect();

app.get("/", (req, res) => {
  res.status(200).send("Hello");
});

app.post("/register", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const check = await findUser({
      email,
      password,
    });
    console.log(email);
    console.log(password);

    //if user already exists
    if (check) {
      console.log(check);
      res.status(409).send(`User already exists. Try loggin in.`);
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log(`Error while hashing the password ${err}`);
        } else {
          const user = {
            email: email,
            password: hash,
          };
          await addUser(user);
          res.status(200).send(true);
        }
      });
    }
  } catch (err) {
    console.error(`Error while registering the user: ${err}`);
    res.status(500).send(`Internal server error`);
  }
});

app.post("/login", async (req, res) => {
  try {
    const data = {
      email: req.body.email,
      password: req.body.password,
    };
    const user = await findUser(data);
    if (user) {
      const storedHashedPassword = user.password;
      bcrypt.compare(data.password, storedHashedPassword, (err, result) => {
        if (err) {
          res.status(500).send(`Error while Authorizing`);
        } else {
          if (result) {
            res.status(200).send(true);
          } else {
            res.status(401).send(`Password not match`);
          }
        }
      });
    } else {
      res.status(401).send(`User not found`);
    }
  } catch {
    res.status(500).send(`Internal Server Error`);
  }
});

//generate pose
app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const email = req.body.email;
    //photo solution
    // const url = await generateImage(JSON.stringify(prompt));
    const url = await generateLimeWireImage(JSON.stringify(prompt));
    // const url =
    //   "http://res.cloudinary.com/dvmk4d0kb/image/upload/v1711969713/olympic_flag1.jpg";
    //text solution
    const textSolution = await textSolutionGenerator(url);
    //caption for the image
    const promptLLM = `${prompt} - Generate a caption  using information about image for instagram post. Caption must be attractive and eye catching. Use all the information and generate 4 captions containg 5 words atmost.`;
    const caption = await llmGenerator(promptLLM);

    const data = {
      email: email,
      url: url,
      textSolution: textSolution,
      caption: caption,
    };

    await updateUser(data);

    res.status(200).json(data);
  } catch (err) {
    console.log(`Error while generating image ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

//make prompt through analysis of image
app.post("/prompt", async (req, res) => {
  try {
    const url = req.body.url;
    const response = await analyzeImage(url);
    console.log(response);
    const scene = await llmGenerator(
      // `Make a prompt for generative ai model so that it would create a realistic human posing for photography with the location described as ${response}, in two lines paragraph.`
      `describe me about the scene that is described in ${response}. In 10 words`
    );
    res.status(200).send(`A man posing at ${scene} for a photograph`);
  } catch (err) {
    console.log(`Internal server Error`);
    res.status(500).send(`Internal Server Error`);
  }
});

//generating caption
app.post("/caption", async (req, res) => {
  try {
    const url = req.body.url;
    const media = req.body.media || "Instagram";
    const response = await analyzeImage(url);
    const prompt = `${response} - Generate a caption  using information about image for ${media} post. Caption must be attractive and eye catching. Use all the information and generate 4 captions containg 5 words atmost.`;
    const text = await llmGenerator(prompt);
    res.status(200).send(text);
  } catch (err) {
    console.log(`Error while generating caption ${err}`);
    res.status(500).send(`Internal server error`);
  }
});

//place information
app.post("/place", async (req, res) => {
  try {
    const placeName = req.body.name;
    const prompt = `Provide information on the top destinations, esthetics locations, best hotels and restaurants and cultural happenings suitable for content creation by social media creators in ${placeName}, formatted as a JSON object wiht keys as "destination", "estheticsLocations", "hotels", "restuarants" and "culturalHappenings".`;
    const info = await llmGenerator(prompt);

    res.status(200).send(info);
  } catch (err) {
    console.log(`Error while generating place infromation: ${err}`);
    res.status(500).send(`Internal server error`);
  }
});

//chat bot
app.post("/chat", async (req, res) => {
  try {
    const email = req.body.email;
    const userMessage = req.body.message;
    const history = await getHistory(email);
    const modelMessage = await generateMessage(userMessage, history);
    const dataUser = {
      role: "user",
      parts: [{ text: userMessage }],
    };
    const dataModel = {
      role: "model",
      parts: [{ text: modelMessage }],
    };
    await updateHistory(email, dataUser, dataModel);
    res.status(200).send(modelMessage);
  } catch (err) {
    console.log(`Error while generating chat: ${err}`);
    res.status(500).send(`Internal Server Error`);
  }
});

//profile info
app.post("/profile", async (req, res) => {
  try {
    const email = req.body.email;
    const data = await getProfileData(email);
    if (data) res.status(200).json(data);
    else res.status(404).send(`User not found`);
  } catch (err) {
    console.log(`Error while getting the profile: ${err}`);
    res.status(500).send(`Internal Server Error`);
  }
});

app.listen(port, (req, res) => {
  console.log(`Server is listening at port ${port}`);
});

process.on("SIGINT", () => {
  closeConnection();
  process.exit();
});
