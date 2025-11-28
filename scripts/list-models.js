require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function listModels() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        fs.writeFileSync('model_list.txt', 'GOOGLE_API_KEY not found');
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        let output = '';
        if (data.models) {
            output += '--- Available Models ---\n';
            data.models.forEach(m => {
                output += `Name: ${m.name}\n`;
                output += `Methods: ${m.supportedGenerationMethods ? m.supportedGenerationMethods.join(', ') : 'None'}\n`;
                output += '---\n';
            });
        } else {
            output += 'No models found. Response: ' + JSON.stringify(data, null, 2);
        }

        fs.writeFileSync('model_list.txt', output);
        console.log('Output written to model_list.txt');

    } catch (error) {
        fs.writeFileSync('model_list.txt', 'Error: ' + error.message);
    }
}

listModels();
