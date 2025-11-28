async function testApi() {
    try {
        console.log('Testing /api/post-summary...');
        const response = await fetch('http://localhost:3000/api/post-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: 'Test Post',
                category: 'General',
                content: 'This is a test content to verify if the AI summary API is working correctly. It should be summarized by the Gemini API.'
            }),
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testApi();
