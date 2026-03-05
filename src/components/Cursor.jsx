import { useEffect, useRef } from 'react';
import './Cursor.css';

export default function Cursor() {
  const curRef = useRef(null);
  const curRRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const cur = curRef.current;
    const curR = curRRef.current;
    if (!cur || !curR) return;

    let mx = 0, my = 0, rx = 0, ry = 0;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      cur.style.left = mx + 'px';
      cur.style.top = my + 'px';
    };

    const anim = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      curR.style.left = rx + 'px';
      curR.style.top = ry + 'px';
      requestAnimationFrame(anim);
    };

    document.addEventListener('mousemove', onMove);
    const rafId = requestAnimationFrame(anim);

    const grow = () => { cur.style.width = '18px'; cur.style.height = '18px'; curR.style.width = '50px'; curR.style.height = '50px'; };
    const shrink = () => { cur.style.width = '10px'; cur.style.height = '10px'; curR.style.width = '36px'; curR.style.height = '36px'; };

    document.querySelectorAll('a, button, label').forEach(el => {
      el.addEventListener('mouseenter', grow);
      el.addEventListener('mouseleave', shrink);
    });

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div className="cur" ref={curRef} />
      <div className="cur-r" ref={curRRef} />
    </>
  );
}
