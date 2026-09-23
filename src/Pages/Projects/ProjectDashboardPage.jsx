import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ProjectDashboardPage.module.css';
import { getProjectById, updateProject, deleteProject } from '../../APIs/project';
import { createExpense, updateExpense, deleteExpense } from '../../APIs/expense';
import { recordSale, updateSale, deleteSale, requestAllCustomers } from '../../APIs/sales';
import { recordHarvest, updateHarvest, deleteHarvest, getHarvestInventory } from '../../APIs/harvest';
import { recordActivity, updateActivity, deleteActivity, updateActivityStatus } from '../../APIs/activity';
import { getInventoryItems } from '../../APIs/inventory';
import { ActivityLaborModal } from '../../Components/Labor/ActivityLaborModal';
import { notify, alertModal, confirmModal } from '../../utils/notify';
import { Spinner } from '../../Components/Spinner/Spinner';
import { ErrorState } from '../../Components/ErrorState/ErrorState';
import useAuth from '../../useAuth';
import { toBaseUnit, toCompoundDisplay, getUnit, isCustomUnit, formatHarvestStock } from '../../utils/units';

// Modular Sub-Components
import { ProjectHeader } from './components/ProjectHeader';
import { ProjectFinancialSummary } from './components/ProjectFinancialSummary';
import { ProjectTabs } from './components/ProjectTabs';
import { ExpensesTab } from './components/ExpensesTab';
import { ActivitiesTab } from './components/ActivitiesTab';
import { SalesTab } from './components/SalesTab';
import { HarvestTab } from './components/HarvestTab';
import { RecentRecordsSidebar } from './components/RecentRecordsSidebar';
import { CustomerInfoModal, CustomerListModal } from './components/CustomerModals';
import { UseSuppliesModal } from './components/UseSuppliesModal';
import { EditProjectModal } from './components/EditProjectModal';
import { EditRecordModal } from './components/EditRecordModal';

const initialForm = {
  expenses: { title: '', unitPrice: '', quantity: '', amount: '', notes: '' },
  activities: {
    title: '',
    type: '',
    notes: '',
    scheduledDate: '',
    dueDate: '',
    priority: 'MEDIUM',
    status: 'SCHEDULED',
  },
  sales: { item: '', quantity: '', unit_price: '', amount_paid: '', payment_mode: 'CASH' },
  harvest: { item: '', quantity: '', units: '', notes: '', customFactor: '' },
};

const unwrapResponse = (response) => {
  if (response && response.body !== undefined) return response.body;
  if (response && response.data !== undefined) return response.data;
  return response;
};

