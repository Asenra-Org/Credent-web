import { create } from 'zustand';

/**
 * Global notifications.
 *
 * Deliberately small: a queue of toasts plus helpers. Screens call
 * `notify.error(...)` after a failed action; nothing polls and nothing is
 * persisted. Errors are pushed already-described (see lib/apiError.js) so a raw
 * server string cannot reach a toast by accident.
 */

let nextId = 1;

const AUTO_DISMISS_MS = {
  success: 4000,
  info: 5000,
  warning: 8000,
  // Errors stay until dismissed. A failure a user did not see is a failure
  // they will repeat.
  error: null,
};

export const useNotificationStore = create((set, get) => ({
  toasts: [],

  push: ({ tone = 'info', title, message = '' }) => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, tone, title, message }] }));

    const ttl = AUTO_DISMISS_MS[tone];
    if (ttl) {
      setTimeout(() => get().dismiss(id), ttl);
    }
    return id;
  },

  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clear: () => set({ toasts: [] }),
}));

/** Ergonomic wrapper so screens read `notify.error({...})`. */
export const notify = {
  info: (title, message) =>
    useNotificationStore.getState().push({ tone: 'info', title, message }),
  success: (title, message) =>
    useNotificationStore.getState().push({ tone: 'success', title, message }),
  warning: (title, message) =>
    useNotificationStore.getState().push({ tone: 'warning', title, message }),
  error: (title, message) =>
    useNotificationStore.getState().push({ tone: 'error', title, message }),
  /** Push an axios failure that has already been through describeError(). */
  fromError: (described) =>
    useNotificationStore.getState().push({
      tone: 'error',
      title: described.title,
      message: described.correlationId
        ? `${described.message} (ref ${described.correlationId})`
        : described.message,
    }),
};
