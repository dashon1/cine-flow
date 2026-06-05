import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { template_id, script, language } = await req.json();

        if (!template_id || !script) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get template
        const template = await base44.asServiceRole.entities.VideoTemplate.get(template_id);
        
        if (!template) {
            return Response.json({ error: 'Template not found' }, { status: 404 });
        }

        // Update usage count
        await base44.asServiceRole.entities.VideoTemplate.update(template_id, {
            usage_count: (template.usage_count || 0) + 1
        });

        // Create project with template settings
        const project = await base44.entities.Project.create({
            title: `${template.template_name} - ${new Date().toLocaleDateString()}`,
            script: script,
            language: language || 'en',
            settings: {
                ...template.default_settings,
                template_id: template_id,
                template_name: template.template_name
            },
            status: 'draft'
        });

        return Response.json({
            success: true,
            project_id: project.id,
            template_name: template.template_name
        });

    } catch (error) {
        console.error('Template generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});