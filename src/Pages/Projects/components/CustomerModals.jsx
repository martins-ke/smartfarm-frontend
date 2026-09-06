import { useState, useMemo } from 'react';
import styles from '../ProjectDashboardPage.module.css';
import {
  FaUserPlus,
  FaTimes,
  FaUser,
  FaPhoneAlt,
  FaIdCard,
  FaMapMarkerAlt,
  FaCheck,
  FaUsers,
  FaSearch
} from 'react-icons/fa';
import { notify } from '../../../utils/notify';

export function CustomerInfoModal({ customers = [], onSave, openForm, closeForm }) {
  const [form, setForm] = useState({
    name: '',
    contact: '',
    id_number: '',
    address: '',
    status: 'new',
  });

  const saveInfo = (e) => {
    if (e) e.preventDefault();
    const list = Array.isArray(customers) ? customers : [];
    const name = form.name.trim();
    const contact = form.contact.trim();
    const idNumber = form.id_number.trim();
    const address = form.address.trim() ? form.address.trim() : '-';

    if (!name) {
      notify('Customer name is required', 'error');
      return;
    }
    if (!contact) {
      notify('Contact number is required', 'error');
      return;
    }
    if (!idNumber) {
      notify('National ID number is required', 'error');
      return;
    }

    const contactExists = list.find((c) => c.contact && c.contact === contact);
    if (contactExists) {
      notify(`Customer with contact ${contact} already exists!`, 'error');
      return;
    }

    const idNumberExists = list.find(
      (c) => (c.id_number || c.idNumber) && (c.id_number || c.idNumber) === idNumber
    );
    if (idNumberExists) {
      notify(`Customer with ID number ${idNumber} already exists!`, 'error');
      return;
    }

    onSave({
      name,
      contact,
      id_number: idNumber,
      address,
      status: 'new',
    });
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  if (!openForm) return null;

  return (
    <div className={styles.modalOverlay} onClick={closeForm}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalHeaderIcon}>
              <FaUserPlus />
            </div>
            <div>
              <h3>New Customer</h3>
              <p>Register buyer details to attach to this sale</p>
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={closeForm}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={saveInfo} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>
                <span>
                  Full Name <span className={styles.requiredStar}>*</span>
                </span>
                <div className={styles.inputWithIcon}>
                  <FaUser className={styles.fieldIcon} />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFieldChange}
                    placeholder="e.g. John Doe / School Cafeteria"
                    autoFocus
                    required
                  />
                </div>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>
                <span>
                  Phone Contact <span className={styles.requiredStar}>*</span>
                </span>
                <div className={styles.inputWithIcon}>
                  <FaPhoneAlt className={styles.fieldIcon} />
                  <input
                    type="tel"
                    name="contact"
                    value={form.contact}
                    onChange={handleFieldChange}
                    placeholder="e.g. 0784463737"
                    required
                  />
                </div>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>
                <span>
                  National ID / Reg No. <span className={styles.requiredStar}>*</span>
                </span>
                <div className={styles.inputWithIcon}>
                  <FaIdCard className={styles.fieldIcon} />
                  <input
                    type="text"
                    name="id_number"
                    value={form.id_number}
                    onChange={handleFieldChange}
                    placeholder="e.g. 12345678"
                    required
                  />
                </div>
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>
                <span>
                  Residence / Address <span className={styles.optionalTag}>(Optional)</span>
                </span>
                <div className={styles.inputWithIcon}>
                  <FaMapMarkerAlt className={styles.fieldIcon} />
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleFieldChange}
                    placeholder="e.g. Kitale Town / Stall 4"
                  />
                </div>
              </label>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.modalCancelBtn} onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className={styles.modalSubmitBtn}>
              <FaCheck /> Attach Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomerListModal({ customers = [], openList, closeList, onSelect, onAddNew }) {
  const [searchTerm, setSearchTerm] = useState('');
  const list = Array.isArray(customers) ? customers : [];

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const contact = (c.contact || '').toLowerCase();
      const idNum = (c.id_number || c.idNumber || '').toLowerCase();
      const address = (c.address || '').toLowerCase();
      return name.includes(q) || contact.includes(q) || idNum.includes(q) || address.includes(q);
    });
  }, [list, searchTerm]);

  if (!openList) return null;

  return (
    <div className={styles.modalOverlay} onClick={closeList}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderInfo}>
            <div className={styles.modalHeaderIcon}>
              <FaUsers />
            </div>
            <div>
              <h3>Select Customer</h3>
              <p>Choose an existing buyer ({list.length} registered)</p>
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={closeList}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.searchBarWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, contact, ID, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchTerm('')}
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className={styles.customerScrollList}>
          {filteredCustomers.length === 0 ? (
            <div className={styles.noCustomersBox}>
              <p>
                {list.length === 0
                  ? 'No customers found in database.'
                  : 'No customers match your search query.'}
              </p>
              {onAddNew && (
                <button
                  type="button"
                  className={styles.modalSecondaryActionBtn}
                  onClick={onAddNew}
                >
                  <FaUserPlus /> Register New Customer
                </button>
              )}
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const initial = c.name ? c.name.charAt(0).toUpperCase() : '?';
              const idVal = c.id_number || c.idNumber;
              return (
                <div
                  key={c.id || c.contact}
                  className={styles.customerOptionCard}
                  onClick={() => {
                    onSelect({ ...c, status: 'exist' });
                  }}
                >
                  <div className={styles.customerOptionAvatar}>{initial}</div>
                  <div className={styles.customerOptionDetails}>
                    <div className={styles.customerOptionNameRow}>
                      <strong>{c.name}</strong>
                      {idVal && <span className={styles.customerOptionBadge}>ID: {idVal}</span>}
                    </div>
                    <div className={styles.customerOptionMeta}>
                      <span>
                        <FaPhoneAlt size={10} /> {c.contact}
                      </span>
                      {c.address && c.address !== '-' && (
                        <span>
                          <FaMapMarkerAlt size={10} /> {c.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={styles.selectOptionTag}>Select</span>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.modalCancelBtn} onClick={closeList}>
            Cancel
          </button>
          {onAddNew && (
            <button type="button" className={styles.modalAddNewBtn} onClick={onAddNew}>
              <FaUserPlus /> Add New Customer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
