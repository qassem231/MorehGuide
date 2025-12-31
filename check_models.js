const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function testConnection() {
  console.log("🔍 Reading .env file...");
  
  // 1. Manually read API KEY (No dotenv needed)
  let apiKey = "";
  try {
    const envPath = path.join(__dirname, '.env');
    const envData = fs.readFileSync(envPath, 'utf8');
    const match = envData.match(/GOOGLE_API_KEY=(.*)/);
    if (match && match[1]) apiKey = match[1].trim();
  } catch (e) {
    console.error("❌ Could not read .env file. Please check permissions.");
    return;
  }

  if (!apiKey) {
    console.error("❌ API Key not found in .env");
    return;
  }

  console.log(`🔑 Key found: ${apiKey.substring(0, 5)}...`);
  const genAI = new GoogleGenerativeAI(apiKey);

  // 2. Test the specific model you want to use
  const modelName = "gemini-flash-latest"; 
  console.log(`\n🤖 Testing Model: "${modelName}"...`);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, are you working?");
    const response = result.response.text();
    
    console.log("✅ SUCCESS! The model is working.");
    console.log(`📝 Response: ${response}`);
  } catch (error) {
    console.log("\n❌ TEST FAILED");
    if (error.message.includes("429")) {
      console.log("⚠️ YOU ARE RATE LIMITED (Quota Exceeded).");
    } else if (error.message.includes("404") || error.message.includes("not found")) {
      console.log("🚫 MODEL NOT FOUND. Google says this name does not exist.");
    } else {
      console.log(`⚠️ ERROR DETAILS: ${error.message}`);
    }
  }
}

testConnection();