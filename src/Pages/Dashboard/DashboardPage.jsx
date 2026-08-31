import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { getProjectsByCategory } from '../../APIs/project';
import { getSeasons } from '../../APIs/season';
import { getCategories } from '../../APIs/category';
import { FaChartBar, FaLeaf, FaMoneyBillWave, FaPiggyBank, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import { GiChicken } from 'react-icons/gi';
import FaCow from '../../Icons/FaCow';
import { requestProjectsSummary } from '../../APIs/dashboard';
import DonutChart from './DonutChart';
const categoryMeta = [
  { id:'C001', slug: 'crops', name: 'Crops', icon: <FaLeaf className={styles.categoryIcon} />, accent: styles.cropAccent },
  { id:'L002', slug: 'livestock', name: 'Livestock', icon: <FaCow className={styles.categoryIcon} />, accent: styles.livestockAccent },
  { id:'P003' ,slug: 'poultry', name: 'Poultry', icon: <GiChicken className={styles.categoryIcon} />, accent: styles.poultryAccent },
];

const normalizeArrayResponse = (response) => {
  if (Array.isArray(response)) return response;
  // Paginated response: body is a Page object with a content array
  if (response?.body?.content && Array.isArray(response.body.content)) return response.body.content;
  // Plain list response: body is a direct array
  if (response && Array.isArray(response.body)) return response.body;
  return [];
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [categoryData, setCategoryData] = useState([]);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const[projectsSummary, setProjectsSummary] = useState({});

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // 1. Fetch real categories from backend
        const categoriesResponse = await getCategories().catch(() => ({ body: [] }));
        const realCategories = normalizeArrayResponse(categoriesResponse);

        // 2. Fetch projects for each real category and merge with visual metadata
        const projectResults = await Promise.all(
          realCategories.map(async (category) => {
            const response = await getProjectsByCategory(category.id, category.name.toLowerCase()).catch(() => []);
            const projects = normalizeArrayResponse(response);
            const totalBudget = projects.reduce((sum, project) => sum + Number(project.budget || 0), 0);
            const activeProjects = projects.filter((project) => String(project.status).toLowerCase() === 'active').length;

            // Find visual metadata (icons/colors) matching the category name
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

      const loadProjectsSummary = async()=>{ 
        try{
          const request = await requestProjectsSummary();
          const response = request.body;
          setProjectsSummary(response);
        }catch(err){
          setProjectsSummary({});
        }
      }

    loadDashboard();
    loadProjectsSummary();
  }, []);

  const totalBudget = categoryData.reduce((sum, current) => sum + Number(current.totalBudget || 0), 0);
  const totalProjects = categoryData.reduce((sum, current) => sum + Number(current.projectCount || 0), 0);
  const activeProjects = categoryData.reduce((sum, current) => sum + Number(current.activeProjects || 0), 0);

  const overviewCards = [ 
    {
      label: 'Projects tracked',
      value: projectsSummary?.allCount >0 ? projectsSummary.allCount : 0 ,
      note: 'Total projects created across every category',
      icon: <FaChartBar className={styles.metricIcon} />,
      progressPercent: totalProjects ? Math.round((activeProjects / Math.max(1, totalProjects)) * 100) : 0
    },
    {
      label: 'Category budget',
      value: `Ksh. ${projectsSummary?.totalBudget > 0 ? projectsSummary.totalBudget.toLocaleString() : 0}`,
      note: 'Combined project budgets from the app data',
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


  const defaultCategorySlug = categoryData[0]?.slug || 'crops';
  const defaultCategoryId = categoryData[0]?.id || 'C001';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Farm overview</p>
          <h1>Smart farm dashboard</h1>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={() => navigate('/categories')}>
          <FaCalendarAlt />
          View schedule
        </button>
      </header>

      <section className={styles.overviewGrid}>
        {overviewCards.map((card) => (
          <article key={card.label} className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricIconWrap}>{card.icon}</span>
              <span className={styles.metricLabel}>{card.label}</span>
            </div>
            <p className={styles.metricValue}>{card.value}</p>
            {card.spark && <Sparkline data={card.spark} color="#9ed7ff" />}
            <small>{card.note}</small>


          </article>
        ))}
      </section>

      <section className={styles.categorySection}>
        {categoryData.map((category) => (
          <article key={category.slug} className={`${styles.categoryCard} ${category.accent}`}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryIconWrap}>{category.icon}</div>
              <div>
                <p className={styles.categoryName}>{category.name}</p>
                <h2>{category.projectCount ? `Ksh. ${category.totalBudget.toLocaleString()}` : 'No project data'}</h2>
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

      <section className={styles.lowerGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Projects by category</h3>
          </div>
          <DonutChart
            segments={categoryData.map((c) => {
              // Assign colors based on category slug
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
            <h3>Farm summary</h3>
          </div>
          <ul className={styles.summaryList}>
            {categoryData.map((category) => (
              <li key={category.slug}>
                <button type="button" className={styles.summaryButton} onClick={() => navigate(`/categories/${category.slug}`)}>
                  <span>{category.name}</span>
                </button>
                <strong>{category.projectCount ? `Ksh. ${category.totalBudget.toLocaleString()}` : 'No data'}</strong>
              </li>
            ))}
          </ul>
        </article>

          </section>

      {loading && <div className={styles.loading}>Loading dashboard data...</div>}
    </div>
  );
}
