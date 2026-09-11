import { useEffect, useRef, useState } from 'react'
import styles from './TopBar.module.css'
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaBars, FaHome, FaMoon, FaSignOutAlt, FaSun, FaUserAlt, FaLeaf,
  FaBoxes, FaUsersCog, FaUsers, FaUserEdit, FaChevronDown, FaTruck,
  FaHandHoldingUsd, FaBell, FaExclamationTriangle, FaUserPlus,
  FaCalendarCheck, FaMoneyBillWave, FaArrowRight, FaTimes, FaCheckCircle
} from 'react-icons/fa';

import { notify } from '../../utils/notify';
import useAuth from '../../useAuth';
import { getNotifications } from '../../APIs/notification';
import EditProfileModal from '../EditProfileModal/EditProfileModal';
import { AgroSyncLogo } from '../Logo/AgroSyncLogo';

export function TopBar({darkTheme, setDarkTheme, hideMenu: externalHideMenu, setHideMenu: externalSetHideMenu}){
    const [localHideMenu, setLocalHideMenu] = useState(true);
    const hideMenu = externalHideMenu !== undefined ? externalHideMenu : localHideMenu;
    const setHideMenu = externalSetHideMenu || setLocalHideMenu;

    const [showUserCard, setShowUserCard] = useState(false);
    const [showNotifCard, setShowNotifCard] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [dismissedIds, setDismissedIds] = useState(new Set());
    const [notifTab, setNotifTab] = useState('ALL');

    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = useAuth((state) => state.user);
    const logout = useAuth((state) => state.logout);
    const isActive = (path)=> location.pathname === path;
    const isCategoryRoute = location.pathname.startsWith('/categories');

    const roleUpper = (currentUser?.role || '').toUpperCase();
    const isAdmin = roleUpper === 'ADMIN';
    const isManager = roleUpper === 'MANAGER';

    const userRef = useRef(null);
    const notifRef = useRef(null);
    const menuRef = useRef(null);
    const toggleRef = useRef(null);

    const loadNotifications = () => {
        if (!currentUser?.id) return;
        getNotifications()
            .then(res => {
                if (res?.notifications) {
                    setNotifications(res.notifications);
                }
            })
            .catch(() => {});
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 45000); // refresh every 45s
        return () => clearInterval(interval);
    }, [currentUser?.id, location.pathname]);

    useEffect(() => {
        const onDocClick = (e) => {
           if (userRef.current && !userRef.current.contains(e.target)) {
               setShowUserCard(false);
           }
           if (notifRef.current && !notifRef.current.contains(e.target)) {
               setShowNotifCard(false);
           }
           if (!hideMenu) {
             const clickedInsideMenu = menuRef.current && menuRef.current.contains(e.target);
             const clickedToggle = toggleRef.current && toggleRef.current.contains(e.target);
             if (!clickedInsideMenu && !clickedToggle) {
               setHideMenu(true);
             }
           }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [hideMenu]);

    const handleDismiss = (e, notifId) => {
        e.stopPropagation();
        setDismissedIds(prev => new Set(prev).add(notifId));
    };

    const handleClearAll = (e) => {
        e.stopPropagation();
        const allIds = new Set(notifications.map(n => n.id));
        setDismissedIds(allIds);
    };

    const activeNotifications = notifications.filter(n => !dismissedIds.has(n.id));
    const filteredNotifications = activeNotifications.filter(n => {
        if (notifTab === 'TASKS') return n.category === 'TASKS';
        if (notifTab === 'STOCK') return n.category === 'INVENTORY';
        if (notifTab === 'USERS') return n.category === 'USERS';
        if (notifTab === 'FINANCE') return n.category === 'FINANCE';
        return true;
    });

    const unreadCount = activeNotifications.length;

    const getNotifIcon = (notif) => {
        if (notif.category === 'USERS') return <FaUserPlus />;
        if (notif.category === 'INVENTORY') return <FaBoxes />;
        if (notif.category === 'TASKS') return notif.severity === 'DANGER' ? <FaExclamationTriangle /> : <FaCalendarCheck />;
        if (notif.category === 'FINANCE') return <FaMoneyBillWave />;
        return <FaBell />;
    };

    const getIconClass = (severity) => {
        if (severity === 'DANGER') return styles.iconDanger;
        if (severity === 'WARNING') return styles.iconWarning;
        if (severity === 'SUCCESS') return styles.iconSuccess;
        return styles.iconInfo;
    };

    const handleSeasonClick = () => {
        setHideMenu(true);
        navigate('/categories');
    };

    const goToDashboard = () => {
        setHideMenu(true);
        navigate('/');
    };

    const onSettings = () => {
        setShowUserCard(false);
        setShowEditModal(true);
    };

    const onLogout = () => {
        logout();
        navigate('/login', { replace: true });
        notify('Logged out successfully', 'success');
    };

    return(
        <div id="topbar" className={styles.container}>
           <div className={styles.left}>
               <aside ref={toggleRef} className={styles.toggleBtn} onClick={()=> setHideMenu(!hideMenu)} aria-label="Toggle menu">
                   <FaBars className={styles.icon} />
               </aside>

               <nav ref={menuRef} className={`${styles.menu} ${hideMenu ? styles.hide : ''}`}>
                   <ul>
                       <li className={isActive('/') ? styles.active : ''} onClick={goToDashboard}>
                           <span className={styles.menuItemIcon}><FaHome /></span>
                           <span>Dashboard</span>
                       </li>
                       <li className={`${isCategoryRoute ? styles.active : ''} ${styles.seasonsItem}`}>
                           <span className={styles.menuItemTrigger} onClick={handleSeasonClick}>
                               <span className={styles.menuItemIcon}><FaLeaf /></span>
                               <span>Categories</span>
                           </span>
                       </li>
                       <li className={isActive('/inventory') ? styles.active : ''} onClick={() => { setHideMenu(true); navigate('/inventory'); }}>
                           <span className={styles.menuItemIcon}><FaBoxes /></span>
                           <span>Inventory</span>
                       </li>
                       {(isAdmin || isManager) && (
                           <>
                               <li className={isActive('/suppliers') ? styles.active : ''} onClick={() => { setHideMenu(true); navigate('/suppliers'); }}>
                                   <span className={styles.menuItemIcon}><FaTruck /></span>
                                   <span>Suppliers (AP)</span>
                               </li>
                               <li className={isActive('/customers') ? styles.active : ''} onClick={() => { setHideMenu(true); navigate('/customers'); }}>
                                   <span className={styles.menuItemIcon}><FaHandHoldingUsd /></span>
                                   <span>Customers (AR)</span>
                               </li>
                           </>
                       )}
                       {isAdmin && (
                           <li className={isActive('/users') ? styles.active : ''} onClick={() => { setHideMenu(true); navigate('/users'); }}>
                               <span className={styles.menuItemIcon}><FaUsersCog /></span>
                               <span>Staff & Workforce</span>
                           </li>
                       )}
                       {isManager && (
                           <li className={isActive('/users') ? styles.active : ''} onClick={() => { setHideMenu(true); navigate('/users'); }}>
                               <span className={styles.menuItemIcon}><FaUsers /></span>
                               <span>My Supervisors & Team</span>
                           </li>
                       )}
                   </ul>

                    <div className={styles.theme}>
                        <p>Theme</p>
                        <div className={styles.themeToggleWrap}>
                            {darkTheme ? <FaMoon className={styles.themeIcon} title="Dark Mode Active" /> : <FaSun className={styles.themeIcon} title="Light Mode Active" />}
                            <div className={styles.themeBtn} onClick={()=> setDarkTheme(!darkTheme)} aria-label="Toggle theme">
                                <div className={`${styles.child} ${darkTheme ? styles.on : ''}`}></div>
                            </div>
                        </div>
                    </div>
               </nav>

               {/* overlay covering rest of the app to block interactions when menu is open */}
               {!hideMenu && <div className={styles.appOverlay} onClick={() => setHideMenu(true)} aria-hidden="true" />} 

               <aside className={styles.brandLogoWrap} onClick={goToDashboard} title="AgroSync Dashboard">
                   <AgroSyncLogo size={26} />
               </aside>
           </div>

           <div className={styles.rightControls}>
               {/* ── Notification Bell Trigger ── */}
               <div style={{ position: 'relative' }}>
                   <button
                       type="button"
                       className={`${styles.notifTriggerBtn} ${showNotifCard ? styles.notifTriggerActive : ''}`}
                       ref={notifRef}
                       onClick={(e) => {
                           e.stopPropagation();
                           setShowUserCard(false);
                           setShowNotifCard((s) => !s);
                       }}
                       title="Notifications & Alerts"
                       aria-label="Notifications"
                   >
                       <FaBell />
                       {unreadCount > 0 && (
                           <span className={styles.notifBadge}>
                               {unreadCount > 99 ? '99+' : unreadCount}
                           </span>
                       )}
                   </button>

                    {/* ── Notification Dropdown Card & Mobile Overlay ── */}
                    {showNotifCard && <div className={styles.notifMobileOverlay} onClick={() => setShowNotifCard(false)} aria-hidden="true" />}
                    {showNotifCard && (
                        <div className={styles.notifDropdown} onClick={(e) => e.stopPropagation()}>
                           <div className={styles.notifHeader}>
                               <div className={styles.notifTitle}>
                                   <FaBell style={{ color: 'var(--accent, #38bdf8)' }} />
                                   <span>Notifications</span>
                                   <span className={styles.notifCountChip}>{unreadCount} active</span>
                               </div>
                               {activeNotifications.length > 0 && (
                                   <button
                                       type="button"
                                       className={styles.notifClearBtn}
                                       onClick={handleClearAll}
                                   >
                                       Clear all
                                   </button>
                               )}
                           </div>

                           {/* Category Tabs */}
                           <div className={styles.notifTabs}>
                               <button
                                   type="button"
                                   className={`${styles.notifTabBtn} ${notifTab === 'ALL' ? styles.notifTabActive : ''}`}
                                   onClick={() => setNotifTab('ALL')}
                               >
                                   All
                               </button>
                               <button
                                   type="button"
                                   className={`${styles.notifTabBtn} ${notifTab === 'TASKS' ? styles.notifTabActive : ''}`}
                                   onClick={() => setNotifTab('TASKS')}
                               >
                                   Tasks
                               </button>
                               <button
                                   type="button"
                                   className={`${styles.notifTabBtn} ${notifTab === 'STOCK' ? styles.notifTabActive : ''}`}
                                   onClick={() => setNotifTab('STOCK')}
                               >
                                   Stock
                               </button>
                               {(isAdmin || isManager) && (
                                   <>
                                       <button
                                           type="button"
                                           className={`${styles.notifTabBtn} ${notifTab === 'USERS' ? styles.notifTabActive : ''}`}
                                           onClick={() => setNotifTab('USERS')}
                                       >
                                           Users
                                       </button>
                                       <button
                                           type="button"
                                           className={`${styles.notifTabBtn} ${notifTab === 'FINANCE' ? styles.notifTabActive : ''}`}
                                           onClick={() => setNotifTab('FINANCE')}
                                       >
                                           Finance
                                       </button>
                                   </>
                               )}
                           </div>

                           {/* Notification List */}
                           <div className={styles.notifList}>
                               {filteredNotifications.length > 0 ? (
                                   filteredNotifications.map((notif) => (
                                       <div key={notif.id} className={styles.notifItem}>
                                           <div className={`${styles.notifIconWrap} ${getIconClass(notif.severity)}`}>
                                               {getNotifIcon(notif)}
                                           </div>
                                           <div className={styles.notifContent}>
                                               <h4 className={styles.notifItemTitle}>{notif.title}</h4>
                                               <p className={styles.notifItemMsg}>{notif.message}</p>
                                               <div className={styles.notifFooter}>
                                                   {notif.actionUrl ? (
                                                       <button
                                                           type="button"
                                                           className={styles.notifActionBtn}
                                                           onClick={() => {
                                                               setShowNotifCard(false);
                                                               navigate(notif.actionUrl);
                                                           }}
                                                       >
                                                           <span>{notif.actionLabel || 'View'}</span>
                                                           <FaArrowRight size={8} />
                                                       </button>
                                                   ) : <span />}
                                                   <button
                                                       type="button"
                                                       className={styles.notifDismissBtn}
                                                       onClick={(e) => handleDismiss(e, notif.id)}
                                                       title="Dismiss notification"
                                                   >
                                                       <FaTimes size={10} />
                                                   </button>
                                               </div>
                                           </div>
                                       </div>
                                   ))
                               ) : (
                                   <div className={styles.notifEmpty}>
                                       <FaCheckCircle size={24} style={{ color: '#10b981' }} />
                                       <span>All caught up! No active alerts.</span>
                                   </div>
                               )}
                           </div>
                       </div>
                   )}
               </div>

               {/* ── User Profile Trigger ── */}
               <div 
                   className={`${styles.userTriggerBtn} ${showUserCard ? styles.userTriggerActive : ''}`} 
                   ref={userRef} 
                   onClick={(e)=>{ e.stopPropagation(); setShowNotifCard(false); setShowUserCard((s)=> !s); }}
                   role="button"
                   tabIndex={0}
                   aria-label="User Profile Menu"
               >
                   <div className={styles.userAvatarMini}>
                       <FaUserAlt className={styles.avatarMiniIcon} />
                       <span className={styles.miniOnlineDot} />
                   </div>
                   <div className={styles.userTriggerInfo}>
                       <span className={styles.userTriggerName}>{currentUser?.username || 'Account'}</span>
                       <span className={styles.userTriggerRole}>{currentUser?.role || 'Guest'}</span>
                   </div>
                   <FaChevronDown className={`${styles.userTriggerChevron} ${showUserCard ? styles.chevronRotated : ''}`} />
                    {showUserCard && (
                        <div className={styles.userCard} onClick={(e)=> e.stopPropagation()}>
                            <div className={styles.userCardTop}>
                                <div className={styles.avatarWrap}>
                                    <div className={styles.avatar}><FaUserAlt /></div>
                                    <span className={styles.onlineBadge} />
                                </div>
                                <div className={styles.userInfoBlock}>
                                    <div className={styles.userName}>{currentUser?.username || 'Guest'}</div>
                                    <span className={styles.userRoleBadge}>{currentUser?.role || 'User'}</span>
                                </div>
                            </div>

                            <div className={styles.cardDivider} />

                            <div className={styles.userCardActions}>
                                <button className={styles.actionBtn} onClick={onSettings}>
                                    <FaUserEdit className={styles.btnIcon} />
                                    <span>Edit Profile</span>
                                </button>
                                <button className={`${styles.actionBtn} ${styles.logoutBtn}`} onClick={onLogout}>
                                    <FaSignOutAlt className={styles.btnIcon} />
                                    <span>Log Out</span>
                                </button>
                            </div>
                        </div>
                    )}
               </div>
           </div>

           {showEditModal && <EditProfileModal onClose={() => setShowEditModal(false)} />}
        </div>
    )
}