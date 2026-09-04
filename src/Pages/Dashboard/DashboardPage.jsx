import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { getProjectsByCategory } from '../../APIs/project';
import { getSeasons } from '../../APIs/season';
import { getCategories } from '../../APIs/category';
import { FaChartBar, FaLeaf, FaMoneyBillWave, FaPiggyBank, FaCalendarAlt, FaArrowRight, FaFolderPlus, FaHardHat, FaUserTie } from 'react-icons/fa';
import { GiChicken } from 'react-icons/gi';
import FaCow from '../../Icons/FaCow';
import { requestProjectsSummary } from '../../APIs/dashboard';
import DonutChart from './DonutChart';
import { Spinner } from '../../Components/Spinner/Spinner';
import useAuth from '../../useAuth';

const categoryMeta = [
  { id:'C001', slug: 'crops', name: 'Crops', icon: <FaLeaf className={styles.categoryIcon} />, accent: styles.cropAccent },
  { id:'L002', slug: 'livestock', name: 'Livestock', icon: <FaCow className={styles.categoryIcon} />, accent: styles.livestockAccent },
  { id:'P003' ,slug: 'poultry', name: 'Poultry', icon: <GiChicken className={styles.categoryIcon} />, accent: styles.poultryAccent },
];

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.body?.content && Array.isArray(response.body.content)) return response.body.content;
  if (response && Array.isArray(response.body)) return response.body;
  return [];
};

