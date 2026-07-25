import { useEffect, useState, useCallback } from 'react';

/**
 * useInstallPrompt — captures the browser's `beforeinstallprompt` event once,
 * app-wide, so any component (nav button, banner, settings page) can trigger
 * the native "Install app" flow. Also exposes whether the app is already
 * running as an installed PWA, and a best-guess platform for browsers that
 * never fire the event (iOS Safari, desktop Firefox) so we can fall back to
 * manual "Add to Home Screen" instructions instead of just hiding the option.
 */

let capturedEvent = null;
const listeners = new Set();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    capturedEvent = e;
    listeners.forEach((fn) => fn(e));
  });
  window.addEventListener('appinstalled', () => {
    capturedEvent = null;
    listeners.forEach((fn) => fn(null));
  });
}

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios'; // iPadOS masquerading as Mac
  return 'desktop';
}

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true
  );
}

export function useInstallPrompt() {
  const [event, setEvent] = useState(capturedEvent);
  const [isInstalled, setIsInstalled] = useState(detectStandalone);

  useEffect(() => {
    const onChange = (e) => setEvent(e);
    listeners.add(onChange);
    const onInstalled = () => setIsInstalled(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!capturedEvent) return 'unavailable';
    capturedEvent.prompt();
    const { outcome } = await capturedEvent.userChoice;
    if (outcome === 'accepted') {
      capturedEvent = null;
      setEvent(null);
    }
    return outcome;
  }, []);

  return {
    canPrompt: Boolean(event),
    isInstalled,
    platform: detectPlatform(),
    promptInstall,
  };
}
