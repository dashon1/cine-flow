import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { scripts, settings } = await req.json();

        if (!scripts || !Array.isArray(scripts) || scripts.length === 0) {
            return Response.json({ error: 'Scripts array required' }, { status: 400 });
        }

        const queuedProjects = [];
        let priority = 5;

        // Create projects and queue them
        for (let i = 0; i < scripts.length; i++) {
            const scriptData = scripts[i];
            
            // Create project
            const project = await base44.entities.Project.create({
                title: scriptData.title || `Batch Video ${i + 1}`,
                script: scriptData.content,
                language: scriptData.language || 'en',
                settings: settings || {},
                status: 'draft'
            });

            // Add to video queue
            const queueItem = await base44.asServiceRole.entities.VideoQueue.create({
                project_id: project.id,
                queue_status: 'pending',
                priority: priority,
                current_stage: 'storyboard'
            });

            queuedProjects.push({
                project_id: project.id,
                position: i + 1,
                status: 'queued'
            });
        }

        return Response.json({
            success: true,
            total_videos: scripts.length,
            queued_projects: queuedProjects
        });

    } catch (error) {
        console.error('Batch generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});