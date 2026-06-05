import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// You'll need to add JSON2VIDEO_API_KEY to secrets
const JSON2VIDEO_API_KEY = Deno.env.get("JSON2VIDEO_API_KEY");

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scenes, settings } = await req.json();

        console.log('Generating video with Json2video...');

        // Build Json2video template
        const videoData = {
            resolution: settings.resolution === '1080p' ? 'full_hd' : 'hd',
            quality: 'high',
            fps: 30,
            scenes: scenes.map(scene => ({
                duration: scene.duration || 5,
                elements: [
                    {
                        type: 'image',
                        src: scene.image_url,
                        width: '100%',
                        height: '100%'
                    },
                    ...(scene.dialogue ? [{
                        type: 'text',
                        text: scene.dialogue,
                        position: 'bottom',
                        background: 'rgba(0,0,0,0.7)',
                        color: '#ffffff',
                        fontSize: '24px'
                    }] : [])
                ]
            }))
        };

        // Submit to Json2video
        const response = await fetch('https://api.json2video.com/v2/movies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': JSON2VIDEO_API_KEY
            },
            body: JSON.stringify(videoData)
        });

        if (!response.ok) {
            throw new Error(`Json2video failed: ${response.status}`);
        }

        const result = await response.json();
        const projectId = result.project_id;

        // Poll for completion
        let videoUrl = null;
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds

            const statusResponse = await fetch(`https://api.json2video.com/v2/movies/${projectId}`, {
                headers: {
                    'x-api-key': JSON2VIDEO_API_KEY
                }
            });

            const statusData = await statusResponse.json();

            if (statusData.status === 'finished') {
                videoUrl = statusData.url;
                break;
            } else if (statusData.status === 'error') {
                throw new Error('Video generation failed');
            }
        }

        if (!videoUrl) {
            throw new Error('Video generation timeout');
        }

        return Response.json({
            video_url: videoUrl,
            project_id: projectId
        });

    } catch (error) {
        console.error('Json2video error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});