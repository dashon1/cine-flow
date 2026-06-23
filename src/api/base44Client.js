// Base44 -> self-hosted Supabase compatibility shim.
// Implements the Base44 SDK surface the app uses (entities / auth / integrations /
// functions / appLogs) backed by a generic jsonb record store on our VPS Supabase.
// Swap-in replacement: the rest of the app keeps calling base44.* unchanged.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const APP = import.meta.env.VITE_APP_NAME || 'cutsflow';
const TABLE = 'base44_records';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// DB row -> flat Base44-style record (fields at top level + id/created_date)
function toRecord(row) {
  if (!row) return row;
  const { id, data, created_at, updated_at, created_by } = row;
  return {
    id,
    ...(data || {}),
    created_by: created_by ?? (data ? data.created_by : undefined),
    created_date: created_at,
    updated_date: updated_at,
    created_at,
    updated_at,
  };
}

function stripMeta(obj = {}) {
  const { id, created_date, updated_date, created_at, updated_at, ...rest } = obj;
  return rest;
}

function applySort(q, sort) {
  if (!sort) return q.order('created_at', { ascending: false });
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  if (['created_date', 'created_at'].includes(field)) return q.order('created_at', { ascending: !desc });
  if (['updated_date', 'updated_at'].includes(field)) return q.order('updated_at', { ascending: !desc });
  // best-effort sort on a jsonb field
  return q.order(`data->>${field}`, { ascending: !desc });
}

function entityApi(entity) {
  const sel = () => supabase.from(TABLE).select('*').eq('app', APP).eq('entity', entity);
  return {
    async list(sort, limit) {
      let q = applySort(sel(), sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(toRecord);
    },
    async filter(query = {}, sort, limit) {
      let q = sel();
      for (const [k, v] of Object.entries(query || {})) {
        if (k === 'id') q = q.eq('id', v);
        else if (k === 'created_by') q = q.eq('created_by', v);
        else q = q.eq(`data->>${k}`, typeof v === 'string' ? v : String(v));
      }
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(toRecord);
    },
    async get(id) {
      const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
      if (error) throw error;
      return toRecord(data);
    },
    async create(obj = {}) {
      const payload = stripMeta(obj);
      const created_by = obj.created_by ?? null;
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ app: APP, entity, data: payload, created_by })
        .select('*')
        .single();
      if (error) throw error;
      return toRecord(data);
    },
    async bulkCreate(arr = []) {
      const rows = (arr || []).map((o) => ({ app: APP, entity, data: stripMeta(o), created_by: o.created_by ?? null }));
      const { data, error } = await supabase.from(TABLE).insert(rows).select('*');
      if (error) throw error;
      return (data || []).map(toRecord);
    },
    async update(id, obj = {}) {
      const patch = stripMeta(obj);
      const { data: cur } = await supabase.from(TABLE).select('data').eq('id', id).single();
      const merged = { ...((cur && cur.data) || {}), ...patch };
      const { data, error } = await supabase.from(TABLE).update({ data: merged }).eq('id', id).select('*').single();
      if (error) throw error;
      return toRecord(data);
    },
    async delete(id) {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  };
}

// Wrap AIModelConfig to merge DB records with BUILTIN_MODELS.
// DB records take precedence (same id wins); builtins fill any gaps.
// This ensures LLM/image/TTS models always appear even when only video
// models have been seeded into the DB.
const _entityProxy = new Proxy({}, {
  get(_t, name) {
    if (typeof name !== 'string') return undefined;
    if (name === 'AIModelConfig') {
      const base = entityApi('AIModelConfig');
      return {
        ...base,
        async list(sort, limit) {
          const rows = await base.list(sort, limit);
          const dbIds = new Set(rows.map(r => r.id));
          return [...rows, ...BUILTIN_MODELS.filter(m => !dbIds.has(m.id))];
        },
        async filter(query = {}, sort, limit) {
          const rows = await base.filter(query, sort, limit);
          const dbIds = new Set(rows.map(r => r.id));
          let builtins = BUILTIN_MODELS.filter(m => !dbIds.has(m.id));
          for (const [k, v] of Object.entries(query || {})) builtins = builtins.filter(m => String(m[k] ?? '') === String(v));
          return [...rows, ...builtins];
        },
      };
    }
    return entityApi(name);
  },
});
const entities = _entityProxy;

