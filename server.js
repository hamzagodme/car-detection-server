const express = require("express");
const cors = require("cors");
const {
  RekognitionClient,
  DetectLabelsCommand,
  DetectCustomLabelsCommand,
} = require("@aws-sdk/client-rekognition");
require("dotenv").config();

const app = express();
app.use(cors());

// Initialize the Rekognition client with configuration
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.post(
  "/analyze-car",
  express.raw({ type: "image/*", limit: "5mb" }),
  async (req, res) => {
    try {
      const imageBuffer = req.body;

      // Regular label detection in AWS
      const detectLabels = new DetectLabelsCommand({
        Image: { Bytes: imageBuffer },
      });

      const common = await rekognitionClient.send(detectLabels);
      console.log("Common Labels Response:", JSON.stringify(common, null, 2));

      let carType = null;

      let confidence = 0;
      common.Labels.forEach((label) => {
        if (
          label.Name === "Sedan" ||
          label.Name === "SUV" ||
          label.Name === "Suv" ||
          label.Name === "Truck" ||
          label.Name === "Hatchback" ||
          label.Name === "Sports Car"
        ) {
          if (label.Confidence > confidence) {
            carType = label.Name;
            confidence = label.Confidence;
          }
        }
      });

      // Custom label detection from trained model in AWS
      const customDetectLabels = new DetectCustomLabelsCommand({
        Image: { Bytes: imageBuffer },
        ProjectVersionArn: process.env.MODEL_ARN,
        MinConfidence: 50,
      });

      const custom = await rekognitionClient.send(customDetectLabels);
      console.log("Custom Labels Response:", JSON.stringify(custom, null, 2));

      let brand = null;

      confidence = 0;
      custom.CustomLabels.forEach((label) => {
        if (
          label.Name === "Honda" ||
          label.Name === "Mercedes" ||
          label.Name === "Volkswagen"
        ) {
          if (label.Confidence > confidence) {
            brand = label.Name;
            confidence = label.Confidence;
          }
        }
      });

      res.json({
        type: carType || "Unknown",
        brand: brand || "Unknown",
      });
    } catch (error) {
      console.error("Error analyzing car image:", error);
      res.status(500).send("Error processing the image");
    }
  }
);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
