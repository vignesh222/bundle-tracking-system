import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_transition_queue';

export async function enqueueTransition(payload) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({ ...payload, queuedAt: new Date().toISOString(), id: Date.now().toString() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue() {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function removeFromQueue(id) {
  const queue = await getQueue();
  const filtered = queue.filter(item => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
