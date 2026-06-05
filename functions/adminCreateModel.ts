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

        const modelData = await req.json();

        if (!modelData.model_name || !modelData.provider || !modelData.model_type) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create new model
        const newModel = await base44.asServiceRole.entities.AIModelConfig.create(modelData);

        // Log the action
        await base44.asServiceRole.entities.AuditLog.create({
            action_type: 'model_config_change',
            action_description: `Created new model: ${modelData.model_name}`,
            target_entity: newModel.id,
            old_value: JSON.stringify({}),
            new_value: JSON.stringify(modelData),
            admin_email: user.email
        });

        return Response.json({ 
            success: true,
            model: newModel 
        });

    } catch (error) {
        console.error('Admin create model error:', error);
        return Response.json({ 
            error: error.message || 'Failed to create model',
            details: error.stack
        }, { status: 500 });
    }
});