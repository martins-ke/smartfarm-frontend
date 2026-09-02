import { Outlet, useNavigate, useLocation } from "react-router-dom";
import styles from './Mainlayout.module.css'
import { TopBar } from "../Components/TopBar/TopBar";
import { useState, useEffect } from "react";
import { MessageCard } from "../Components/MessageCard/MessageCard";
import { subscribe, subscribeAlert } from "../utils/notify";
import ErrorBoundary from '../Components/ErrorBoundary/ErrorBoundary';
import { AlertModal } from "../Components/AlertModal/AlertModal";
import { FaArrowLeft } from "react-icons/fa";

export function Mainlayout(){
    const[darkTheme, setDarkTheme] = useState(false);
    const [hideMenu, setHideMenu] = useState(true);
    const [messageState, setMessageState] = useState({ message: '', type: 'info', duration: 6000 });
    const [alertState, setAlertState] = useState({ message: '', type: 'info' });
    const navigate = useNavigate();

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
        <div className={`${styles.container} ${darkTheme? styles.light: styles.dark}`}> 
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
        </div>
    )
}