import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt, model, size, quality, reference_image_url } = await req.json();

        if (!prompt) {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiKey = Deno.env.get("OPENAI_API_KEY");
        
        if (!apiKey) {
            return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
        }

        const requestBody = {
            model: model || 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: size || '1024x1024',
            quality: quality || 'standard'
        };

        console.log('Calling DALL-E with:', requestBody);

        const response = await fetch(
            'https://api.openai.com/v1/images/generations',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const result = await response.json();
        const imageUrl = result.data?.[0]?.url;

        if (!imageUrl) {
            throw new Error('No image URL in response');
        }

        return Response.json({ 
            url: imageUrl,
            metadata: result
        });

    } catch (error) {
        console.error('OpenAI image generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});