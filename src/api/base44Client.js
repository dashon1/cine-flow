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

// Wrap AIModelConfig to fall back to built-in models when DB is empty.
const _entityProxy = new Proxy({}, {
  get(_t, name) {
    if (typeof name !== 'string') return undefined;
    if (name === 'AIModelConfig') {
      const base = entityApi('AIModelConfig');
      return {
        ...base,
        async list(sort, limit) {
          const rows = await base.list(sort, limit);
          return rows.length > 0 ? rows : BUILTIN_MODELS;
        },
        async filter(query = {}, sort, limit) {
          const rows = await base.filter(query, sort, limit);
          if (rows.length > 0) return rows;
          // Filter built-ins by query fields
          let ms = BUILTIN_MODELS;
          for (const [k, v] of Object.entries(query || {})) ms = ms.filter(m => String(m[k] ?? '') === String(v));
          return ms;
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
  // Video
  { id: 'vid-minimax', model_name: 'fal-ai/minimax/video-01', provider: 'fal_ai', model_type: 'video', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Minimax — fast AI video', estimated_time: '1-2 min', api_parameters: { duration: 5 } },
  { id: 'vid-wan', model_name: 'fal-ai/wan-i2v/v1.3', provider: 'fal_ai', model_type: 'video', tier_access: ['free','pro','enterprise'], is_active: true, quality_rating: 'excellent', description: 'Wan 2.6 — 1080p quality', estimated_time: '1-2 min', api_parameters: { duration: 5 } },
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
