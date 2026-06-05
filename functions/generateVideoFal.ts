import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const FAL_API_KEY = Deno.env.get("FAL_API_KEY");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            prompt, 
            image_url, 
            model = 'fal-ai/runway-gen3/turbo/image-to-video',
            duration = 5,
            aspect_ratio = '16:9'
        } = await req.json();

        console.log('Generating video with FAL.AI:', { model, prompt, image_url, duration });

        let endpoint;
        let requestBody;

        // Configure based on model type
        if (model.includes('runway-gen3')) {
            // Runway Gen-3 - image-to-video
            endpoint = 'https://queue.fal.run/fal-ai/runway-gen3/turbo/image-to-video';
            requestBody = {
                prompt: prompt || 'Dynamic camera movement, cinematic',
                image_url: image_url,
                duration: duration
            };
        } else if (model.includes('minimax')) {
            // Minimax video-01 - text-to-video
            endpoint = 'https://queue.fal.run/fal-ai/minimax/video-01';
            requestBody = {
                prompt: prompt,
                duration: duration
            };
        } else if (model.includes('kling')) {
            // Kling video - image-to-video
            endpoint = 'https://queue.fal.run/fal-ai/kling-video/v1/standard/image-to-video';
            requestBody = {
                prompt: prompt || 'Smooth camera movement',
                image_url: image_url,
                duration: duration,
                aspect_ratio: aspect_ratio
            };
        } else {
            // Default to Runway
            endpoint = 'https://queue.fal.run/fal-ai/runway-gen3/turbo/image-to-video';
            requestBody = {
                prompt: prompt || 'Dynamic camera movement',
                image_url: image_url,
                duration: duration
            };
        }

        // Submit request to FAL.AI
        const submitResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!submitResponse.ok) {
            const errorText = await submitResponse.text();
            console.error('FAL.AI submit error:', errorText);
            throw new Error(`FAL.AI submission failed: ${submitResponse.status}`);
        }

        const submitData = await submitResponse.json();
        const requestId = submitData.request_id;
        console.log('Video generation queued:', requestId);

        // Poll for results
        const statusEndpoint = `https://queue.fal.run/fal-ai/runway-gen3/turbo/image-to-video/requests/${requestId}/status`;
        let result = null;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max (5 second intervals)

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            const statusResponse = await fetch(statusEndpoint, {
                headers: {
                    'Authorization': `Key ${FAL_API_KEY}`
                }
            });

            if (!statusResponse.ok) {
                console.error('Status check failed:', statusResponse.status);
                attempts++;
                continue;
            }

            const statusData = await statusResponse.json();
            console.log('Status check:', statusData.status);

            if (statusData.status === 'COMPLETED') {
                result = statusData.response_url;
                break;
            } else if (statusData.status === 'FAILED') {
                throw new Error('Video generation failed');
            }

            attempts++;
        }

        if (!result) {
            throw new Error('Video generation timeout');
        }

        // Fetch the actual result
        const resultResponse = await fetch(result, {
            headers: {
                'Authorization': `Key ${FAL_API_KEY}`
            }
        });

        const resultData = await resultResponse.json();
        console.log('Video generation complete:', resultData);

        return Response.json({
            video_url: resultData.video?.url || resultData.video_url,
            duration: duration,
            model: model
        });

    } catch (error) {
        console.error('Video generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});