import { Outlet, useNavigate } from "react-router-dom";
import styles from './Mainlayout.module.css'
import { TopBar } from "../Components/TopBar/TopBar";
import { useState, useEffect, useRef } from "react";
import { MessageCard } from "../Components/MessageCard/MessageCard";
import { subscribe, subscribeAlert } from "../utils/notify";
import ErrorBoundary from '../Components/ErrorBoundary/ErrorBoundary';
import { AlertModal } from "../Components/AlertModal/AlertModal";

export function Mainlayout(){
    const[darkTheme, setDarkTheme] = useState(false);
    const [messageState, setMessageState] = useState({ message: '', type: 'info', duration: 6000 });
    const [alertState, setAlertState] = useState({ message: '', type: 'info' });
    const navigate = useNavigate();
    const centerRef = useRef(null);
    const [backStyle, setBackStyle] = useState({ left: 16, top: 72, visible: true });
    const navigatingRef = useRef(false);

    useEffect(() => {
      const unsub = subscribe((payload) => {
        setMessageState(payload);
      });
      const unsubAlert = subscribeAlert((payload) => {
        setAlertState(payload);
      });
      return () => {
        unsub();
        unsubAlert();
      };
    }, []);

    // compute fixed position for the back button so it aligns with the center content left edge
    useEffect(() => {
      function updateBackPos(){
        const topbar = document.getElementById('topbar');
        const topbarBottom = topbar ? topbar.getBoundingClientRect().bottom : 56;
        const centerEl = centerRef.current;
        if (!centerEl) return setBackStyle((s)=> ({...s, visible: false}));
        const rect = centerEl.getBoundingClientRect();
        // left: left edge of center content + 12px padding
        const left = Math.max(rect.left + 12, 8);
        const top = Math.max(topbarBottom + 8, 8);
        setBackStyle({ left: Math.round(left), top: Math.round(top), visible: true });
      }

      updateBackPos();
      window.addEventListener('resize', updateBackPos);
      window.addEventListener('scroll', updateBackPos, true); // capture scrolls in any scrollable ancestor
      // also observe DOM changes to reposition if layout shifts
      const ro = new ResizeObserver(updateBackPos);
      if (centerRef.current) ro.observe(centerRef.current);
      const topbar = document.getElementById('topbar');
      if (topbar) ro.observe(topbar);

      return () => {
        window.removeEventListener('resize', updateBackPos);
        window.removeEventListener('scroll', updateBackPos, true);
        ro.disconnect();
      };
    }, []);

    return(
        <div className={`${styles.container} ${darkTheme? styles.light: styles.dark}`}> 
            <TopBar darkTheme={darkTheme} setDarkTheme={setDarkTheme} />
            {/* Render back button fixed to viewport so it remains visible and positioned relative to center content */}
            {backStyle.visible && (
              <button
                className={styles.backButtonFixed}
                onClick={() => {
                                    if (navigatingRef.current) return; // prevent re-entrancy
                                    navigatingRef.current = true;

                                    // Defer history navigation to allow React's internal work to settle.
                                    // Using window.history.back() keeps the browser's native behavior and avoids
                                    // calling into the router while React may be mid-schedule.
                                    setTimeout(() => {
                                      try {
                                        if (window.history.length > 1) {
                                          window.history.back();
                                        } else {
                                          // fallback to app root
                                          navigate('/');
                                        }
                                      } catch (err) {
                                        console.error('Back navigation failed, falling back to home', err);
                                        try { navigate('/'); } catch(e) { /* swallow */ }
                                      } finally {
                                        // allow future navigation after a short delay
                                        setTimeout(() => { navigatingRef.current = false; }, 600);
                                      }
                                    }, 50);
                                }}
                aria-label="Go back"
                style={{ position: 'fixed', left: `${backStyle.left}px`, top: `${backStyle.top}px`, zIndex: 'var(--z-backbutton)' }}
              >
                ← Back
              </button>
            )}

            <div ref={centerRef} className={styles.center}> 
                <ErrorBoundary>
                  <Outlet />
                </ErrorBoundary>
            </div>
            <MessageCard
              message={messageState.message}
              type={messageState.type}
              duration={messageState.duration}
              onClose={() => setMessageState({ message: '', type: 'info', duration: 6000 })}
            />
            <AlertModal
              message={alertState.message}
              type={alertState.type}
              onClose={() => setAlertState({ message: '', type: 'info' })}
            />
        </div>
    )
}