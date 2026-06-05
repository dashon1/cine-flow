import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        let user = null;
        try {
            user = await base44.auth.me();
        } catch (_e) {
            // ignore - allow unauthenticated calls for TTS generation
        }

        const body = await req.json();
        const text = body.text;
        if (!text) {
            return Response.json({ error: 'Text is required' }, { status: 400 });
        }
        const voiceId = body.voice_id ?? body.voiceId;
        const modelId = body.model_id ?? body.modelId;
        const languageCode = body.language_code ?? body.languageCode;

        const useTestKey = !!(body.use_test_key);
        const useAltKey = !!(body.use_alt_key);
        const testKey = Deno.env.get("ELEVENLABS_API_KEY_TEST");
        const primaryKey = Deno.env.get("ELEVENLABS_API_KEY");
        const altKey = Deno.env.get("ELEVENLABS_API_KEY_ALT");

        let apiKey = '';
        let keySource = 'primary';

        if (useTestKey) {
            if (!testKey) {
                return Response.json({ error: 'Test ElevenLabs API key not configured' }, { status: 400 });
            }
            apiKey = testKey;
            keySource = 'test';
        } else if (useAltKey) {
            if (!altKey) {
                return Response.json({ error: 'Alternate ElevenLabs API key not configured' }, { status: 400 });
            }
            apiKey = altKey;
            keySource = 'alt';
        } else {
            apiKey = primaryKey || altKey || '';
            keySource = primaryKey ? 'primary' : (altKey ? 'alt' : 'none');
        }

        if (!apiKey) {
            return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
        }

        // Default to multilingual v2 model
        const selectedModel = modelId || 'eleven_multilingual_v2';
        const selectedVoice = voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default voice (Sarah)

        const makeRequest = async (key) => {
            return fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': key
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: selectedModel,
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                            style: 0.0,
                            use_speaker_boost: true
                        }
                    })
                }
            );
        };

        let response = await makeRequest(apiKey);

        if (!response.ok && (response.status === 401 || response.status === 403) && keySource === 'primary' && altKey && !useTestKey && !useAltKey) {
            // Fallback to alternate key automatically if primary is unauthorized
            response = await makeRequest(altKey);
            keySource = 'alt';
        }

        if (!response.ok) {
            const error = await response.text();
            console.error('ElevenLabs API error:', error);
            return Response.json({ 
                error: `ElevenLabs API error: ${response.status}`,
                details: error 
            }, { status: response.status });
        }

        const audioArrayBuffer = await response.arrayBuffer();

        if (!audioArrayBuffer || audioArrayBuffer.byteLength === 0) {
            return Response.json({ 
                error: 'Empty audio response from ElevenLabs' 
            }, { status: 500 });
        }

        const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/mpeg' });

        return new Response(audioBlob, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBlob.size.toString()
            }
        });

    } catch (error) {
        console.error('ElevenLabs generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});