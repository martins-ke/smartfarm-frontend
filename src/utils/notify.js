let listeners = [];
let alertListeners = [];

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

export function alertModal(message, type = 'error') {
  if (!message) return;
  alertListeners.forEach((fn) => {
    try {
      fn({ message, type });
    } catch (e) {
      console.error('alert listener error', e);
    }
  });
}
