import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt, model, aspect_ratio } = await req.json();

        if (!prompt) {
            return Response.json({ error: 'Missing required parameter: prompt' }, { status: 400 });
        }

        const apiKey = Deno.env.get('GOOGLE_API_KEY');
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY not configured');
        }

        // Map aspect ratio to Google's format
        let imagenAspectRatio = '1:1';
        if (aspect_ratio === '16:9') imagenAspectRatio = '16:9';
        else if (aspect_ratio === '9:16') imagenAspectRatio = '9:16';
        else if (aspect_ratio === '4:3') imagenAspectRatio = '4:3';

        // Determine which model to use
        const modelName = model && model.includes('3.0') ? 'imagen-3.0-generate-001' : 'imagen-2.5-generate-001';

        console.log(`Generating image with Google ${modelName}, aspect ratio: ${imagenAspectRatio}`);

        // Using Vertex AI Imagen API
        const projectId = Deno.env.get('GOOGLE_PROJECT_ID') || 'default-project';
        const location = 'us-central1';
        
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:predict`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instances: [
                    {
                        prompt: prompt
                    }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: imagenAspectRatio,
                    safetyFilterLevel: 'block_some',
                    personGeneration: 'allow_adult'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Imagen API error:', errorText);
            throw new Error(`Google Imagen API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.predictions || data.predictions.length === 0) {
            throw new Error('No image generated');
        }

        // The response contains base64-encoded image
        const imageBase64 = data.predictions[0].bytesBase64Encoded;
        
        if (!imageBase64) {
            throw new Error('No image data in response');
        }

        // Upload the image to Base44 storage
        const imageBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
        const imageBlob = new Blob([imageBytes], { type: 'image/png' });
        
        const uploadResult = await base44.integrations.Core.UploadFile({ 
            file: imageBlob 
        });

        return Response.json({ 
            url: uploadResult.file_url || uploadResult.url,
            model: modelName
        });

    } catch (error) {
        console.error('Google Imagen generation error:', error);
        return Response.json({ 
            error: error.message || 'Failed to generate image',
            details: error.stack
        }, { status: 500 });
    }
});