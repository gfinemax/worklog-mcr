const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testModel() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("No API KEY");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

    console.log("Testing gemini-1.5-flash-8b...");
    try {
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log("Success:", response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}

testModel();
