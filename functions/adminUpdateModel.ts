import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated and is admin
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { modelId, updates } = await req.json();

        if (!modelId || !updates) {
            return Response.json({ error: 'Missing modelId or updates' }, { status: 400 });
        }

        // Use service role to update model
        const updatedModel = await base44.asServiceRole.entities.AIModelConfig.update(modelId, updates);

        // Log the action
        await base44.asServiceRole.entities.AuditLog.create({
            action_type: 'model_config_change',
            action_description: `Updated model ${modelId}`,
            target_entity: modelId,
            old_value: JSON.stringify({}),
            new_value: JSON.stringify(updates),
            admin_email: user.email
        });

        return Response.json({ 
            success: true,
            model: updatedModel 
        });

    } catch (error) {
        console.error('Admin update model error:', error);
        return Response.json({ 
            error: error.message || 'Failed to update model',
            details: error.stack
        }, { status: 500 });
    }
});