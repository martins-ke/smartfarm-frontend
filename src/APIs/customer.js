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

export const getCustomerSales = async (customerId, page = 0, size = 10, customerContact = null) => {
  try {
    const res = await apiClient(`/sales/customer/${customerId}?page=${page}&size=${size}`);
    const data = unwrap(res);
    if (data && (data.content !== undefined || Array.isArray(data))) {
      return data;
    }
  } catch (err) {
    // Fallback to /sales/all if dedicated endpoint not yet deployed
  }

  try {
    const fallbackRes = await apiClient(`/sales/all?page=0&size=500`);
    const allData = unwrap(fallbackRes);
    const allSales = Array.isArray(allData) ? allData : (allData?.content || []);
    
    const filtered = allSales.filter((s) => {
      const matchId = s.customer?.id === customerId || s.customer_id === customerId || s.customerId === customerId;
      const matchContact = customerContact && s.customer?.contact && s.customer.contact === customerContact;
      return matchId || matchContact;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.added_on || a.addedOn || a.date || 0).getTime();
      const dateB = new Date(b.added_on || b.addedOn || b.date || 0).getTime();
      return dateB - dateA;
    });

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size) || (totalElements > 0 ? 1 : 0);
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return {
      content,
      totalPages,
      totalElements,
      number: page,
      size,
    };
  } catch (fallbackErr) {
    return { content: [], totalPages: 0, totalElements: 0 };
  }
};
