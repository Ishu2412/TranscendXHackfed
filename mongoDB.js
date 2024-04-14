import mongoose from "mongoose";

const imageTextSchema = new mongoose.Schema({
  url: String,
  text: {},
});

const authSchema = new mongoose.Schema({
  email: String,
  password: String,
  profileData: [
    {
      type: imageTextSchema,
    },
  ],
  chatMessages: [],
});

const AuthData = mongoose.model("AuthData", authSchema);

export { AuthData };
