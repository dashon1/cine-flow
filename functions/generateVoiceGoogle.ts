import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        let user = null;
        try {
            user = await base44.auth.me();
        } catch (_e) {
            // allow unauthenticated calls for TTS generation
        }

        const { text, voice_name, language_code } = await req.json();

        if (!text) {
            return Response.json({ error: 'Missing required parameter: text' }, { status: 400 });
        }

        const apiKey = Deno.env.get('GOOGLE_API_KEY');
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY not configured');
        }

        // Default to Neural2 English voice if not specified
        const voiceName = voice_name || 'en-US-Neural2-C';
        const languageCode = language_code || 'en-US';

        console.log(`Generating Google TTS: ${voiceName}, Language: ${languageCode}`);

        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: { text },
                    voice: {
                        languageCode,
                        name: voiceName
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: 1.0,
                        pitch: 0.0,
                        volumeGainDb: 0.0
                    }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google TTS API error:', errorText);
            throw new Error(`Google TTS API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.audioContent) {
            throw new Error('No audio content in response');
        }

        // Convert base64 audio to Blob
        const audioBytes = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });

        return new Response(audioBlob, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBlob.size.toString()
            }
        });

    } catch (error) {
        console.error('Google TTS generation error:', error);
        return Response.json({ 
            error: error.message || 'Failed to generate voice' 
        }, { status: 500 });
    }
});