const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("GOOGLE_API_KEY not found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        // For listing models, we don't need a specific model instance, 
        // but the SDK structure usually requires getting a model to do operations.
        // However, listModels is not directly exposed on the main class in some versions.
        // Let's try to infer available models by testing a simple generation with a fallback.

        console.log("Testing common model names...");
        const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-pro"];

        for (const modelName of modelsToTest) {
            console.log(`Testing ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log(`✅ ${modelName} is WORKING!`);
                return; // Found a working model
            } catch (error) {
                console.log(`❌ ${modelName} failed: ${error.message.split('\n')[0]}`);
            }
        }

        console.log("All common models failed.");
    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
