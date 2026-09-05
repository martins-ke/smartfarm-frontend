import { apiClient } from './request';

const unwrap = (res) => (res && res.body !== undefined ? res.body : (res && res.data !== undefined ? res.data : res));

export const getCustomers = async () => {
  try {
    const res = await apiClient('/customers');
    const data = unwrap(res);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
};

export const getCustomerById = async (customerId) => {
  const res = await apiClient(`/customers/${customerId}`);
  return unwrap(res);
};

export const createCustomer = async (customerData) => {
  const res = await apiClient('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  });
  return unwrap(res);
};

export const recordCustomerPayment = async (customerId, paymentAmount) => {
  const res = await apiClient(`/customers/${customerId}/payments`, {
    method: 'POST',
    body: JSON.stringify({ amount: paymentAmount }),
  });
  return unwrap(res);
};
