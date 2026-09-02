import { useEffect, useRef, useState } from 'react'
import styles from './TopBar.module.css'
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaCog, FaHome, FaMoon, FaSignOutAlt, FaSun, FaUserAlt, FaLeaf, FaBoxes, FaUsersCog, FaUsers, FaUserEdit } from 'react-icons/fa';

import { notify } from '../../utils/notify';
import useAuth from '../../useAuth';
import EditProfileModal from '../EditProfileModal/EditProfileModal';

export function TopBar({darkTheme, setDarkTheme}){
    const[hideMenu, setHideMenu] = useState(true);
    const [showUserCard, setShowUserCard] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

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
    const menuRef = useRef(null);
    const toggleRef = useRef(null);

    useEffect(() => {
        const onDocClick = (e) => {
           if (userRef.current && !userRef.current.contains(e.target)) {
               setShowUserCard(false);
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
                       {isAdmin && (
                           <li className={isActive('/users') ? styles.active : ''} onClick={() => { setHideMenu(true); navigate('/users'); }}>
                               <span className={styles.menuItemIcon}><FaUsersCog /></span>
                               <span>Staff & Managers</span>
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
                           {darkTheme ? <FaSun className={styles.themeIcon} /> : <FaMoon className={styles.themeIcon} />}
                           <div className={styles.themeBtn} onClick={()=> setDarkTheme(!darkTheme)} aria-label="Toggle theme">
                               <div className={`${styles.child} ${darkTheme ? styles.on : ''}`}></div>
                           </div>
                       </div>
                   </div>
               </nav>

               {/* overlay covering rest of the app to block interactions when menu is open */}
               {!hideMenu && <div className={styles.appOverlay} onClick={() => setHideMenu(true)} aria-hidden="true" />} 

               <aside className={styles.logo}>
                   <FaLeaf className={styles.logoIcon} />
                   <h3>smart farm</h3>
               </aside>
           </div>

           <aside className={styles.user} ref={userRef} onClick={(e)=>{ e.stopPropagation(); setShowUserCard((s)=> !s); }}>
               <div className={styles.userInitial}><FaUserAlt /></div>
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
           </aside>

           {showEditModal && <EditProfileModal onClose={() => setShowEditModal(false)} />}
        </div>
    )
}