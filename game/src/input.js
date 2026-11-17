// SNATCHMENAGERIE — pointer + keyboard input. Mouse/touch drives the market
// (buy off the belt, place traps, press buttons, pick draft cards) and can
// click-to-walk in a vault; WASD / arrows sneak precisely; Enter/Space
// advance the big screens; P pauses; R restarts a run.

export function attachInput(canvas, handlers) {
  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches ? e.touches[0].clientY : e.clientY);
    return {
      x: ((cx - r.left) / r.width) * canvas.width,
      y: ((cy - r.top) / r.height) * canvas.height,
    };
  }
  canvas.addEventListener('mousemove', (e) => { const p = toGame(e); handlers.onMove(p.x, p.y); });
  canvas.addEventListener('mousedown', (e) => { const p = toGame(e); handlers.onTap(p.x, p.y); });
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); const p = toGame(e); handlers.onTap(p.x, p.y); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    handlers.onKey(e.code, true);
  });
  window.addEventListener('keyup', (e) => handlers.onKey(e.code, false));
}
