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

        // Use AI to optimize scene timing and transitions
        const prompt = `Analyze this video storyboard and suggest optimizations:
        
${JSON.stringify(project.storyboard, null, 2)}

Provide suggestions for:
1. Scene durations (optimal timing for viewer engagement)
2. Transition types between scenes
3. Pacing improvements
4. Scene order optimization

Return a JSON object with: { optimizations: [ { scene_index, suggestion, reasoning } ] }`;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: 'object',
                properties: {
                    optimizations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                scene_index: { type: 'number' },
                                suggestion: { type: 'string' },
                                reasoning: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            optimizations: response.optimizations || []
        });

    } catch (error) {
        console.error('Scene optimization error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});