export function ProjectDashboardPage() {
  const { category, projectId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuth((state) => state.user);
  const userRole = (currentUser?.role || '').toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';
  const isSupervisor = userRole === 'SUPERVISOR';
  const userPrivileges = currentUser?.privileges || [];

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [openCustomerForm, setOpenCustomerForm] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [selectedActivityForLabor, setSelectedActivityForLabor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [openCustomerList, setOpenCustomerList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Privileges
  const canEditProject = isAdmin || (isManager && userPrivileges.includes('CAN_MANAGE_BUDGETS'));
  const canUseSupplies =
    isAdmin || isManager || (isSupervisor && userPrivileges.includes('CAN_USE_INVENTORY'));
  const canModifyRecord = !isSupervisor;

  const canRecordInTab = useMemo(() => {
    if (isAdmin || isManager) return true;
    if (isSupervisor) {
      if (activeTab === 'expenses') return userPrivileges.includes('CAN_RECORD_EXPENSES');
      if (activeTab === 'sales') return userPrivileges.includes('CAN_RECORD_SALES');
      if (activeTab === 'harvest') return userPrivileges.includes('CAN_RECORD_HARVEST');
      if (activeTab === 'activities') return userPrivileges.includes('CAN_LOG_ACTIVITIES');
    }
    return false;
  }, [isAdmin, isManager, isSupervisor, activeTab, userPrivileges]);

  // Inventory usage
  const [useSuppliesModalOpen, setUseSuppliesModalOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [harvestInventoryStock, setHarvestInventoryStock] = useState([]);

  // Edit Record State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editRecordForm, setEditRecordForm] = useState({});

  // Edit Project State
  const [editingProject, setEditingProject] = useState(false);
  const [projectEditForm, setProjectEditForm] = useState({
    name: '',
    season: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'active',
    description: '',
  });

  const categoryLabel = useMemo(
    () => (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Project'),
    [category]
  );

  // Available harvest produce for sales — sourced from the harvest_inventory table
  const harvestStock = useMemo(() => {
    if (!project) return [];
    const projectName = project.name;
    return harvestInventoryStock
      .filter(entry => entry.projectName === projectName)
      .map(entry => {
        const item = entry.item_name || entry.itemName;
        const units = entry.base_unit || entry.baseUnit || entry.units;
        const available = Number(entry.available_quantity ?? entry.availableQuantity ?? 0);
        return {
          item,
          units,
          available,
          displayAvailable: formatHarvestStock(entry),
        };
      });
  }, [harvestInventoryStock, project]);

  // Project Deletion: Only allow if project has zero records referencing it
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const hasAnyRecords = useMemo(() => {
    if (!project) return true;
    const expCount = Array.isArray(project.expenses) ? project.expenses.length : 0;
    const salesCount = Array.isArray(project.sales) ? project.sales.length : 0;
    const harvestCount = Array.isArray(project.harvest) ? project.harvest.length : 0;
    const actCount = Array.isArray(project.activities) ? project.activities.length : 0;
    const backendHasRecords = project.hasRecords !== undefined ? project.hasRecords : false;
    return expCount > 0 || salesCount > 0 || harvestCount > 0 || actCount > 0 || backendHasRecords;
  }, [project]);

  const canDeleteProject = canEditProject && !hasAnyRecords;

  const handleDeleteProject = () => {
    if (!canDeleteProject) return;
    confirmModal(
      `Are you sure you want to delete project "${project?.name || ''}"? This project has no active records and will be permanently removed.`,
      async () => {
        setIsDeletingProject(true);
        try {
          await deleteProject(projectId);
          notify('Project deleted successfully ✅', 'success');
          navigate(-1);
        } catch (err) {
          alertModal(err?.message || 'Failed to delete project.', 'error');
        } finally {
          setIsDeletingProject(false);
        }
      }
    );
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [projectRes, customersRes, harvestStockRes] = await Promise.allSettled([
        getProjectById(projectId),
        requestAllCustomers(),
        getHarvestInventory(),
      ]);

      if (projectRes.status === 'fulfilled') {
        setProject(unwrapResponse(projectRes.value));
      } else {
        setProject(null);
        setLoadError(projectRes.reason);
        const errMsg = projectRes.reason?.message || 'Failed to load project details';
        if (
          errMsg.toLowerCase().includes('access denied') ||
          errMsg.toLowerCase().includes('not assigned')
        ) {
          alertModal(errMsg || 'Access Denied: You are not assigned to this project.', 'error');
          navigate('/');
          return;
        }
        notify(errMsg, 'error');
      }

      if (customersRes.status === 'fulfilled') {
        const custData = unwrapResponse(customersRes.value);
        setCustomers(Array.isArray(custData) ? custData : []);
      } else {
        setCustomers([]);
      }

      if (harvestStockRes.status === 'fulfilled') {
        setHarvestInventoryStock(harvestStockRes.value?.body || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshStock = async () => {
    try {
      const invRes = await getHarvestInventory();
      if (invRes?.body) {
        setHarvestInventoryStock(invRes.body);
      }
    } catch {
      // non-blocking
    }
  };

  // Load project and customer data
  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  // Customer handlers
  const handleCustomerSave = (data) => {
    setCustomerData(data);
    setOpenCustomerForm(false);
    setOpenCustomerList(false);
    setShowRecordForm(true);
    notify(`Customer attached: ${data.name} ✅`, 'success');
  };

  // Form field changes
  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      const updated = {
        ...current,
        [activeTab]: {
          ...current[activeTab],
          [name]: value,
        },
      };

      if (activeTab === 'expenses' && (name === 'unitPrice' || name === 'quantity')) {
        const up = parseFloat(updated.expenses.unitPrice) || 0;
        const q = parseFloat(updated.expenses.quantity) || 0;
        if (up > 0 && q > 0) {
          updated.expenses.amount = (up * q).toString();
        }
      }

      return updated;
    });
  };

  // Form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    let payload = {
      ...form[activeTab],
      project_id: projectId,
    };

    if (activeTab === 'harvest') {
      const unitKey = form.harvest.units;
      const rawQty = Number(form.harvest.quantity) || 0;
      const customFactor = Number(form.harvest.customFactor) || null;
      if (isCustomUnit(unitKey) && !customFactor) {
        alertModal('Please enter the conversion factor for your custom unit.', 'warning');
        setIsSubmitting(false);
        return;
      }
      const baseQty = toBaseUnit(rawQty, unitKey, customFactor);
      if (baseQty === null) {
        alertModal('Could not convert quantity to base unit. Please check your unit selection.', 'error');
        setIsSubmitting(false);
        return;
      }
      payload.quantity = baseQty;
      payload.base_unit = getUnit(unitKey)?.baseUnit || unitKey;
      payload.display_unit = unitKey;
      // Remove customFactor from payload (backend doesn't need it)
      delete payload.customFactor;
    }

    if (activeTab === 'sales') {
      const saleQty = Number(form.sales.quantity) || 0;
      const saleUnitPrice = Number(form.sales.unit_price) || 0;
      const saleTotal = saleQty * saleUnitPrice;
      const paid =
        form.sales.amount_paid !== ''
          ? Number(form.sales.amount_paid)
          : form.sales.payment_mode === 'CREDIT_LEDGER'
          ? 0
          : saleTotal;
      const balanceDue = Math.max(0, saleTotal - paid);

      if (balanceDue > 0 && !customerData) {
        alertModal(
          `A customer must be attached when the amount paid (Ksh ${paid.toLocaleString()}) is less than the required total amount (Ksh ${saleTotal.toLocaleString()}). Outstanding balance: Ksh ${balanceDue.toLocaleString()}`,
          'warning'
        );
        setIsSubmitting(false);
        return;
      }

      payload.amount_paid = paid;
      payload.payment_mode = form.sales.payment_mode || 'CASH';

      if (customerData) {
        if (customerData.id) {
          payload.customer_id = customerData.id;
        } else {
          payload.customer = customerData;
        }
      }
    }

    try {
      let res;
      if (activeTab === 'expenses') {
        res = await createExpense(payload);
      } else if (activeTab === 'sales') {
        res = await recordSale(payload);
        setCustomerData(null);
      } else if (activeTab === 'harvest') {
        res = await recordHarvest(payload);
      } else if (activeTab === 'activities') {
        res = await recordActivity(payload);
      }

      const msg = res?.message || `${activeTab.slice(0, -1) || activeTab} recorded successfully ✅`;
      notify(msg, 'success');

      // Refresh project and customer data
      const [refreshedProject, refreshedCustomers] = await Promise.allSettled([
        getProjectById(projectId),
        requestAllCustomers(),
      ]);

      if (refreshedProject.status === 'fulfilled') {
        setProject(unwrapResponse(refreshedProject.value));
      }
      if (refreshedCustomers.status === 'fulfilled') {
        const cData = unwrapResponse(refreshedCustomers.value);
        setCustomers(Array.isArray(cData) ? cData : []);
      }

      if (activeTab === 'harvest' || activeTab === 'sales') {
        refreshStock();
      }

      setForm(initialForm);
      setShowRecordForm(false);
    } catch (error) {
      alertModal(error?.message || 'Unable to save record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record Editing
  const handleOpenEditRecord = (tab, record) => {
    setEditingRecord({ tab, item: record });
    if (tab === 'expenses') {
      setEditRecordForm({
        title: record.title || '',
        unitPrice: record.unitPrice || '',
        quantity: record.quantity || '',
        amount: record.amount || '',
        notes: record.notes || '',
      });
    } else if (tab === 'sales') {
      setEditRecordForm({
        item: record.item || '',
        quantity: record.quantity || '',
        unit_price: record.unit_price || record.unitPrice || '',
      });
    } else if (tab === 'harvest') {
      setEditRecordForm({
        item: record.item || '',
        quantity: record.quantity || '',
        units: record.units || '',
        notes: record.notes || '',
      });
    } else if (tab === 'activities') {
      setEditRecordForm({
        title: record.title || '',
        type: record.type || '',
        notes: record.notes || '',
        scheduledDate: record.scheduledDate || record.scheduled_date || record.added_on || '',
        dueDate: record.dueDate || record.due_date || '',
        priority: record.priority || 'MEDIUM',
        status: record.status || 'SCHEDULED',
      });
    }
  };

  const handleToggleActivityStatus = async (activity) => {
    const isCompleted = (activity.status || '').toUpperCase() === 'COMPLETED';
    const nextStatus = isCompleted ? 'SCHEDULED' : 'COMPLETED';
    try {
      const res = await updateActivityStatus(activity.id, nextStatus);
      notify(res?.message || `Task marked as ${nextStatus === 'COMPLETED' ? 'completed' : 'scheduled'} ✅`, 'success');
      const refreshedProject = await getProjectById(projectId);
      if (refreshedProject) setProject(unwrapResponse(refreshedProject));
    } catch (err) {
      notify(err?.message || 'Failed to update task status', 'error');
    }
  };

  const handleSaveEditRecord = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsSubmitting(true);
    try {
      let res;
      const { tab, item } = editingRecord;
      if (tab === 'expenses') {
        res = await updateExpense(item.id, editRecordForm);
      } else if (tab === 'sales') {
        res = await updateSale(item.id, editRecordForm);
      } else if (tab === 'harvest') {
        res = await updateHarvest(item.id, editRecordForm);
      } else if (tab === 'activities') {
        res = await updateActivity(item.id, editRecordForm);
      }

      notify(res?.message || `${tab.slice(0, -1)} updated successfully ✅`, 'success');
      setEditingRecord(null);

      const refreshedProject = await getProjectById(projectId);
      if (refreshedProject) setProject(unwrapResponse(refreshedProject));
      if (tab === 'harvest' || tab === 'sales') {
        refreshStock();
      }
    } catch (err) {
      alertModal(err?.message || 'Failed to update record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (tab, record) => {
    const typeLabel = tab === 'harvest' ? 'harvest' : tab.slice(0, -1);
    const label = record.title || record.item || 'record';
    const confirmed = await confirmModal({
      title: `Delete ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}`,
      message: `Are you sure you want to delete this ${typeLabel}: "${label}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!confirmed) return;
    try {
      let res;
      if (tab === 'expenses') res = await deleteExpense(record.id);
      else if (tab === 'sales') res = await deleteSale(record.id);
      else if (tab === 'harvest') res = await deleteHarvest(record.id);
      else if (tab === 'activities') res = await deleteActivity(record.id);

      notify(res?.message || `${tab.slice(0, -1)} deleted successfully ✅`, 'success');
      const refreshedProject = await getProjectById(projectId);
      if (refreshedProject) setProject(unwrapResponse(refreshedProject));
      if (tab === 'harvest' || tab === 'sales') {
        refreshStock();
      }
    } catch (err) {
      alertModal(err?.message || 'Failed to delete record', 'error');
    }
  };

  // Project Editing
  const handleOpenEditProject = () => {
    if (!canEditProject) {
      notify('Access Denied: You do not have privilege to edit project details or budgets.', 'error');
      return;
    }
    setProjectEditForm({
      name: project.name || '',
      season: project.season || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      budget: project.budget || '',
      status: project.status || 'active',
      description: project.description || '',
    });
    setEditingProject(true);
  };

  const handleSaveEditProject = async (e) => {
    e.preventDefault();
    if (!canEditProject) {
      notify('Access Denied: You do not have privilege to edit project details or budgets.', 'error');
      return;
    }
    if (
      projectEditForm.startDate &&
      projectEditForm.endDate &&
      new Date(projectEditForm.startDate) > new Date(projectEditForm.endDate)
    ) {
      notify('Start date cannot be greater than end date!', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...projectEditForm,
        budget: projectEditForm.budget !== '' && projectEditForm.budget !== null && projectEditForm.budget !== undefined
          ? Number(projectEditForm.budget)
          : null,
        startDate: projectEditForm.startDate || null,
        endDate: projectEditForm.endDate || null,
      };
      const res = await updateProject(projectId, payload);
      notify(res?.message || 'Project updated successfully ✅', 'success');
      setEditingProject(false);
      const refreshedProject = await getProjectById(projectId);
      if (refreshedProject) setProject(unwrapResponse(refreshedProject));
    } catch (err) {
      notify(err.message || 'Failed to update project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner fullPage label="Loading project dashboard..." />;
  }

  if (!project) {
    return (
      <div className={styles.page}>
        <ErrorState
          error={loadError || 'Project not found or access denied.'}
          title="Project Unavailable"
          onRetry={loadData}
        />
      </div>
    );
  }

  const projectRecords = project?.records || project || {};
  const expensesList = Array.isArray(projectRecords.expenses) ? projectRecords.expenses : [];
  const salesList = Array.isArray(projectRecords.sales) ? projectRecords.sales : [];
  const activitiesList = Array.isArray(projectRecords.activities) ? projectRecords.activities : [];
  const harvestList = Array.isArray(projectRecords.harvest) ? projectRecords.harvest : [];

  const recordsMap = {
    expenses: expensesList,
    activities: activitiesList,
    sales: salesList,
    harvest: harvestList,
  };

  // Financial calculations
  const totalExpenses = Number(
    project?.totalExpenses ?? expensesList.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  );
  const totalSales = Number(
    project?.totalSales ??
      salesList.reduce((sum, item) => {
        const price = Number(item.unit_price ?? item.price ?? 0);
        const qty = Number(item.quantity || 0);
        return sum + qty * price;
      }, 0)
  );
  const netValue = Number(project?.netValue ?? (totalSales - totalExpenses));

  return (
    <div className={styles.page}>
      {/* 1. Header Row */}
      <ProjectHeader
        categoryLabel={categoryLabel}
        projectName={project.name}
        canEditProject={canEditProject}
        onOpenEditProject={handleOpenEditProject}
        canDeleteProject={canDeleteProject}
        onDeleteProject={handleDeleteProject}
        isDeleting={isDeletingProject}
      />

      {/* 2. Financial Metrics Summary */}
      <ProjectFinancialSummary
        totalExpenses={totalExpenses}
        totalSales={totalSales}
        netValue={netValue}
      />

      {/* 3. Main Content & Records Grid */}
      <div className={styles.contentGrid}>
        <section className={styles.recordPanel}>
          {/* Tabs and Action Buttons */}
          <ProjectTabs
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setShowRecordForm(false);
              setOpenCustomerForm(false);
              setOpenCustomerList(false);
            }}
            showRecordForm={showRecordForm}
            onToggleRecordForm={() => {
              if (activeTab === 'sales' && harvestStock.length === 0) {
                alertModal('You cannot record a sale because no harvest has been recorded yet.', 'error');
                return;
              }
              setShowRecordForm((current) => !current);
            }}
            canUseSupplies={canUseSupplies}
            onOpenUseSupplies={async () => {
              try {
                const res = await getInventoryItems(0, 1000);
                const pageData = res.body;
                setInventoryItems(pageData?.content || []);
                setUseSuppliesModalOpen(true);
              } catch {
                notify('Failed to load inventory', 'error');
              }
            }}
            canRecordInTab={canRecordInTab}
            hasHarvestsForSale={harvestStock.length > 0}
          />

          {/* Active Tab View */}
          {activeTab === 'expenses' && (
            <ExpensesTab
              records={expensesList}
              showRecordForm={showRecordForm}
              formState={form.expenses}
              onFieldChange={handleFieldChange}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canModifyRecord={canModifyRecord}
              onOpenEditRecord={handleOpenEditRecord}
              onDeleteRecord={handleDeleteRecord}
            />
          )}

          {activeTab === 'activities' && (
            <ActivitiesTab
              records={activitiesList}
              showRecordForm={showRecordForm}
              formState={form.activities}
              onFieldChange={handleFieldChange}
              setFormState={setForm}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canModifyRecord={canModifyRecord}
              onOpenEditRecord={handleOpenEditRecord}
              onDeleteRecord={handleDeleteRecord}
              onSelectActivityForLabor={setSelectedActivityForLabor}
              onToggleStatus={handleToggleActivityStatus}
            />
          )}

          {activeTab === 'sales' && (
            <SalesTab
              records={salesList}
              showRecordForm={showRecordForm}
              formState={form.sales}
              onFieldChange={handleFieldChange}
              setFormState={setForm}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              harvestStock={harvestStock}
              customerData={customerData}
              onRemoveCustomer={() => setCustomerData(null)}
              onOpenCustomerForm={() => {
                setOpenCustomerForm(true);
                setShowRecordForm(false);
              }}
              onOpenCustomerList={() => {
                setOpenCustomerList(true);
                setShowRecordForm(false);
              }}
              customersCount={customers.length}
              canModifyRecord={canModifyRecord}
              onOpenEditRecord={handleOpenEditRecord}
              onDeleteRecord={handleDeleteRecord}
            />
          )}

          {activeTab === 'harvest' && (
            <HarvestTab
              records={harvestList}
              showRecordForm={showRecordForm}
              formState={form.harvest}
              onFieldChange={handleFieldChange}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canModifyRecord={canModifyRecord}
              onOpenEditRecord={handleOpenEditRecord}
              onDeleteRecord={handleDeleteRecord}
            />
          )}
        </section>

        {/* 4. Recent Records Sidebar */}
        <RecentRecordsSidebar recordsMap={recordsMap} />
      </div>

      {/* 5. Modals */}
      <CustomerInfoModal
        customers={customers}
        onSave={handleCustomerSave}
        openForm={openCustomerForm}
        closeForm={() => {
          setOpenCustomerForm(false);
          setShowRecordForm(true);
        }}
      />

      <CustomerListModal
        customers={customers}
        openList={openCustomerList}
        closeList={() => {
          setOpenCustomerList(false);
          setShowRecordForm(true);
        }}
        onSelect={handleCustomerSave}
        onAddNew={() => {
          setOpenCustomerList(false);
          setOpenCustomerForm(true);
        }}
      />

      {useSuppliesModalOpen && (
        <UseSuppliesModal
          items={inventoryItems}
          projectId={projectId}
          onClose={() => setUseSuppliesModalOpen(false)}
          onSuccess={async () => {
            setUseSuppliesModalOpen(false);
            notify('Supplies applied to project expenses!', 'success');
            const refreshedProject = await getProjectById(projectId);
            if (refreshedProject) setProject(unwrapResponse(refreshedProject));
          }}
        />
      )}

      <EditRecordModal
        editingRecord={editingRecord}
        onClose={() => setEditingRecord(null)}
        editRecordForm={editRecordForm}
        onFormChange={setEditRecordForm}
        onSave={handleSaveEditRecord}
        isSubmitting={isSubmitting}
      />

      <EditProjectModal
        isOpen={editingProject}
        onClose={() => setEditingProject(false)}
        projectForm={projectEditForm}
        onFormChange={setProjectEditForm}
        onSave={handleSaveEditProject}
        isSubmitting={isSubmitting}
      />

      {selectedActivityForLabor && (
        <ActivityLaborModal
          isOpen={Boolean(selectedActivityForLabor)}
          onClose={() => setSelectedActivityForLabor(null)}
          activity={selectedActivityForLabor}
        />
      )}
    </div>
  );
}
