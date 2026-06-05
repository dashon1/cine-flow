import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { project_id, brand_kit_id } = await req.json();

        if (!project_id || !brand_kit_id) {
            return Response.json({ error: 'project_id and brand_kit_id required' }, { status: 400 });
        }

        // Get brand kit
        const brandKit = await base44.entities.BrandKit.get(brand_kit_id);
        
        if (!brandKit) {
            return Response.json({ error: 'Brand kit not found' }, { status: 404 });
        }

        // Get project
        const project = await base44.entities.Project.get(project_id);
        
        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Apply brand settings to project
        const updatedSettings = {
            ...project.settings,
            brand_kit_id: brand_kit_id,
            watermark_url: brandKit.watermark_url,
            watermark_position: brandKit.watermark_position,
            watermark_opacity: brandKit.watermark_opacity,
            brand_colors: brandKit.brand_colors,
            intro_video: brandKit.intro_video_url,
            outro_video: brandKit.outro_video_url
        };

        // Update project
        await base44.entities.Project.update(project_id, {
            settings: updatedSettings
        });

        return Response.json({
            success: true,
            message: `Brand kit "${brandKit.brand_name}" applied successfully`
        });

    } catch (error) {
        console.error('Apply brand kit error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});