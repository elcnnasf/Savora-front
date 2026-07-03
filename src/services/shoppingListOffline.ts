// Offline-first layer over the shopping list API.
// Reads serve from an AsyncStorage cache when the network is down; writes are
// applied to the cache immediately and queued for replay when connectivity returns.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../api/shoppingList';
import { ShoppingItem } from '../api/shoppingList';

const CACHE_KEY = 'savora_shopping_cache';
const QUEUE_KEY = 'savora_shopping_queue';
const LOCAL_ID_PREFIX = 'local_';

type PendingOp =
  | { type: 'add'; tempId: string; name: string; quantity?: string; category?: string }
  | { type: 'update'; id: string; patch: { is_checked?: boolean } }
  | { type: 'delete'; id: string }
  | { type: 'clearChecked' };

export interface ListResult {
  items: ShoppingItem[];
  offline: boolean;
}

// apiFetch throws TypeError("Network request failed") when there is no connectivity,
// and a plain Error with the server message for HTTP-level failures
function isNetworkError(e: any): boolean {
  return e instanceof TypeError || /network request failed|failed to fetch/i.test(e?.message ?? '');
}

async function readCache(): Promise<ShoppingItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const writeCache = (items: ShoppingItem[]) =>
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items));

async function readQueue(): Promise<PendingOp[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const writeQueue = (queue: PendingOp[]) =>
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

async function enqueue(op: PendingOp) {
  const queue = await readQueue();
  await writeQueue([...queue, op]);
}

let flushing = false;

// Replays queued offline mutations in order. Returns true when the queue is empty.
export async function flushQueue(): Promise<boolean> {
  if (flushing) return false;
  flushing = true;
  try {
    let queue = await readQueue();
    const idMap: Record<string, string> = {};

    while (queue.length > 0) {
      const op = queue[0];
      try {
        if (op.type === 'add') {
          const res = await api.addItem(op.name, op.quantity, op.category);
          idMap[op.tempId] = res.data.id;
          const items = await readCache();
          await writeCache(items.map((i) => (i.id === op.tempId ? res.data : i)));
        } else if (op.type === 'update') {
          const id = idMap[op.id] ?? op.id;
          if (!id.startsWith(LOCAL_ID_PREFIX)) await api.updateItem(id, op.patch);
        } else if (op.type === 'delete') {
          const id = idMap[op.id] ?? op.id;
          if (!id.startsWith(LOCAL_ID_PREFIX)) await api.deleteItem(id);
        } else {
          await api.clearChecked();
        }
      } catch (e) {
        if (isNetworkError(e)) return false; // still offline — keep the queue for later
        // the server rejected this op (validation, deleted item, …) — drop it so one
        // bad op can't block the whole queue forever
      }
      queue = queue.slice(1);
      await writeQueue(queue);
    }
    return true;
  } finally {
    flushing = false;
  }
}

export async function loadList(): Promise<ListResult> {
  await flushQueue().catch(() => {});
  try {
    const res = await api.getShoppingList();
    const queue = await readQueue();
    if (queue.length > 0) {
      // flush didn't finish — cache still holds local-only changes; don't overwrite them
      return { items: await readCache(), offline: true };
    }
    await writeCache(res.data.items);
    return { items: res.data.items, offline: false };
  } catch (e) {
    if (isNetworkError(e)) {
      return { items: await readCache(), offline: true };
    }
    // server-side failure (e.g. expired session) — don't surface another user's cache
    return { items: [], offline: false };
  }
}

export async function add(name: string, quantity?: string, category?: string): Promise<ListResult> {
  const items = await readCache();
  const temp: ShoppingItem = {
    id: `${LOCAL_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    quantity,
    category: category ?? 'Other',
    is_checked: false,
    created_at: new Date().toISOString(),
  };
  const next = [...items, temp];
  await writeCache(next);

  try {
    const res = await api.addItem(name, quantity, category);
    const synced = next.map((i) => (i.id === temp.id ? res.data : i));
    await writeCache(synced);
    return { items: synced, offline: false };
  } catch (e) {
    if (!isNetworkError(e)) {
      await writeCache(items); // server rejected — undo the local insert
      throw e;
    }
    await enqueue({ type: 'add', tempId: temp.id, name, quantity, category });
    return { items: next, offline: true };
  }
}

export async function addBulk(
  newItems: { name: string; quantity?: string; category?: string }[],
): Promise<ListResult> {
  try {
    await api.addBulkItems(newItems);
    return loadList();
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    let result: ListResult = { items: await readCache(), offline: true };
    for (const it of newItems) {
      result = await add(it.name, it.quantity, it.category);
    }
    return result;
  }
}

export async function toggle(id: string, is_checked: boolean): Promise<void> {
  const items = await readCache();
  await writeCache(items.map((i) => (i.id === id ? { ...i, is_checked } : i)));
  try {
    if (!id.startsWith(LOCAL_ID_PREFIX)) {
      await api.updateItem(id, { is_checked });
    } else {
      await enqueue({ type: 'update', id, patch: { is_checked } });
    }
  } catch (e) {
    if (isNetworkError(e)) await enqueue({ type: 'update', id, patch: { is_checked } });
  }
}

export async function remove(id: string): Promise<void> {
  const items = await readCache();
  await writeCache(items.filter((i) => i.id !== id));
  if (id.startsWith(LOCAL_ID_PREFIX)) {
    // the item never reached the server — just drop its pending ops from the queue
    const queue = await readQueue();
    await writeQueue(queue.filter(
      (op) => !((op.type === 'add' && op.tempId === id) || (op.type === 'update' && op.id === id)),
    ));
    return;
  }
  try {
    await api.deleteItem(id);
  } catch (e) {
    if (isNetworkError(e)) await enqueue({ type: 'delete', id });
  }
}

export async function clearCheckedItems(): Promise<void> {
  const items = await readCache();
  await writeCache(items.filter((i) => !i.is_checked));
  try {
    await api.clearChecked();
  } catch (e) {
    if (isNetworkError(e)) await enqueue({ type: 'clearChecked' });
  }
}
