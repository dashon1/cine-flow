import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { prompt, model, image_size } = body;

        const apiKey = Deno.env.get('PIAPI_API_KEY');
        if (!apiKey) {
            throw new Error('PIAPI_API_KEY not configured');
        }

        console.log(`Calling Piapi with model: ${model || 'flux-pro'}`);

        // Piapi typically uses a task-based system similar to FAL.AI
        const response = await fetch('https://api.piapi.ai/v1/task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({
                model: model || 'flux-pro',
                prompt: prompt,
                image_size: image_size || '1024x1024',
                num_images: 1
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Piapi error:', errorData);
            throw new Error(`Piapi API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        
        // Poll for result if task_id is returned
        if (data.task_id) {
            let attempts = 0;
            const maxAttempts = 30;
            
            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const resultResponse = await fetch(`https://api.piapi.ai/v1/task/${data.task_id}`, {
                    headers: {
                        'X-API-Key': apiKey
                    }
                });
                
                const resultData = await resultResponse.json();
                
                if (resultData.status === 'completed' && resultData.output?.image_url) {
                    return Response.json({ url: resultData.output.image_url });
                }
                
                if (resultData.status === 'failed') {
                    throw new Error('Piapi generation failed');
                }
                
                attempts++;
            }
            
            throw new Error('Piapi generation timeout');
        }

        // If direct URL returned
        if (data.image_url) {
            return Response.json({ url: data.image_url });
        }

        throw new Error('Unexpected Piapi response format');

    } catch (error) {
        console.error('Piapi invocation error:', error);
        return Response.json({ 
            error: error.message || 'Failed to invoke Piapi',
            details: error.stack
        }, { status: 500 });
    }
});