const express = require('express');
const cors = require('cors');
const { RekognitionClient, DetectLabelsCommand } = require('@aws-sdk/client-rekognition');
require('dotenv').config();

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

app.post('/analyze-car', express.raw({ type: 'image/*', limit: '5mb' }), async (req, res) => {
    try {
      console.log(req.body)
      
      const imageBuffer = req.body;
  
      const command = new DetectLabelsCommand({ Image: { Bytes: imageBuffer } });
      const data = await rekognitionClient.send(command);
  
      let carType = null;
      let brand = null;
      let model = null;
  
      // Find car type, brand, and model (mocked for now as AWS Rekognition may not provide this directly)
      data.Labels.forEach(label => {
        if (label.Name === "Sedan" || label.Name === "SUV" || label.Name === "Truck") {
          carType = label.Name;
        }
        // Mock brand and model here, or use custom training if Rekognition doesn’t provide it
        if (label.Name === "Toyota" || label.Name === "Ford") {
          brand = label.Name;
        }
        if (label.Name === "Camry" || label.Name === "F-150") {
          model = label.Name;
        }
      });
  
      res.json({
        type: carType || "Unknown",
        brand: brand || "Unknown",
        model: model || "Unknown",
      });
    } catch (error) {
      console.error("Error analyzing car image:", error);
      res.status(500).send("Error processing the image");
    }
  });

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});