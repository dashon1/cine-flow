import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { model, prompt, response_json_schema } = body;

        const apiKey = Deno.env.get('OPENROUTER_API_KEY');
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY not configured');
        }

        console.log(`Calling OpenRouter with model: ${model}`);

        const messages = [
            { 
                role: 'system', 
                content: response_json_schema ? 
                    'You are a helpful AI assistant. Always respond with valid JSON only, no markdown, no code blocks.' : 
                    'You are a helpful AI assistant.' 
            },
            { role: 'user', content: prompt }
        ];

        const requestBody = {
            model: model || 'openai/gpt-4o',
            messages: messages,
            temperature: 0.7,
            max_tokens: 4000
        };

        if (response_json_schema) {
            requestBody.response_format = { type: 'json_object' };
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://ai-storyboard.base44.com',
                'X-Title': 'AI Storyboard Generator'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenRouter error:', errorData);
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        if (response_json_schema) {
            try {
                return Response.json(JSON.parse(content));
            } catch (e) {
                console.error('Failed to parse JSON:', content);
                throw new Error(`Failed to parse JSON response: ${e.message}`);
            }
        }

        return Response.json(content);

    } catch (error) {
        console.error('OpenRouter invocation error:', error);
        return Response.json({ 
            error: error.message || 'Failed to invoke OpenRouter',
            details: error.stack
        }, { status: 500 });
    }
});