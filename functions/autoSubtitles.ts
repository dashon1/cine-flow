import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { project_id } = await req.json();

        if (!project_id) {
            return Response.json({ error: 'project_id required' }, { status: 400 });
        }

        // Get project
        const project = await base44.entities.Project.get(project_id);
        
        if (!project || !project.storyboard) {
            return Response.json({ error: 'Project or storyboard not found' }, { status: 404 });
        }

        // Generate subtitles from storyboard dialogues
        const subtitles = [];
        let currentTime = 0;

        for (const scene of project.storyboard.scenes) {
            if (scene.dialogue) {
                const words = scene.dialogue.split(' ');
                const duration = scene.duration || 5;
                const timePerWord = duration / words.length;

                for (let i = 0; i < words.length; i++) {
                    subtitles.push({
                        start: currentTime + (i * timePerWord),
                        end: currentTime + ((i + 1) * timePerWord),
                        text: words[i]
                    });
                }
                currentTime += duration;
            }
        }

        // Update project with subtitles
        await base44.entities.Project.update(project_id, {
            settings: {
                ...project.settings,
                subtitles: subtitles,
                subtitles_enabled: true
            }
        });

        return Response.json({
            success: true,
            subtitle_count: subtitles.length,
            subtitles: subtitles
        });

    } catch (error) {
        console.error('Subtitle generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});