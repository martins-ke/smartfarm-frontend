import React, { useEffect, useState } from 'react';
import styles from './InventoryPage.module.css';
import { getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../APIs/inventory';
import { FaPlus, FaBoxOpen, FaExclamationTriangle, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { notify, confirmModal } from '../../utils/notify';
import { Spinner } from '../../Components/Spinner/Spinner';
import { useAuth } from '../../useAuth';

function InventoryModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '', category: 'Fertilizer', unit: 'Bags', quantityInStock: 0, unitPrice: 0, minStockLevel: 5
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) setFormData(item);
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (item && item.id) {
        await updateInventoryItem(item.id, formData);
        notify('Item updated successfully', 'success');
      } else {
        await addInventoryItem(formData);
        notify('Item added successfully', 'success');
      }
      onSave();
    } catch (err) {
      notify('Failed to save item', 'error');
      onClose(); // Force close on error as requested
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{item ? 'Edit Item' : 'Add New Item'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. DAP Fertilizer" />
          </div>
          
          <div className={styles.formRow} style={{ marginBottom: '1rem' }}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="Fertilizer">Fertilizer</option>
                <option value="Seeds">Seeds</option>
                <option value="Pesticides">Pesticides</option>
                <option value="Feed">Animal Feed</option>
                <option value="Tools">Tools</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Unit</label>
              <select name="unit" value={formData.unit} onChange={handleChange}>
                <option value="Bags">Bags</option>
                <option value="Kg">Kg</option>
                <option value="Liters">Liters</option>
                <option value="Pieces">Pieces</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow} style={{ marginBottom: '1rem' }}>
            <div className={styles.formGroup}>
              <label>Initial Quantity</label>
              <input type="number" step="0.01" min="0" name="quantityInStock" value={formData.quantityInStock} onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>Unit Price (Ksh)</label>
              <input type="number" step="0.01" min="0" name="unitPrice" value={formData.unitPrice} onChange={handleChange} required />
            </div>
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
            <label>Minimum Stock Level (Alert Threshold)</label>
            <input type="number" step="0.01" min="0" name="minStockLevel" value={formData.minStockLevel} onChange={handleChange} required />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className={styles.create_btn} disabled={loading}>
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InventoryPage() {
  const currentUser = useAuth((state) => state.user);
  const userRole = currentUser?.role?.toUpperCase();
  const userPrivileges = currentUser?.privileges || currentUser?.permissions || [];
  const isAdmin = userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';
  const canDelete = isAdmin || (isManager && userPrivileges.includes('CAN_DELETE_INVENTORY'));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 20;

  const loadItems = async (currentPage = page) => {
    setLoading(true);
    try {
      const res = await getInventoryItems(currentPage, PAGE_SIZE);
      const pageData = res.body;
      setItems(pageData?.content || []);
      setTotalPages(pageData?.totalPages ?? 0);
      setTotalElements(pageData?.totalElements ?? 0);
    } catch (err) {
      notify('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(page);
  }, [page]);

  const handleEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      notify('You do not have permission to delete inventory items.', 'error');
      return;
    }
    const confirmed = await confirmModal({
      title: 'Delete Inventory Item',
      message: 'Are you sure you want to delete this inventory item? This action cannot be undone.',
      confirmText: 'Delete Item',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await deleteInventoryItem(id);
      notify('Item deleted successfully ✅', 'success');
      loadItems(page);
    } catch (err) {
      notify(err.message || 'Failed to delete item', 'error');
    }
  };

  const categories = ['All', 'Fertilizer', 'Seeds', 'Pesticides', 'Feed', 'Tools', 'Other'];
  
  // Category filter is client-side within the current page
  const filteredItems = filterCategory === 'All' 
    ? items 
    : items.filter(item => item.category === filterCategory);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Warehouse & Supplies</p>
          <h2>Farm Inventory</h2>
        </div>
        <button
          className={styles.create_btn}
          onClick={() => { setEditingItem(null); setModalOpen(true); }}
        >
          <FaPlus /> Add New Item
        </button>
      </div>

      <div className={styles.filterBar}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`${styles.filterBtn} ${filterCategory === cat ? styles.filterActive : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner fullPage label="Loading inventory..." />
      ) : filteredItems.length === 0 ? (
        <div className={styles.loading}>No items found in inventory.</div>
      ) : (
        <div className={styles.inventoryGrid}>
          {filteredItems.map(item => (
            <div key={item.id} className={styles.inventoryCard}>
              <div className={styles.cardTopRow}>
                <h3>{item.name}</h3>
                <span className={styles.categoryBadge}>{item.category}</span>
              </div>
              
              <div className={styles.stockInfo}>
                <div className={styles.stockRow}>
                  <span>Available Stock</span>
                  <span className={styles.stockValue}>
                    {item.quantityInStock} {item.unit}
                  </span>
                </div>
                <div className={styles.stockRow}>
                  <span>Cost per {item.unit}</span>
                  <span className={styles.priceValue}>Ksh {Number(item.unitPrice).toLocaleString()}</span>
                </div>
                <div className={styles.stockRow}>
                  <span>Total Value</span>
                  <span>Ksh {(item.quantityInStock * item.unitPrice).toLocaleString()}</span>
                </div>
              </div>

              {Number(item.quantityInStock) <= Number(item.minStockLevel) && (
                <div className={styles.lowStockAlert}>
                  <FaExclamationTriangle /> Low Stock (Min: {item.minStockLevel})
                </div>
              )}

              <div className={styles.cardActions}>
                <button className={styles.iconBtn} onClick={() => handleEdit(item)}>
                  <FaEdit /> Edit / Restock
                </button>
                {canDelete && (
                  <button className={styles.iconBtn} style={{ color: '#ef4444' }} onClick={() => handleDelete(item.id)}>
                    <FaTrash /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <InventoryModal
          item={editingItem}
          onClose={() => setModalOpen(false)}
          onSave={() => { setModalOpen(false); loadItems(page); }}
        />
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page + 1} of {totalPages} &nbsp;·&nbsp; {totalElements} items total
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
