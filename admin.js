const API_BASE_URL = 'http://localhost:3000';
const loginSection = document.querySelector('#login-section');
const ordersSection = document.querySelector('#orders-section');
const loginForm = document.querySelector('#login-form');
const loginButton = document.querySelector('#login-button');
const refreshButton = document.querySelector('#refresh-button');
const loginMessage = document.querySelector('#login-message');
const ordersMessage = document.querySelector('#orders-message');
const ordersList = document.querySelector('#orders-list');
let adminToken = localStorage.getItem('tasteLahoreAdminToken') || '';

function setMessage(element, message) {
  element.textContent = message;
}

function createDetail(label, value) {
  const detail = document.createElement('div');
  detail.className = 'detail';
  detail.append(`${label}: `);
  const strong = document.createElement('strong');
  strong.textContent = value ?? '';
  detail.append(strong);
  return detail;
}

function renderOrders(orders) {
  ordersList.replaceChildren();

  if (!orders.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty';
    emptyMessage.textContent = 'No orders found.';
    ordersList.append(emptyMessage);
    return;
  }

  orders.forEach((order) => {
    const card = document.createElement('article');
    card.className = 'order-card';
    const heading = document.createElement('h3');
    heading.textContent = order.order_id || `Order ${order.id}`;
    card.append(heading);

    const details = document.createElement('div');
    details.className = 'order-details';
    [
      ['Customer', order.customer_name],
      ['Phone', order.phone],
      ['Address', order.address],
      ['Notes', order.notes || 'None'],
      ['Subtotal', order.subtotal],
      ['Delivery fee', order.delivery_fee],
      ['Total', order.total],
      ['Status', order.status],
      ['Created', order.created_at]
    ].forEach(([label, value]) => details.append(createDetail(label, value)));
    card.append(details);

    const table = document.createElement('table');
    table.className = 'items';
    table.innerHTML = '<thead><tr><th>Product</th><th>Quantity</th><th>Unit price</th><th>Item total</th></tr></thead>';
    const body = document.createElement('tbody');
    (order.items || []).forEach((item) => {
      const row = document.createElement('tr');
      [item.product_name, item.quantity, item.unit_price, item.item_total].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value ?? '';
        row.append(cell);
      });
      body.append(row);
    });
    table.append(body);
    card.append(table);
    ordersList.append(card);
  });
}

async function loadOrders() {
  setMessage(ordersMessage, 'Loading orders...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Unable to load orders.');
    }
    renderOrders(result.orders || []);
    setMessage(ordersMessage, '');
  } catch (error) {
    setMessage(ordersMessage, error.message);
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(loginMessage, '');
  loginButton.disabled = true;

  try {
    const formData = new FormData(loginForm);
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password')
      })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Login failed.');
    }

    adminToken = result.token;
    localStorage.setItem('tasteLahoreAdminToken', adminToken);
    loginSection.hidden = true;
    ordersSection.hidden = false;
    await loadOrders();
  } catch (error) {
    setMessage(loginMessage, error.message);
  } finally {
    loginButton.disabled = false;
  }
});

refreshButton.addEventListener('click', loadOrders);

if (adminToken) {
  loginSection.hidden = true;
  ordersSection.hidden = false;
  loadOrders();
}