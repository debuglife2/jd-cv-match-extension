// Test Azure OpenAI connection locally
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env file
function loadEnv() {
    const envPath = join(__dirname, '../.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};

    envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
        }
    });

    return env;
}

const env = loadEnv();

console.log('Environment variables loaded:');
console.log('Endpoint:', env.openai);
console.log('Deployment:', env.openai_deployment);
console.log('API Key:', env.openai_key ? `${env.openai_key.substring(0, 10)}...` : 'NOT SET');
console.log('\n---\n');

// Test connection
async function testConnection() {
    const apiVersion = '2024-04-01-preview';
    const url = `${env.openai}/openai/deployments/${env.openai_deployment}/chat/completions?api-version=${apiVersion}`;

    console.log('Testing connection to:', url);
    console.log('\n---\n');

    const headers = {
        'Content-Type': 'application/json',
        'api-key': env.openai_key,
        'Ocp-Apim-Subscription-Key': env.openai_key
    };

    console.log('Headers being sent:');
    console.log('  Content-Type:', headers['Content-Type']);
    console.log('  api-key:', headers['api-key'] ? `${headers['api-key'].substring(0, 10)}...` : 'NOT SET');
    console.log('  Ocp-Apim-Subscription-Key:', headers['Ocp-Apim-Subscription-Key'] ? `${headers['Ocp-Apim-Subscription-Key'].substring(0, 10)}...` : 'NOT SET');
    console.log('\n---\n');

    const body = {
        messages: [
            { role: 'user', content: 'Hello, this is a test message. Please respond with "Connection successful!"' }
        ],
        max_completion_tokens: 50
    };

    try {
        console.log('Sending request...\n');

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        console.log('Response status:', response.status, response.statusText);
        console.log('\n---\n');

        const responseText = await response.text();

        if (!response.ok) {
            console.error('❌ Connection FAILED');
            console.error('Error response:', responseText);
            return;
        }

        console.log('✅ Connection SUCCESSFUL!');
        console.log('\nResponse:', responseText);

        const data = JSON.parse(responseText);
        if (data.choices && data.choices[0]) {
            console.log('\n---\n');
            console.log('AI Response:', data.choices[0].message.content);
        }

    } catch (error) {
        console.error('❌ Connection FAILED');
        console.error('Error:', error.message);
    }
}

testConnection();
