import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SupervisorDashboard.module.css';
import { getSupervisorProjects } from '../../APIs/user';
import { Spinner } from '../../Components/Spinner/Spinner';
import { ErrorState } from '../../Components/ErrorState/ErrorState';
import { 
  FaHardHat, 
  FaLeaf, 
  FaCalendarAlt, 
  FaArrowRight, 
  FaSearch, 
  FaLayerGroup,
  FaCheckCircle,
  FaClock,
  FaThLarge,
  FaList,
  FaBoxes,
  FaSeedling
} from 'react-icons/fa';
import { GiChicken } from 'react-icons/gi';
import FaCow from '../../Icons/FaCow';

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.body?.content && Array.isArray(response.body.content)) return response.body.content;
  if (response && Array.isArray(response.body)) return response.body;
  return [];
};

export default function SupervisorDashboard({ user }) {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Global keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Time-of-day dynamic greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const loadProjects = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const response = await getSupervisorProjects(user.id);
      const data = normalizeArrayResponse(response);
      setProjects(data);
    } catch (err) {
      setLoadError(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user?.id]);

  // Sector classification helper
  const getCategoryMeta = (catName = '') => {
    const lower = String(catName).toLowerCase();
    if (lower.includes('crop')) {
      return {
        cardClass: styles.cropsCard,
        tagClass: styles.cropsTag,
        icon: <FaLeaf />,
        label: 'Crops',
      };
    }
    if (lower.includes('live') || lower.includes('cow') || lower.includes('cattle')) {
      return {
        cardClass: styles.livestockCard,
        tagClass: styles.livestockTag,
        icon: <FaCow />,
        label: 'Livestock',
      };
    }
    if (lower.includes('poult') || lower.includes('chick')) {
      return {
        cardClass: styles.poultryCard,
        tagClass: styles.poultryTag,
        icon: <GiChicken />,
        label: 'Poultry',
      };
    }
    return {
      cardClass: '',
      tagClass: styles.genericTag,
      icon: <FaSeedling />,
      label: catName || 'Field Sector',
    };
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      const catName = p.category?.name || p.categoryName || 'General';
      map[catName] = (map[catName] || 0) + 1;
    });
    return map;
  }, [projects]);

  const uniqueCategories = useMemo(() => Object.keys(categoryCounts), [categoryCounts]);

  // Filtered & Searched projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const catName = (project.category?.name || project.categoryName || '').toLowerCase();
      const projName = (project.name || '').toLowerCase();
      const desc = (project.description || '').toLowerCase();
      const season = (project.season || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        projName.includes(q) ||
        desc.includes(q) ||
        catName.includes(q) ||
        season.includes(q);

      const matchesCat =
        selectedCategory === 'ALL' || catName === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [projects, searchQuery, selectedCategory]);

  // Summary Metrics
  const totalProjects = projects.length;
  const activeCount = projects.filter(
    (p) => String(p.status || '').toLowerCase() === 'active'
  ).length;
  const completedCount = projects.filter(
    (p) => String(p.status || '').toLowerCase() === 'completed' || String(p.status || '').toLowerCase() === 'done'
  ).length;

  const handleOpenWorkspace = (project) => {
    const catSlug = (project.category?.name || project.categoryName || 'general').toLowerCase();
    navigate(`/categories/${catSlug}/projects/${project.id}`);
  };

  if (loading) {
    return <Spinner fullPage label="Loading supervisor field workspace..." />;
  }

  return (
    <div className={styles.container}>
      {/* ── 1. Compact Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.badgeRow}>
            <p className={styles.eyebrow}>Field Operations</p>
            <span className={styles.supervisorBadge}>
              <span className={styles.liveDot} /> Supervisor
            </span>
          </div>
          <h1 className={styles.welcomeTitle}>
            {greeting}, <span className={styles.usernameText}>{user?.name || user?.username || 'Supervisor'}</span>
          </h1>
        </div>

        <div className={styles.headerQuickActions}>
          <button
            type="button"
            className={styles.headerActionBtn}
            onClick={() => navigate('/inventory')}
          >
            <FaBoxes /> Inventory Supplies
          </button>
          <button
            type="button"
            className={styles.headerActionBtn}
            onClick={() => navigate('/categories')}
          >
            <FaLayerGroup /> Categories
          </button>
        </div>
      </header>

      {/* ── Zero-State (No Assigned Projects) ── */}
      {projects.length === 0 ? (
        <div className={styles.zeroStateCard}>
          <div className={styles.zeroIconWrap}>
            <FaHardHat />
          </div>
          <h2 className={styles.zeroTitle}>No Field Projects Assigned</h2>
          <p className={styles.zeroDesc}>
            You do not currently have any active field projects assigned to your supervision. Once your Farm Manager delegates projects to your portfolio, you will be able to manage daily logs, record harvests, and coordinate field inputs right here.
          </p>
          <div className={styles.zeroActions}>
            <button
              type="button"
              className={styles.zeroPrimaryBtn}
              onClick={() => navigate('/inventory')}
            >
              Check Farm Inventory
            </button>
            <button
              type="button"
              className={styles.zeroSecBtn}
              onClick={() => navigate('/categories')}
            >
              Explore Farm Sectors
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── 2. Compact 3-Metric Overview Cards ── */}
          <section className={styles.overviewGrid}>
            <article className={styles.metricCard}>
              <div className={styles.metricIconWrap}>
                <FaHardHat />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Assigned Projects</span>
                <p className={styles.metricValue}>{totalProjects}</p>
                <span className={styles.metricSub}>
                  {activeCount} active • {completedCount} completed
                </span>
              </div>
            </article>

            <article className={styles.metricCard}>
              <div className={`${styles.metricIconWrap} ${styles.iconGreen}`}>
                <FaCheckCircle />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Active in Field</span>
                <p className={styles.metricValue}>{activeCount}</p>
                <span className={styles.metricSub}>Requiring daily updates</span>
              </div>
            </article>

            <article className={styles.metricCard}>
              <div className={`${styles.metricIconWrap} ${styles.iconAmber}`}>
                <FaLayerGroup />
              </div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Field Sectors</span>
                <p className={styles.metricValue}>{uniqueCategories.length}</p>
                <span className={styles.metricSub}>
                  {uniqueCategories.join(', ') || 'General'}
                </span>
              </div>
            </article>
          </section>

          {/* ── 3. Toolbar (Search, Filter Tabs, View Switcher) ── */}
          <section className={styles.toolbar}>
            {/* Single Clean Search Input */}
            <div className={styles.searchWrap}>
              <FaSearch className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Search projects, season, crops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                    searchInputRef.current?.blur();
                  }
                }}
              />
            </div>

            {/* Category Filter Pills */}
            <div className={styles.filterTabs}>
              <button
                type="button"
                className={`${styles.tabBtn} ${selectedCategory === 'ALL' ? styles.tabBtnActive : ''}`}
                onClick={() => setSelectedCategory('ALL')}
              >
                All <span className={styles.tabCount}>{totalProjects}</span>
              </button>

              {uniqueCategories.map((cat) => {
                const meta = getCategoryMeta(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.tabBtn} ${selectedCategory === cat ? styles.tabBtnActive : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {meta.icon} {cat}{' '}
                    <span className={styles.tabCount}>{categoryCounts[cat]}</span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle */}
            <div className={styles.viewGroup}>
              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid Cards"
              >
                <FaThLarge />
              </button>
              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <FaList />
              </button>
            </div>
          </section>

          {/* ── 4. Section Title ── */}
          <section className={styles.sectionHeader}>
            <h2>
              <FaLeaf /> Supervised Projects{' '}
              <span className={styles.countChip}>{filteredProjects.length}</span>
            </h2>
          </section>

          {loadError && projects.length === 0 ? (
            <ErrorState
              error={loadError}
              title="Could Not Load Field Projects"
              onRetry={loadProjects}
              variant="card"
            />
          ) : filteredProjects.length === 0 ? (
            /* Empty Filter Result */
            <div className={styles.zeroStateCard}>
              <div className={styles.zeroIconWrap}>
                <FaSearch />
              </div>
              <h3 className={styles.zeroTitle}>No Matching Projects</h3>
              <p className={styles.zeroDesc}>
                No projects matched "{searchQuery}". Try searching with different terms.
              </p>
              <div className={styles.zeroActions}>
                <button
                  type="button"
                  className={styles.zeroPrimaryBtn}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── GRID CARD VIEW ── */
            <div className={styles.projectsGrid}>
              {filteredProjects.map((project) => {
                const catName = project.category?.name || project.categoryName || 'General';
                const meta = getCategoryMeta(catName);
                const status = (project.status || 'Active').toLowerCase();
                const statusClass =
                  status === 'active' || status === 'in_progress'
                    ? styles.statusActive
                    : status === 'completed'
                    ? styles.statusCompleted
                    : styles.statusPlanning;

                return (
                  <article
                    key={project.id}
                    className={`${styles.projectCard} ${meta.cardClass}`}
                  >
                    {/* Top Row: Category Tag & Status */}
                    <div className={styles.cardTop}>
                      <span className={`${styles.categoryTag} ${meta.tagClass}`}>
                        {meta.icon} {catName}
                      </span>
                      <span className={`${styles.statusTag} ${statusClass}`}>
                        <span className={styles.statusDot} />
                        {project.status || 'Active'}
                      </span>
                    </div>

                    {/* Main Content: Title & Clamped Description */}
                    <div className={styles.cardMain}>
                      <h3 className={styles.projectName}>{project.name}</h3>
                      <p className={styles.projectDesc}>
                        {project.description ||
                          'No detailed narrative description recorded for this field project.'}
                      </p>
                    </div>

                    {/* Meta Row: Season & Timeline */}
                    {(project.season || project.startDate || project.endDate) && (
                      <div className={styles.metaRow}>
                        {project.season && (
                          <div className={styles.metaItem}>
                            <FaCalendarAlt className={styles.metaIcon} />
                            <span><strong>{project.season}</strong></span>
                          </div>
                        )}
                        {(project.startDate || project.endDate) && (
                          <div className={styles.metaItem}>
                            <FaClock className={styles.metaIcon} />
                            <span>{project.startDate || '—'} → {project.endDate || 'Ongoing'}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card Footer: Action Button */}
                    <div className={styles.cardFooter}>
                      <button
                        type="button"
                        className={styles.openWorkspaceBtn}
                        onClick={() => handleOpenWorkspace(project)}
                      >
                        <span>Open Field Workspace</span>
                        <FaArrowRight />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* ── HIGH-DENSITY TABLE VIEW ── */
            <div className={styles.tableWrapper}>
              <table className={styles.denseTable}>
                <thead>
                  <tr>
                    <th>Sector</th>
                    <th>Project Name & Description</th>
                    <th>Season</th>
                    <th>Timeline</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => {
                    const catName = project.category?.name || project.categoryName || 'General';
                    const meta = getCategoryMeta(catName);
                    const status = (project.status || 'Active').toLowerCase();
                    const statusClass =
                      status === 'active' || status === 'in_progress'
                        ? styles.statusActive
                        : status === 'completed'
                        ? styles.statusCompleted
                        : styles.statusPlanning;

                    return (
                      <tr key={project.id}>
                        <td>
                          <span className={`${styles.categoryTag} ${meta.tagClass}`}>
                            {meta.icon} {catName}
                          </span>
                        </td>
                        <td>
                          <div className={styles.tableProjectTitle}>{project.name}</div>
                          <div className={styles.tableProjectSub}>
                            {project.description || 'No description recorded.'}
                          </div>
                        </td>
                        <td>
                          {project.season ? (
                            <strong>{project.season}</strong>
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem' }}>
                            {project.startDate || '—'} → {project.endDate || 'Ongoing'}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusTag} ${statusClass}`}>
                            <span className={styles.statusDot} />
                            {project.status || 'Active'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className={styles.tableActionBtn}
                            onClick={() => handleOpenWorkspace(project)}
                          >
                            <span>Workspace</span>
                            <FaArrowRight />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
