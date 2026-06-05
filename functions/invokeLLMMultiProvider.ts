import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { provider, model, prompt, response_json_schema, model_variant } = body;

        console.log('LLM Request:', { provider, model, model_variant, promptLength: prompt?.length });

        if (!prompt) {
            return Response.json({ 
                error: 'Missing required parameter: prompt' 
            }, { status: 400 });
        }

        const actualProvider = provider || 'openai';
        const actualModel = model || 'gpt-4o-mini';

        console.log(`Using provider: ${actualProvider}, model: ${actualModel}, variant: ${model_variant || 'default'}`);

        let result;

        try {
            switch (actualProvider.toLowerCase()) {
                case 'openai':
                    result = await invokeOpenAI(actualModel, prompt, response_json_schema, model_variant);
                    break;
                
                case 'anthropic':
                    result = await invokeAnthropic(actualModel, prompt, response_json_schema);
                    break;
                
                case 'google':
                    result = await invokeGoogle(actualModel, prompt, response_json_schema);
                    break;
                
                case 'openrouter':
                    result = await base44.functions.invoke('invokeOpenRouter', {
                        model: actualModel,
                        prompt: prompt,
                        response_json_schema: response_json_schema
                    });
                    break;
                
                default:
                    console.warn(`Unsupported provider: ${actualProvider}, falling back to OpenAI`);
                    result = await invokeOpenAI('gpt-4o-mini', prompt, response_json_schema);
            }
        } catch (providerError) {
            console.error(`Provider ${actualProvider} failed:`, providerError);
            
            if (actualProvider !== 'openai') {
                console.log('Falling back to OpenAI...');
                result = await invokeOpenAI('gpt-4o-mini', prompt, response_json_schema);
            } else {
                throw providerError;
            }
        }

        return Response.json(result);

    } catch (error) {
        console.error('LLM invocation error:', error);
        return Response.json({ 
            error: error.message || 'Failed to invoke LLM',
            details: error.stack
        }, { status: 500 });
    }
});

async function invokeOpenAI(model, prompt, jsonSchema, variant) {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    // Map our model names to OpenAI's actual model names
    let actualModel = model;
    const requestParams = {
        max_completion_tokens: 4000
    };

    // Handle new GPT-5.2 and GPT-5 mini models
    if (model === 'gpt-5-2') {
        actualModel = 'gpt-5-2';
    } else if (model === 'gpt-5-mini') {
        actualModel = 'gpt-5-mini';
    } else if (model.startsWith('gpt-5')) {
        actualModel = 'gpt-5'; // Fallback for other GPT-5 variants
        
        // Add variant-specific parameters for older GPT-5 models
        switch (variant) {
            case 'instant':
                requestParams.reasoning_effort = 'low';
                break;
            case 'thinking':
                requestParams.reasoning_effort = 'high';
                break;
            case 'pro':
                requestParams.reasoning_effort = 'high';
                requestParams.max_completion_tokens = 8000;
                break;
            case 'auto':
            default:
                requestParams.reasoning_effort = 'medium';
        }
    } else {
        // For older models (GPT-4, etc.), add temperature
        requestParams.temperature = 0.7;
    }

    const messages = [
        { 
            role: 'system', 
            content: jsonSchema ? 
                'You are a helpful AI assistant. Always respond with valid JSON.' : 
                'You are a helpful AI assistant.' 
        },
        { role: 'user', content: prompt }
    ];

    const requestBody = {
        model: actualModel,
        messages: messages,
        ...requestParams
    };

    if (jsonSchema) {
        requestBody.response_format = { type: 'json_object' };
    }

    console.log('Calling OpenAI API with model:', actualModel, 'variant:', variant);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI error:', errorData);
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (jsonSchema) {
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse JSON:', content);
            throw new Error(`Failed to parse JSON response: ${e.message}`);
        }
    }

    return content;
}

async function invokeGoogle(model, prompt, jsonSchema) {
    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
        throw new Error('GOOGLE_API_KEY not configured');
    }

    let fullPrompt = prompt;
    if (jsonSchema) {
        fullPrompt += '\n\nIMPORTANT: Respond with ONLY valid JSON, no markdown, no code blocks, no extra text.';
    }

    console.log('Calling Google Gemini API with model:', model);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: fullPrompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
                topP: 0.95,
                topK: 40
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Google API error:', errorData);
        throw new Error(`Google API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error('Invalid response structure from Gemini API');
    }

    let content = candidate.content.parts[0].text;

    if (content.includes('```json')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (content.includes('```')) {
        content = content.replace(/```\n?/g, '').trim();
    }

    if (jsonSchema) {
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse JSON from Gemini:', content);
            throw new Error(`Failed to parse JSON response from Gemini: ${e.message}`);
        }
    }

    return content;
}

async function invokeAnthropic(model, prompt, jsonSchema) {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Map our model names to Anthropic's actual API model names
    let actualModel = model;
    if (model === 'claude-opus-4-5') {
        actualModel = 'claude-opus-4-5';
    } else if (model === 'claude-sonnet-4-5') {
        actualModel = 'claude-sonnet-4-5';
    }

    let systemPrompt = 'You are a helpful AI assistant.';
    if (jsonSchema) {
        systemPrompt += ' Always respond with valid JSON only, no markdown, no code blocks, no extra text.';
    }

    console.log('Calling Anthropic API with model:', actualModel);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: actualModel,
            max_tokens: 4000,
            system: systemPrompt,
            messages: [
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('Anthropic error:', errorData);
        throw new Error(`Anthropic API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    if (jsonSchema) {
        try {
            let cleanContent = content;
            if (content.includes('```json')) {
                cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            }
            return JSON.parse(cleanContent);
        } catch (e) {
            console.error('Failed to parse JSON:', content);
            throw new Error(`Failed to parse JSON response: ${e.message}`);
        }
    }

    return content;
}