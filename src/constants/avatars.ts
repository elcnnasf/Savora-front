// 10 preset avatars. We store only the preset id (e.g. "preset:av3") in
// profiles.avatar_url — no image uploads, so the database stays tiny.

export interface AvatarPreset {
  id: string;    // stored value, e.g. "preset:av3"
  emoji: string;
  color: string; // circle background
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'preset:av1',  emoji: '🧑‍🍳', color: '#F97316' },
  // Plain (default yellow-skin) chef emoji — not a pale/white skin-tone variant.
  { id: 'preset:av11', emoji: '👩‍🍳', color: '#0EA5E9' },
  { id: 'preset:av12', emoji: '🍇',   color: '#6366F1' },
  { id: 'preset:av2',  emoji: '🍳',   color: '#16A34A' },
  { id: 'preset:av3',  emoji: '🥑',   color: '#10B981' },
  { id: 'preset:av4',  emoji: '🍕',   color: '#EF4444' },
  { id: 'preset:av5',  emoji: '🍜',   color: '#F59E0B' },
  { id: 'preset:av6',  emoji: '🧁',   color: '#EC4899' },
  { id: 'preset:av7',  emoji: '🍓',   color: '#E11D48' },
  { id: 'preset:av8',  emoji: '🍔',   color: '#D97706' },
  { id: 'preset:av9',  emoji: '🌮',   color: '#CA8A04' },
  { id: 'preset:av10', emoji: '🍩',   color: '#8B5CF6' },
];

const byId = new Map(AVATAR_PRESETS.map((a) => [a.id, a]));

export function resolveAvatar(id?: string | null): AvatarPreset | null {
  if (!id) return null;
  return byId.get(id) ?? null;
}
