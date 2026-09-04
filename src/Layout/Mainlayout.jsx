import { Outlet, useNavigate, useLocation } from "react-router-dom";
import styles from './Mainlayout.module.css'
import { TopBar } from "../Components/TopBar/TopBar";
import { useState, useEffect } from "react";
import { MessageCard } from "../Components/MessageCard/MessageCard";
import { subscribe, subscribeAlert, subscribeConfirm } from "../utils/notify";
import ErrorBoundary from '../Components/ErrorBoundary/ErrorBoundary';
import { AlertModal } from "../Components/AlertModal/AlertModal";
import { ConfirmModal } from "../Components/ConfirmModal/ConfirmModal";
import { FaArrowLeft } from "react-icons/fa";

export function Mainlayout(){
    const [darkTheme, setDarkTheme] = useState(() => {
      const saved = localStorage.getItem('smartfarm_theme');
      return saved !== null ? saved === 'dark' : true;
    });
    const [hideMenu, setHideMenu] = useState(true);
    const [messageState, setMessageState] = useState({ message: '', type: 'info', duration: 6000 });
    const [alertState, setAlertState] = useState({ message: '', type: 'info' });
    const [confirmState, setConfirmState] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
      localStorage.setItem('smartfarm_theme', darkTheme ? 'dark' : 'light');
      if (darkTheme) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }, [darkTheme]);

    useEffect(() => {
      const unsub = subscribe((payload) => {
        setMessageState(payload);
      });
      const unsubAlert = subscribeAlert((payload) => {
        setAlertState(payload);
      });
      const unsubConfirm = subscribeConfirm((payload) => {
        setConfirmState(payload);
      });
      return () => {
        unsub();
        unsubAlert();
        unsubConfirm();
      };
    }, []);

    const handleBack = () => {
      try {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          navigate('/');
        }
      } catch (err) {
        navigate('/');
      }
    };

    return(
        <div className={`${styles.container} ${darkTheme ? styles.dark : styles.light}`}> 
            <TopBar darkTheme={darkTheme} setDarkTheme={setDarkTheme} hideMenu={hideMenu} setHideMenu={setHideMenu} />
            
            {/* Back button: visible when menu is closed, disappears when menu is open */}
            {hideMenu && (
              <button
                className={styles.backButtonFixed}
                onClick={handleBack}
                aria-label="Go back"
              >
                <FaArrowLeft className={styles.backIcon} /> Back
              </button>
            )}

            <div className={styles.center}> 
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
            <ConfirmModal
              data={confirmState}
              onClose={() => setConfirmState(null)}
            />
        </div>
    )
}