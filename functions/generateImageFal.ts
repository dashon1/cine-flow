import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt, modelEndpoint, parameters, reference_image_url } = await req.json();

        if (!prompt) {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const apiKey = Deno.env.get("FAL_API_KEY");
        
        if (!apiKey) {
            return Response.json({ error: 'FAL.AI API key not configured' }, { status: 500 });
        }

        // Default to FLUX pro model
        const endpoint = modelEndpoint || 'fal-ai/flux-pro';

        const defaultParams = {
            prompt: prompt,
            image_size: parameters?.image_size || 'landscape_16_9',
            num_inference_steps: parameters?.num_inference_steps || 28,
            guidance_scale: parameters?.guidance_scale || 3.5,
            num_images: 1,
            enable_safety_checker: true
        };

        // Add reference image for style locking if provided
        if (reference_image_url) {
            defaultParams.image_url = reference_image_url;
            defaultParams.strength = parameters?.reference_strength ?? 0.85; // Default to 0.85 for strong influence
        }

        const response = await fetch(
            `https://fal.run/${endpoint}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(defaultParams)
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`FAL.AI API error: ${error}`);
        }

        const result = await response.json();
        
        // FAL.AI returns images array
        const imageUrl = result.images?.[0]?.url || result.image?.url;

        if (!imageUrl) {
            throw new Error('No image URL in response');
        }

        return Response.json({ 
            url: imageUrl,
            seed: result.seed,
            metadata: result
        });

    } catch (error) {
        console.error('FAL.AI generation error:', error);
        return Response.json({ 
            error: error.message || 'FAL.AI generation failed',
            details: error.stack
        }, { status: 500 });
    }
});