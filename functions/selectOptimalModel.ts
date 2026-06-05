import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { model_type, category, user_tier } = await req.json();

        if (!model_type) {
            return Response.json({ error: 'model_type is required' }, { status: 400 });
        }

        // Fetch all active models
        const allModels = await base44.entities.AIModelConfig.filter({
            is_active: true
        });

        // Filter by model type
        let filtered = allModels.filter(m => m.model_type === model_type);

        // Filter by category if provided
        if (category) {
            filtered = filtered.filter(m => m.category === category);
        }

        // Filter by user tier access
        const userTier = user_tier || user.plan_type || 'free';
        filtered = filtered.filter(m => m.tier_access.includes(userTier));

        if (filtered.length === 0) {
            return Response.json({ 
                error: 'No models available for the specified criteria',
                model_type,
                category,
                user_tier: userTier
            }, { status: 404 });
        }

        // Prioritization logic: kei_ai > fal_ai > others
        const providerPriority = {
            'kei_ai': 0,
            'fal_ai': 1,
            'openai': 2,
            'google': 3,
            'anthropic': 4,
            'local': 5
        };

        // Sort by provider priority, then by tier level (economy < midsection < top_section)
        const tierPriority = {
            'economy': 0,
            'midsection': 1,
            'top_section': 2
        };

        filtered.sort((a, b) => {
            const providerPriorityA = providerPriority[a.provider] ?? 999;
            const providerPriorityB = providerPriority[b.provider] ?? 999;

            if (providerPriorityA !== providerPriorityB) {
                return providerPriorityA - providerPriorityB;
            }

            // Same provider, sort by tier level
            const tierA = tierPriority[a.tier_level] ?? -1;
            const tierB = tierPriority[b.tier_level] ?? -1;
            return tierA - tierB;
        });

        // Return all available models sorted, with the top one marked as recommended
        const recommendedModel = filtered[0];

        return Response.json({
            recommended: recommendedModel,
            all_available: filtered,
            user_tier: userTier,
            filters_applied: {
                model_type,
                category: category || 'none',
                tier_access: userTier
            }
        });

    } catch (error) {
        console.error('Model selection error:', error);
        return Response.json({ 
            error: error.message || 'Failed to select optimal model',
            details: error.stack
        }, { status: 500 });
    }
});