export function DashboardPage() {
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const isManager = currentUser?.role?.toUpperCase() === 'MANAGER';
  const isSupervisor = currentUser?.role?.toUpperCase() === 'SUPERVISOR';
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
  const canCreateCategories = currentUser?.privileges?.includes('CAN_CREATE_CATEGORIES') || isAdmin;

  const [categoryData, setCategoryData] = useState([]);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projectsSummary, setProjectsSummary] = useState({});

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const categoriesResponse = await getCategories().catch(() => ({ body: [] }));
        const realCategories = normalizeArrayResponse(categoriesResponse);

        const projectResults = await Promise.all(
          realCategories.map(async (category) => {
            const response = await getProjectsByCategory(category.id, category.name.toLowerCase()).catch(() => []);
            const projects = normalizeArrayResponse(response);
            const totalBudget = projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
            const activeProjects = projects.filter((project) => String(project.status).toLowerCase() === 'active').length;

            const meta = categoryMeta.find(m => m.slug === category.name.toLowerCase()) || {
              icon: <FaChartBar className={styles.categoryIcon} />,
              accent: ''
            };

            return {
              id: category.id,
              slug: category.name.toLowerCase(),
              name: category.name.charAt(0).toUpperCase() + category.name.slice(1),
              icon: meta.icon,
              accent: meta.accent,
              projectCount: projects.length,
              totalBudget,
              activeProjects,
              detail: `${activeProjects} active project${activeProjects === 1 ? '' : 's'} in ${category.name.toLowerCase()}`,
            };
          })
        );

        const seasonResponse = await getSeasons().catch(() => ({ body: [] }));
        const seasons = normalizeArrayResponse(seasonResponse);

        setCategoryData(projectResults);
        setScheduleCount(seasons.length);
      } catch {
        setCategoryData([]);
        setScheduleCount(0);
      } finally {
        setLoading(false);
      }
    };

    const loadProjectsSummary = async () => { 
      try {
        const request = await requestProjectsSummary();
        const response = request.body;
        setProjectsSummary(response || {});
      } catch (err) {
        setProjectsSummary({});
      }
    };

    loadDashboard();
    loadProjectsSummary();
  }, []);

  const totalBudget = categoryData.reduce((sum, current) => sum + Number(current.totalBudget || 0), 0);
  const totalProjects = categoryData.reduce((sum, current) => sum + Number(current.projectCount || 0), 0);
  const activeProjects = categoryData.reduce((sum, current) => sum + Number(current.activeProjects || 0), 0);

  // ── Dynamic Zero-State Detection ──
  const isManagerZeroState = isManager && categoryData.length === 0;
  const isSupervisorZeroState = isSupervisor && (categoryData.length === 0 || (projectsSummary?.allCount === 0 && totalProjects === 0));

  // ── Scoped Overview Cards ──
  const overviewCards = isSupervisor ? [
    {
      label: 'Supervised Projects',
      value: projectsSummary?.allCount > 0 ? projectsSummary.allCount : totalProjects,
      note: 'Field projects currently assigned to your supervision',
      icon: <FaHardHat className={styles.metricIcon} />,
    },
    {
      label: 'Active Projects',
      value: projectsSummary?.activeCount > 0 ? projectsSummary.activeCount : activeProjects,
      note: 'Projects actively in progress requiring daily field logs',
      icon: <FaChartBar className={styles.metricIcon} />,
    },
    {
      label: 'Operation Status',
      value: 'Active',
      note: 'Field data logging and harvest recording active',
      icon: <FaLeaf className={styles.metricIcon} />,
    }
  ] : [ 
    {
      label: 'Projects tracked',
      value: projectsSummary?.allCount > 0 ? projectsSummary.allCount : 0,
      note: isManager ? 'Total projects within your assigned categories' : 'Total projects created across every category',
      icon: <FaChartBar className={styles.metricIcon} />,
      progressPercent: totalProjects ? Math.round((activeProjects / Math.max(1, totalProjects)) * 100) : 0
    },
    {
      label: isManager ? 'Sector budget' : 'Category budget',
      value: `Ksh. ${projectsSummary?.totalBudget > 0 ? projectsSummary.totalBudget.toLocaleString() : totalBudget.toLocaleString()}`,
      note: isManager ? 'Combined budget for your assigned sectors' : 'Combined project budgets across all farm sectors',
      icon: <FaMoneyBillWave className={styles.metricIcon} />,
      progressPercent: totalBudget ? 100 : 0
    },
    {
      label: 'Active projects',
      value: projectsSummary?.activeCount > 0 ? projectsSummary.activeCount : 0,
      note: 'Projects currently marked as active',
      icon: <FaPiggyBank className={styles.metricIcon} />,
      progressPercent: totalProjects ? Math.round((activeProjects / Math.max(1, totalProjects)) * 100) : 0
    },
  ];

  return (
    <div className={styles.container}>
      {loading ? (
        <Spinner fullPage label="Loading farm data..." />
      ) : isManagerZeroState ? (
        /* ── Zero-State Hero Card for Manager (0 Categories) ── */
        <div className={styles.zeroStateCard}>
          <div className={styles.zeroStateIconWrap}>
            <FaUserTie />
          </div>
          <h2 className={styles.zeroStateTitle}>No Assigned Farm Sectors</h2>
          <p className={styles.zeroStateDesc}>
            You currently do not have any farm categories assigned to your management portfolio. Once your Farm Administrator delegates sectors to you, your category projects and supervisor workflows will appear here.
          </p>
          <div className={styles.zeroStateActions}>
            {canCreateCategories && (
              <button 
                type="button" 
                className={styles.zeroActionBtn}
                onClick={() => navigate('/categories/new')}
              >
                <FaFolderPlus /> Create New Category
              </button>
            )}
            <button 
              type="button" 
              className={styles.zeroSecBtn}
              onClick={() => navigate('/users')}
            >
              Manage Team & Supervisors
            </button>
          </div>
        </div>
      ) : isSupervisorZeroState ? (
        /* ── Zero-State Hero Card for Supervisor (0 Projects) ── */
        <div className={styles.zeroStateCard}>
          <div className={styles.zeroStateIconWrap}>
            <FaHardHat />
          </div>
          <h2 className={styles.zeroStateTitle}>No Field Projects Assigned</h2>
          <p className={styles.zeroStateDesc}>
            You are not currently assigned to oversee any active field projects. Please contact your Farm Manager to assign you to a project so you can start recording harvests, logging daily activities, and tracking field inputs.
          </p>
          <div className={styles.zeroStateActions}>
            <button 
              type="button" 
              className={styles.zeroSecBtn}
              onClick={() => navigate('/inventory')}
            >
              View Available Inventory
            </button>
          </div>
        </div>
      ) : (
        /* ── Standard Populated Dashboard ── */
        <>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>
                {isSupervisor ? 'Field Operations Overview' : isManager ? 'Sector Management Overview' : 'Farm Overview'}
              </p>
              <h1>
                {isSupervisor ? 'Supervisor Field Dashboard' : isManager ? 'Manager Sector Dashboard' : 'Smart Farm Dashboard'}
              </h1>
            </div>
          </header>

          <section className={styles.overviewGrid}>
            {overviewCards.map((card) => (
              <article key={card.label} className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricIconWrap}>{card.icon}</span>
                  <span className={styles.metricLabel}>{card.label}</span>
                </div>
                <p className={styles.metricValue}>{card.value}</p>
                <small>{card.note}</small>
              </article>
            ))}
          </section>

          {/* 2. Charts & Summary Panels (Hidden Financials for Supervisor) */}
          <section className={styles.lowerGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3>Projects by Category</h3>
              </div>
              <DonutChart
                segments={categoryData.map((c) => {
                  const colors = { crops: '#22c55e', livestock: '#f59e0b', poultry: '#3b82f6' };
                  return {
                    label: c.name,
                    value: c.projectCount,
                    color: colors[c.slug] || '#8bb4d9'
                  };
                })}
              />
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3>{isSupervisor ? 'Assigned Categories' : 'Farm Summary'}</h3>
              </div>
              <ul className={styles.summaryList}>
                {categoryData.map((category) => (
                  <li key={category.slug}>
                    <button type="button" className={styles.summaryButton} onClick={() => navigate(`/categories/${category.id}/${category.slug}`)}>
                      <span>{category.name}</span>
                    </button>
                    <strong>
                      {isSupervisor 
                        ? `${category.projectCount} project(s)` 
                        : category.projectCount ? `Ksh. ${category.totalBudget.toLocaleString()}` : 'No data'}
                    </strong>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          {/* 3. Category Cards */}
          <section className={styles.categorySection}>
            {categoryData.map((category) => (
              <article key={category.slug} className={`${styles.categoryCard} ${category.accent}`}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryIconWrap}>{category.icon}</div>
                  <div>
                    <p className={styles.categoryName}>{category.name}</p>
                    <h2>
                      {isSupervisor 
                        ? `${category.projectCount} Active Project${category.projectCount === 1 ? '' : 's'}`
                        : category.projectCount ? `Ksh. ${category.totalBudget.toLocaleString()}` : 'No project data'}
                    </h2>
                  </div>
                </div>
                <p className={styles.categoryDetail}>{category.detail}</p>
                <button
                  type="button"
                  className={styles.categoryFooter}
                  onClick={() => navigate(`/categories/${category.id}/${category.slug}`)}
                >
                  <span>{category.projectCount > 0 ? 'Open category' : 'Create first project'}</span>
                  <span className={styles.arrow}>→</span>
                </button>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
