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

        const { userId, updates } = await req.json();

        if (!userId || !updates) {
            return Response.json({ error: 'Missing userId or updates' }, { status: 400 });
        }

        // Use service role to update user
        const updatedUser = await base44.asServiceRole.entities.User.update(userId, updates);

        // Log the action
        await base44.asServiceRole.entities.AuditLog.create({
            action_type: 'user_tier_update',
            action_description: `Updated user ${userId}`,
            target_entity: userId,
            old_value: JSON.stringify({}),
            new_value: JSON.stringify(updates),
            admin_email: user.email
        });

        return Response.json({ 
            success: true,
            user: updatedUser 
        });

    } catch (error) {
        console.error('Admin update user error:', error);
        return Response.json({ 
            error: error.message || 'Failed to update user',
            details: error.stack
        }, { status: 500 });
    }
});