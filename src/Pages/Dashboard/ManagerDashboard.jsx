import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { getProjectsByCategory } from '../../APIs/project';
import { getCategories } from '../../APIs/category';
import { 
  FaChartBar, 
  FaLeaf, 
  FaMoneyBillWave, 
  FaPiggyBank, 
  FaFolderPlus, 
  FaUserTie 
} from 'react-icons/fa';
import { GiChicken } from 'react-icons/gi';
import FaCow from '../../Icons/FaCow';
import { requestProjectsSummary } from '../../APIs/dashboard';
import DonutChart from './DonutChart';
import { Spinner } from '../../Components/Spinner/Spinner';

const categoryMeta = [
  { id: 'C001', slug: 'crops', name: 'Crops', icon: <FaLeaf className={styles.categoryIcon} />, accent: styles.cropAccent },
  { id: 'L002', slug: 'livestock', name: 'Livestock', icon: <FaCow className={styles.categoryIcon} />, accent: styles.livestockAccent },
  { id: 'P003', slug: 'poultry', name: 'Poultry', icon: <GiChicken className={styles.categoryIcon} />, accent: styles.poultryAccent },
];

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.body?.content && Array.isArray(response.body.content)) return response.body.content;
  if (response && Array.isArray(response.body)) return response.body;
  return [];
};

export default function ManagerDashboard({ user }) {
  const navigate = useNavigate();
  const isManager = user?.role?.toUpperCase() === 'MANAGER';
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const canCreateCategories = user?.privileges?.includes('CAN_CREATE_CATEGORIES') || isAdmin;

  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsSummary, setProjectsSummary] = useState({});

  useEffect(() => {
    let isMounted = true;

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

            const meta = categoryMeta.find((m) => m.slug === category.name.toLowerCase()) || {
              icon: <FaChartBar className={styles.categoryIcon} />,
              accent: '',
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

        if (isMounted) {
          setCategoryData(projectResults);
        }
      } catch {
        if (isMounted) {
          setCategoryData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const loadProjectsSummary = async () => {
      try {
        const request = await requestProjectsSummary();
        const response = request.body;
        if (isMounted) {
          setProjectsSummary(response || {});
        }
      } catch {
        if (isMounted) {
          setProjectsSummary({});
        }
      }
    };

    loadDashboard();
    loadProjectsSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalBudget = categoryData.reduce((sum, current) => sum + Number(current.totalBudget || 0), 0);
  const totalProjects = categoryData.reduce((sum, current) => sum + Number(current.projectCount || 0), 0);
  const activeProjects = categoryData.reduce((sum, current) => sum + Number(current.activeProjects || 0), 0);

  // ── Zero-State Detection ──
  const isZeroState = categoryData.length === 0;

  const overviewCards = [
    {
      label: 'Projects tracked',
      value: projectsSummary?.allCount > 0 ? projectsSummary.allCount : totalProjects,
      note: isManager ? 'Total projects within your assigned categories' : 'Total projects created across every category',
      icon: <FaChartBar className={styles.metricIcon} />,
    },
    {
      label: isManager ? 'Sector budget' : 'Category budget',
      value: `Ksh. ${projectsSummary?.totalBudget > 0 ? projectsSummary.totalBudget.toLocaleString() : totalBudget.toLocaleString()}`,
      note: isManager ? 'Combined budget for your assigned sectors' : 'Combined project budgets across all farm sectors',
      icon: <FaMoneyBillWave className={styles.metricIcon} />,
    },
    {
      label: 'Active projects',
      value: projectsSummary?.activeCount > 0 ? projectsSummary.activeCount : activeProjects,
      note: 'Projects currently marked as active in field operations',
      icon: <FaPiggyBank className={styles.metricIcon} />,
    },
  ];

  if (loading) {
    return <Spinner fullPage label="Loading farm portfolio..." />;
  }

  return (
    <div className={styles.container}>
      {isZeroState ? (
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
      ) : (
        /* ── Populated Financial & Category Dashboard ── */
        <>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>
                {isManager ? 'Sector Management Overview' : 'Farm Portfolio Overview'}
              </p>
              <h1>
                {isManager ? 'Manager Sector Dashboard' : 'Smart Farm Executive Dashboard'}
              </h1>
            </div>
            {canCreateCategories && (
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => navigate('/categories/new')}
              >
                <FaFolderPlus /> Add Category
              </button>
            )}
          </header>

          {/* 1. Overview Metric Cards */}
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

          {/* 2. Charts & Summary Panels */}
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
                    color: colors[c.slug] || '#8bb4d9',
                  };
                })}
              />
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3>{isManager ? 'Sector Financial Summary' : 'Category Financial Summary'}</h3>
              </div>
              <ul className={styles.summaryList}>
                {categoryData.map((category) => (
                  <li key={category.slug}>
                    <button
                      type="button"
                      className={styles.summaryButton}
                      onClick={() => navigate(`/categories/${category.id}/${category.slug}`)}
                    >
                      <span>{category.name}</span>
                    </button>
                    <strong>
                      {category.projectCount
                        ? `Ksh. ${category.totalBudget.toLocaleString()}`
                        : 'No active projects'}
                    </strong>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          {/* 3. Category Sector Cards */}
          <section className={styles.categorySection}>
            {categoryData.map((category) => (
              <article
                key={category.slug}
                className={`${styles.categoryCard} ${category.accent}`}
              >
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryIconWrap}>{category.icon}</div>
                  <div>
                    <p className={styles.categoryName}>{category.name}</p>
                    <h2>
                      {category.projectCount
                        ? `Ksh. ${category.totalBudget.toLocaleString()}`
                        : 'No project budget'}
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
