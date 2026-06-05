import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// You'll need to add CREATOMATE_API_KEY to secrets
const CREATOMATE_API_KEY = Deno.env.get("CREATOMATE_API_KEY");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scenes, settings, template_id } = await req.json();

        console.log('Generating video with Creatomate...');

        // Build Creatomate render request
        const renderData = {
            template_id: template_id || 'default-slideshow',
            modifications: {
                'Video-Width': settings.resolution === '1080p' ? 1920 : 1280,
                'Video-Height': settings.resolution === '1080p' ? 1080 : 720,
                scenes: scenes.map(scene => ({
                    image: scene.image_url,
                    text: scene.dialogue || '',
                    duration: scene.duration || 5
                }))
            }
        };

        // Submit render
        const response = await fetch('https://api.creatomate.com/v1/renders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(renderData)
        });

        if (!response.ok) {
            throw new Error(`Creatomate failed: ${response.status}`);
        }

        const result = await response.json();
        const renderId = result[0].id;

        // Poll for completion
        let videoUrl = null;
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds

            const statusResponse = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
                headers: {
                    'Authorization': `Bearer ${CREATOMATE_API_KEY}`
                }
            });

            const statusData = await statusResponse.json();

            if (statusData.status === 'succeeded') {
                videoUrl = statusData.url;
                break;
            } else if (statusData.status === 'failed') {
                throw new Error('Video rendering failed');
            }
        }

        if (!videoUrl) {
            throw new Error('Video rendering timeout');
        }

        return Response.json({
            video_url: videoUrl,
            render_id: renderId
        });

    } catch (error) {
        console.error('Creatomate error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});