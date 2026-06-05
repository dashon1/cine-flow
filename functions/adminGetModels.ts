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

        // Get all AI models
        const allModels = await base44.asServiceRole.entities.AIModelConfig.list('-updated_date', 100);

        return Response.json({ 
            models: allModels,
            count: allModels.length 
        });

    } catch (error) {
        console.error('Admin get models error:', error);
        return Response.json({ 
            error: error.message || 'Failed to fetch models',
            details: error.stack
        }, { status: 500 });
    }
});