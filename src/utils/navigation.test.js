import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safeNavigate } from './navigation.js';

describe('safeNavigate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('usa history.pushState para rutas relativas para no disparar la navegación de jsdom', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    safeNavigate('/reclamos');

    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/reclamos');
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(PopStateEvent));
  });

  it('agrega una barra inicial a rutas relativas sin barra', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    safeNavigate('reclamos');

    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/reclamos');
  });

  it('usa el pathname de una URL HTTP externa', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    safeNavigate('https://example.com/reclamos');

    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/reclamos');
  });

  it('usa replaceState para redirecciones de salida', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    safeNavigate('/', { replace: true });

    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/');
  });
});
