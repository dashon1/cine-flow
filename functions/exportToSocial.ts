import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { video_id, platform, title, description, tags, visibility } = await req.json();

        if (!video_id || !platform) {
            return Response.json({ error: 'video_id and platform required' }, { status: 400 });
        }

        // Check if user has connected their social account
        const connections = await base44.entities.SocialConnection.filter({
            created_by: user.email,
            platform: platform,
            is_active: true
        });

        if (connections.length === 0) {
            return Response.json({
                error: 'Social account not connected',
                action_required: 'connect_account'
            }, { status: 400 });
        }

        // Create export record
        const exportRecord = await base44.entities.VideoExport.create({
            video_id: video_id,
            platform: platform,
            export_status: 'queued',
            export_settings: {
                title: title || 'Untitled Video',
                description: description || '',
                tags: tags || [],
                visibility: visibility || 'public'
            }
        });

        // In a real implementation, this would trigger the actual upload
        // For now, we just queue it
        return Response.json({
            success: true,
            export_id: exportRecord.id,
            status: 'queued',
            message: `Video queued for export to ${platform}`
        });

    } catch (error) {
        console.error('Export error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});