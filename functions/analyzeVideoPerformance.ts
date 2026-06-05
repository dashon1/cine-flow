import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { video_id, timeframe } = await req.json();

        if (!video_id) {
            return Response.json({ error: 'video_id required' }, { status: 400 });
        }

        // Get video analytics
        const analytics = await base44.entities.VideoAnalytics.filter({ video_id });
        
        if (analytics.length === 0) {
            return Response.json({
                summary: { total_views: 0, avg_completion: 0 },
                insights: []
            });
        }

        const stats = analytics[0];
        const insights = [];

        // Analyze completion rate
        if (stats.completion_rate > 80) {
            insights.push({
                type: 'success',
                message: 'Excellent engagement! High completion rate.',
                recommendation: 'This content format works well. Consider creating similar videos.'
            });
        } else if (stats.completion_rate < 40) {
            insights.push({
                type: 'warning',
                message: 'Low completion rate detected.',
                recommendation: 'Try shorter videos or more engaging openings to hook viewers.'
            });
        }

        // Analyze views
        if (stats.views_count > 100) {
            insights.push({
                type: 'success',
                message: 'Great reach! Your video is performing well.',
                recommendation: 'Consider promoting similar content to capitalize on this success.'
            });
        } else if (stats.views_count < 10) {
            insights.push({
                type: 'info',
                message: 'Limited views so far.',
                recommendation: 'Share on more platforms or optimize your title and thumbnail.'
            });
        }

        // Analyze shares
        if (stats.share_count > 0) {
            insights.push({
                type: 'success',
                message: 'Your content is being shared!',
                recommendation: 'This indicates strong audience connection. Create follow-up content.'
            });
        }

        return Response.json({
            summary: {
                total_views: stats.views_count || 0,
                avg_completion: Math.round(stats.completion_rate || 0)
            },
            insights: insights
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});