// Hardcoded AI models — shown when the DB has no AIModelConfig records yet.
const GUEST_KEY = 'cutsflow_guest_id';
function getOrCreateGuest() {
  let gid = localStorage.getItem(GUEST_KEY);
  if (!gid) { gid = `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`; localStorage.setItem(GUEST_KEY, gid); }
  return { id: gid, email: `${gid}@guest.local`, full_name: 'Creator', role: 'anon', plan_type: 'free' };
}

const BUILTIN_MODELS = [
  // LLM — FREE tier (verified working via OpenRouter /models + live test)
  { id: 'llm-gpt-oss-120b-free', model_name: 'openai/gpt-oss-120b:free', provider: 'openrouter', model_type: 'llm', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'excellent', description: '🆓 GPT OSS 120B — free, reliable (recommended)', estimated_time: '6-12s' },
  { id: 'llm-nemotron-550b-free', model_name: 'nvidia/nemotron-3-ultra-550b-a55b:free', provider: 'openrouter', model_type: 'llm', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'ultra', description: '🆓 Nemotron Ultra 550B — NVIDIA free, very capable', estimated_time: '10-20s' },
  { id: 'llm-hermes-405b-free', model_name: 'nousresearch/hermes-3-llama-3.1-405b:free', provider: 'openrouter', model_type: 'llm', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'ultra', description: '🆓 Hermes 3 405B — free, premium quality', estimated_time: '8-15s' },
  { id: 'llm-llama-70b-free', model_name: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'openrouter', model_type: 'llm', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'excellent', description: '🆓 Llama 3.3 70B — free, great quality', estimated_time: '5-10s' },
  { id: 'llm-llama-3b-free', model_name: 'meta-llama/llama-3.2-3b-instruct:free', provider: 'openrouter', model_type: 'llm', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'basic', description: '🆓 Llama 3.2 3B — free, fastest option', estimated_time: '2-4s' },
  // LLM — PAID: Claude (best quality)
  { id: 'llm-claude-sonnet', model_name: 'anthropic/claude-sonnet-4-6', provider: 'openrouter', model_type: 'llm', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Claude Sonnet 4.6 — best storyboards (recommended)', estimated_time: '5-8s' },
  { id: 'llm-claude-opus', model_name: 'anthropic/claude-opus-4-8', provider: 'openrouter', model_type: 'llm', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Claude Opus 4.8 — most powerful, richest narratives', estimated_time: '8-15s' },
  { id: 'llm-gpt4o', model_name: 'gpt-4o', provider: 'openai', model_type: 'llm', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'GPT-4o — solid fallback', estimated_time: '5-10s' },
  { id: 'llm-gpt4o-mini', model_name: 'gpt-4o-mini', provider: 'openai', model_type: 'llm', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'good', description: 'GPT-4o mini — fast & affordable', estimated_time: '3-5s' },
  // Image
  { id: 'img-flux-schnell', model_name: 'fal-ai/flux/schnell', provider: 'fal_ai', model_type: 'image', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'good', description: 'Fastest image gen', estimated_time: '3-5s' },
  { id: 'img-flux-dev', model_name: 'fal-ai/flux/dev', provider: 'fal_ai', model_type: 'image', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Quality + speed balance', estimated_time: '8-10s' },
  { id: 'img-sdxl-lightning', model_name: 'fal-ai/fast-lightning-sdxl', provider: 'fal_ai', model_type: 'image', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'good', description: 'Sub-second generations', estimated_time: '1-2s' },
  // Video — Cheap (5 models)
  { id: 'vid-wan-i2v', name: 'Wan 2.6 I2V', model_name: 'fal-ai/wan-i2v/v1.3', provider: 'fal_ai', model_type: 'video', video_tier: 'cheap', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'good', description: 'Wan 2.6 — fast 1080p, most affordable', estimated_time: '1-2 min' },
  { id: 'vid-ltx', name: 'LTX Video', model_name: 'fal-ai/ltx-video', provider: 'fal_ai', model_type: 'video', video_tier: 'cheap', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'good', description: 'LTX — ultra-fast generation', estimated_time: '30-60s' },
  { id: 'vid-cogvideo', name: 'CogVideoX 5B', model_name: 'fal-ai/cogvideox-5b', provider: 'fal_ai', model_type: 'video', video_tier: 'cheap', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'good', description: 'CogVideoX — smooth natural motion', estimated_time: '1-2 min' },
  { id: 'vid-minimax', name: 'Minimax V1', model_name: 'fal-ai/minimax/video-01', provider: 'fal_ai', model_type: 'video', video_tier: 'cheap', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Minimax V1 — reliable, good motion', estimated_time: '1-2 min', is_default_for_tier: { pro: true } },
  { id: 'vid-haiper', name: 'Haiper V2.5', model_name: 'fal-ai/haiper-video-v2.5', provider: 'fal_ai', model_type: 'video', video_tier: 'cheap', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Haiper V2.5 — natural fluid motion', estimated_time: '1-2 min' },
  // Video — Standard (7 models, 2 with audio)
  { id: 'vid-kling15std', name: 'Kling 1.5 Standard', model_name: 'fal-ai/kling-video/v1.5/standard/image-to-video', provider: 'fal_ai', model_type: 'video', video_tier: 'standard', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Kling 1.5 Std — cinematic camera moves', estimated_time: '2-3 min' },
  { id: 'vid-runway-gen3', name: 'Runway Gen3 Turbo', model_name: 'fal-ai/runway-gen3/turbo/image-to-video', provider: 'fal_ai', model_type: 'video', video_tier: 'standard', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Runway Gen3 — Hollywood-grade motion', estimated_time: '2-4 min' },
  { id: 'vid-luma', name: 'Luma Dream Machine', model_name: 'fal-ai/luma-dream-machine', provider: 'fal_ai', model_type: 'video', video_tier: 'standard', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Luma — dreamy smooth motion', estimated_time: '2-3 min' },
  { id: 'vid-veo2', name: 'Google Veo 2', model_name: 'fal-ai/veo2', provider: 'fal_ai', model_type: 'video', video_tier: 'standard', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: "Veo 2 — Google's photorealistic AI video", estimated_time: '3-5 min' },
  { id: 'vid-kling16std', name: 'Kling 1.6 Standard', model_name: 'fal-ai/kling-video/v1.6/standard/image-to-video', provider: 'fal_ai', model_type: 'video', video_tier: 'standard', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Kling 1.6 Std — improved motion quality', estimated_time: '2-3 min' },
  { id: 'vid-minimax-live', name: 'Minimax V1 Live 🔊', model_name: 'fal-ai/minimax/video-01-live', provider: 'fal_ai', model_type: 'video', video_tier: 'standard', has_audio: true, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Minimax Live — video WITH generated audio/sound', estimated_time: '2-4 min' },
  { id: 'vid-seadance', name: 'Seadance (ByteDance) 🔊', model_name: 'fal-ai/seadance-1.0', provider: 'fal_ai', model_type: 'video', video_tier: 'standard', has_audio: true, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Seadance — ByteDance audio-video synthesis', estimated_time: '3-5 min' },
  // Video — Upscale/Pro (7 models, 2 with audio)
  { id: 'vid-kling16pro', name: 'Kling 1.6 Pro', model_name: 'fal-ai/kling-video/v1.6/pro/image-to-video', provider: 'fal_ai', model_type: 'video', video_tier: 'upscale', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Kling 1.6 Pro — cinema-quality 1080p', estimated_time: '3-5 min' },
  { id: 'vid-kling20master', name: 'Kling 2.0 Master', model_name: 'fal-ai/kling-video/v2.0/master/image-to-video', provider: 'fal_ai', model_type: 'video', video_tier: 'upscale', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Kling 2.0 Master — flagship quality', estimated_time: '4-6 min', is_default_for_tier: { enterprise: true } },
  { id: 'vid-luma-ray2-flash', name: 'Luma Ray2 Flash', model_name: 'fal-ai/luma-dream-machine/ray-2-flash', provider: 'fal_ai', model_type: 'video', video_tier: 'upscale', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Luma Ray2 Flash — speed + quality', estimated_time: '2-4 min' },
  { id: 'vid-luma-ray2', name: 'Luma Ray2', model_name: 'fal-ai/luma-dream-machine/ray-2', provider: 'fal_ai', model_type: 'video', video_tier: 'upscale', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Luma Ray2 — best-in-class visual quality', estimated_time: '3-5 min' },
  { id: 'vid-runway-gen4', name: 'Runway Gen4 Turbo', model_name: 'fal-ai/runway-gen4/turbo/image-to-video', provider: 'fal_ai', model_type: 'video', video_tier: 'upscale', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Runway Gen4 — Hollywood standard 2025', estimated_time: '3-6 min' },
  { id: 'vid-veo3', name: 'Google Veo 3 🔊', model_name: 'fal-ai/veo3', provider: 'fal_ai', model_type: 'video', video_tier: 'upscale', has_audio: true, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Veo 3 — photorealistic video + generated audio', estimated_time: '4-8 min' },
  { id: 'vid-kling21pro', name: 'Kling 2.1 Pro 🔊', model_name: 'fal-ai/kling-video/v2.1/pro/image-to-video', provider: 'fal_ai', model_type: 'video', video_tier: 'upscale', has_audio: true, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Kling 2.1 Pro — latest flagship with audio', estimated_time: '4-6 min' },
  // Video — Kei.ai Cheap/Fast (5 models)
  { id: 'kei-ltx-fast', name: 'LTX 2.3 Fast', model_name: 'lightricks/ltx-2.3-fast', provider: 'kei_ai', model_type: 'video', video_tier: 'cheap', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'good', description: 'Lightricks LTX 2.3 Fast — ultra-fast generation', estimated_time: '30-60s' },
  { id: 'kei-veo31-fast', name: 'Google Veo 3.1 Fast 🔊', model_name: 'google/veo-3.1-fast', provider: 'kei_ai', model_type: 'video', video_tier: 'cheap', has_audio: true, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Veo 3.1 Fast — Google quality at speed, with audio', estimated_time: '1-2 min' },
  { id: 'kei-kling-v3-std', name: 'Kling v3 Standard', model_name: 'kling/v3-standard', provider: 'kei_ai', model_type: 'video', video_tier: 'cheap', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Kling v3 Standard — fast cinematic motion', estimated_time: '1-2 min', is_default_for_tier: { pro: true } },
  { id: 'kei-seedance-lite', name: 'Seedance 2.0 Lite 🔊', model_name: 'bytedance/seedance-2-fast', provider: 'kei_ai', model_type: 'video', video_tier: 'cheap', has_audio: true, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'ByteDance Seedance 2.0 Lite — fast, with audio', estimated_time: '1-2 min' },
  { id: 'kei-zsky', name: 'Zsky Social Engine', model_name: 'zsky/zsky-social', provider: 'kei_ai', model_type: 'video', video_tier: 'cheap', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'good', description: 'Zsky.ai — optimized for social media content', estimated_time: '1-2 min' },
  // Video — Kei.ai Standard (4 models)
  { id: 'kei-grok-video', name: 'xAI Grok Video 1.5', model_name: 'xai/grok-imagine-video-1.5', provider: 'kei_ai', model_type: 'video', video_tier: 'standard', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'xAI Grok Imagine Video 1.5 — powerful motion', estimated_time: '2-4 min' },
  { id: 'kei-kling-30-turbo', name: 'Kling 3.0 Turbo', model_name: 'kling/kling-3.0-turbo', provider: 'kei_ai', model_type: 'video', video_tier: 'standard', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Kling 3.0 Turbo — flagship speed + quality', estimated_time: '2-3 min' },
  { id: 'kei-kling-o3', name: 'Kling O3 Standard', model_name: 'kling/o3-standard', provider: 'kei_ai', model_type: 'video', video_tier: 'standard', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Kuaishou Kling O3 — cinematic standard', estimated_time: '2-3 min' },
  { id: 'kei-veo31-lite', name: 'Google Veo 3.1 Lite 🔊', model_name: 'google/veo-3.1-lite', provider: 'kei_ai', model_type: 'video', video_tier: 'standard', has_audio: true, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Veo 3.1 Lite — 720p optimized with audio', estimated_time: '2-4 min' },
  // Video — Kei.ai Upscale/Frontier (9 models)
  { id: 'kei-veo31-pro', name: 'Google Veo 3.1 Pro 🔊', model_name: 'google/veo-3.1', provider: 'kei_ai', model_type: 'video', video_tier: 'upscale', has_audio: true, tier_access: ['enterprise'], is_active: true, quality_rating: 'ultra', description: 'Veo 3.1 Pro — Google\'s best, cinematic + audio', estimated_time: '4-8 min' },
  { id: 'kei-seedance2', name: 'Seedance 2.0 🔊', model_name: 'bytedance/seedance-2', provider: 'kei_ai', model_type: 'video', video_tier: 'upscale', has_audio: true, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'ByteDance Seedance 2.0 — full quality with audio', estimated_time: '4-6 min', is_default_for_tier: { enterprise: true } },
  { id: 'kei-sora2', name: 'OpenAI Sora 2 Pro 🔊', model_name: 'openai/sora-2-pro', provider: 'kei_ai', model_type: 'video', video_tier: 'upscale', has_audio: true, tier_access: ['enterprise'], is_active: true, quality_rating: 'ultra', description: 'Sora 2 Pro — OpenAI\'s premiere video model', estimated_time: '5-10 min' },
  { id: 'kei-runway-gen45', name: 'Runway Gen-4.5', model_name: 'runway/gen-4.5', provider: 'kei_ai', model_type: 'video', video_tier: 'upscale', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Runway Gen-4.5 — Hollywood-grade motion', estimated_time: '3-6 min' },
  { id: 'kei-gemini-omni', name: 'Google Gemini Omni 🔊', model_name: 'google/gemini-omni', provider: 'kei_ai', model_type: 'video', video_tier: 'upscale', has_audio: true, tier_access: ['enterprise'], is_active: true, quality_rating: 'ultra', description: 'Gemini Omni — multimodal video + audio generation', estimated_time: '4-8 min' },
  { id: 'kei-kling-4k', name: 'Kling 3.0 4K Master', model_name: 'kling/kling-3.0-4k', provider: 'kei_ai', model_type: 'video', video_tier: 'upscale', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Kling 3.0 4K Mastering — cinema 4K resolution', estimated_time: '5-8 min' },
  { id: 'kei-wan-27', name: 'Alibaba Wan 2.7 4K', model_name: 'alibaba/wan-2.7-video', provider: 'kei_ai', model_type: 'video', video_tier: 'upscale', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'Wan 2.7 — Alibaba high-resolution video', estimated_time: '4-7 min' },
  { id: 'kei-veo31-4k', name: 'Google Veo 3.1 4K Ultra 🔊', model_name: 'google/veo-3.1-4k-ultra', provider: 'kei_ai', model_type: 'video', video_tier: 'upscale', has_audio: true, tier_access: ['enterprise'], is_active: true, quality_rating: 'ultra', description: 'Veo 3.1 4K Ultra — maximum quality + audio', estimated_time: '6-10 min' },
  { id: 'kei-ltx-4k', name: 'LTX 2.3 4K VAE', model_name: 'lightricks/ltx-2.3-4k', provider: 'kei_ai', model_type: 'video', video_tier: 'upscale', has_audio: false, tier_access: ['pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'LTX 2.3 4K VAE — high-fidelity 4K output', estimated_time: '4-7 min' },
  // TTS
  { id: 'tts-google', model_name: 'en-US-Neural2-C', provider: 'google', model_type: 'tts', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Google Neural2 — natural voices', estimated_time: '2-5s', api_parameters: { voice_name: 'en-US-Neural2-C', language_code: 'en-US' } },
  { id: 'tts-elevenlabs', model_name: 'eleven_multilingual_v2', provider: 'elevenlabs', model_type: 'tts', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'ultra', description: 'ElevenLabs — most realistic', estimated_time: '5-10s', api_parameters: { voice_id: 'default', model_id: 'eleven_multilingual_v2' } },
  { id: 'tts-browser', model_name: 'browser', provider: 'browser', model_type: 'tts', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'basic', description: 'Browser TTS (free, instant)', estimated_time: 'instant' },
];

const auth = {
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { id: user.id, email: user.email, role: user.role, plan_type: 'pro', ...(user.user_metadata || {}) };
    return getOrCreateGuest();
  },
  async updateMe(obj = {}) {
    const { data, error } = await supabase.auth.updateUser({ data: obj });
    if (error) throw error;
    return data.user;
  },
  async logout(redirectUrl) {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    if (typeof window !== 'undefined' && redirectUrl) window.location.href = redirectUrl;
  },
  redirectToLogin() {
    // Send unauthenticated users to our Supabase-backed /login page.
    // Guard prevents a redirect loop when already on the login page.
    if (typeof window !== 'undefined' && !/\/login$/i.test(window.location.pathname)) {
      window.location.href = '/login';
    }
  },
};

// ---- integrations (Core) ----
async function UploadFile({ file } = {}) {
  if (!file) return { file_url: '' };
  const ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : 'bin';
  const path = `${APP}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('uploads').upload(path, file, {
    cacheControl: '3600', upsert: false, contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  return { file_url: data.publicUrl };
}

const notWired = (name) => async (...args) => {
  console.warn(`[shim] integrations.${name} not wired to a backend yet`, args);
  return { };
};

const FN_URL = import.meta.env.VITE_FUNCTIONS_URL || 'https://fn.aimicrotechlink.cloud';
async function callIntegration(name, payload = {}) {
  try {
    const res = await fetch(`${FN_URL}/integrations/${name}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: APP, ...payload }),
    });
    return await res.json();
  } catch (e) { console.warn(`[integration ${name}] failed`, e.message); return {}; }
}

const integrations = {
  Core: {
    UploadFile,
    InvokeLLM: (payload = {}) => callIntegration('InvokeLLM', payload),
    GenerateImage: (payload = {}) => callIntegration('GenerateImage', payload),
    SendEmail: (payload = {}) => callIntegration('SendEmail', payload),
    SendSMS: (payload = {}) => callIntegration('SendSMS', payload),
    ExtractDataFromUploadedFile: notWired('ExtractDataFromUploadedFile'),
  },
};

// ---- backend functions (Stripe checkout, tickets, emails) — stubbed ----
const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL || 'https://fn.aimicrotechlink.cloud';
const functions = {
  async invoke(name, payload = {}) {
    try {
      const res = await fetch(`${FUNCTIONS_URL}/fn/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: APP, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) console.warn(`[fn ${name}]`, data.error);
      return data;
    } catch (e) {
      console.warn(`[fn ${name}] failed`, e.message);
      return { data: {} };
    }
  },
};

// ---- appLogs (no-op) ----
const appLogs = {
  create: async () => ({}),
  list: async () => [],
  filter: async () => [],
  logUserInApp: async () => ({}),
};

export const base44 = { entities, auth, integrations, functions, appLogs, supabase };
export default base44;
