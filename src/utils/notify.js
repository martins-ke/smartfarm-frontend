let listeners = [];
let alertListeners = [];
let confirmListeners = [];

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function subscribeAlert(fn) {
  alertListeners.push(fn);
  return () => {
    alertListeners = alertListeners.filter((l) => l !== fn);
  };
}

export function subscribeConfirm(fn) {
  confirmListeners.push(fn);
  return () => {
    confirmListeners = confirmListeners.filter((l) => l !== fn);
  };
}

export function notify(message, type = 'info', duration = 6000) {
  if (!message) return;
  listeners.forEach((fn) => {
    try {
      fn({ message, type, duration });
    } catch (e) {
      console.error('notify listener error', e);
    }
  });
}

export function alertModal(message, type = 'error', title) {
  if (!message) return;
  alertListeners.forEach((fn) => {
    try {
      fn({ message, type, title });
    } catch (e) {
      console.error('alert listener error', e);
    }
  });
}

export function confirmModal({
  title = 'Are you sure?',
  message = 'Do you really want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
} = {}) {
  return new Promise((resolve) => {
    if (confirmListeners.length === 0) {
      // Fallback if no modal is mounted
      const result = window.confirm(message);
      resolve(result);
      return;
    }

    confirmListeners.forEach((fn) => {
      try {
        fn({
          title,
          message,
          confirmText,
          cancelText,
          type,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false)
        });
      } catch (e) {
        console.error('confirm listener error', e);
        resolve(false);
      }
    });
  });
}
