import { apiClient } from './request';

const unwrap = (res) => (res && res.body !== undefined ? res.body : (res && res.data !== undefined ? res.data : res));

export const getSuppliers = async () => {
  try {
    const res = await apiClient('/suppliers');
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (_err) {
    return [];
  }
};

export const getSupplierById = async (supplierId) => {
  const res = await apiClient(`/suppliers/${supplierId}`);
  return unwrap(res);
};

export const createSupplier = async (supplierData) => {
  const res = await apiClient('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplierData),
  });
  return unwrap(res);
};

export const getSupplierPurchases = async (supplierId) => {
  const res = await apiClient(`/suppliers/${supplierId}/purchases`);
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};

export const recordSupplierPurchase = async (purchaseData) => {
  const res = await apiClient('/suppliers/purchases', {
    method: 'POST',
    body: JSON.stringify(purchaseData),
  });
  return unwrap(res);
};

export const recordSupplierPayment = async (supplierId, paymentData) => {
  const res = await apiClient(`/suppliers/${supplierId}/payments`, {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
  return unwrap(res);
};
