const express = require('express');
const crypto = require('crypto');
const { supabaseClient, supabaseConfigError } = require('./supabaseClient');

const app = express();
const port = 3000;
const adminSessionTokens = new Set();

app.use(express.json());

app.use((request, response, next) => {
  const origin = request.headers.origin;
  const isLocalOrigin = origin === 'null' || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

  if (isLocalOrigin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }

  if (request.method === 'OPTIONS') {
    return response.sendStatus(204);
  }

  next();
});

app.get('/', (request, response) => {
  response.send('Taste Lahore API');
});

app.get('/api/health', async (request, response) => {
  if (!supabaseClient) {
    return response.status(503).json({
      success: false,
      message: 'Taste Lahore backend is running, but the database is not configured',
      databaseConnected: false,
      error: supabaseConfigError
    });
  }

  const { error } = await supabaseClient
    .from('products')
    .select('id')
    .limit(1);

  if (error) {
    return response.status(503).json({
      success: false,
      message: 'Taste Lahore backend is running, but the database connection failed',
      databaseConnected: false,
      error: error.message
    });
  }

  response.json({
    success: true,
    message: 'Taste Lahore backend and database are connected',
    databaseConnected: true
  });
});

app.post('/api/admin/login', (request, response) => {
  const { username, password } = request.body || {};

  if (
    !process.env.ADMIN_USERNAME ||
    !process.env.ADMIN_PASSWORD ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return response.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const token = crypto.randomBytes(32).toString('hex');
  adminSessionTokens.add(token);

  return response.json({
    success: true,
    token
  });
});

app.get('/api/admin/orders', async (request, response) => {
  const authorization = request.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!token || !adminSessionTokens.has(token)) {
    return response.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  if (!supabaseClient) {
    return response.status(503).json({
      success: false,
      error: supabaseConfigError
    });
  }

  const { data: orders, error: ordersError } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (ordersError) {
    return response.status(500).json({
      success: false,
      error: `Failed to fetch orders: ${ordersError.message}`
    });
  }

  const orderIds = orders.map((order) => order.id);
  let orderItems = [];

  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await supabaseClient
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) {
      return response.status(500).json({
        success: false,
        error: `Failed to fetch order items: ${itemsError.message}`
      });
    }

    orderItems = items;
  }

  const itemsByOrderId = new Map();
  orderItems.forEach((item) => {
    const items = itemsByOrderId.get(item.order_id) || [];
    items.push(item);
    itemsByOrderId.set(item.order_id, items);
  });

  return response.json({
    success: true,
    orders: orders.map((order) => ({
      ...order,
      items: itemsByOrderId.get(order.id) || []
    }))
  });
});

const DELIVERY_FEE = 0;

function generateOrderId() {
  const date = new Date();
  const datePart = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((value) => String(value).padStart(2, '0'))
    .join('');
  const randomPart = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

  return `TL-${datePart}-${randomPart}`;
}

app.post('/api/orders', async (request, response) => {
  const { customer_name, phone, address, notes = '', items } = request.body || {};

  if (
    typeof customer_name !== 'string' || !customer_name.trim() ||
    typeof phone !== 'string' || !phone.trim() ||
    typeof address !== 'string' || !address.trim() ||
    !Array.isArray(items) || items.length === 0
  ) {
    return response.status(400).json({
      success: false,
      error: 'customer_name, phone, address, and at least one item are required'
    });
  }

  const hasInvalidItem = items.some((item) => (
    !item ||
    !Number.isInteger(item.product_id) ||
    typeof item.product_name !== 'string' || !item.product_name.trim() ||
    !Number.isInteger(item.quantity) || item.quantity <= 0 ||
    typeof item.unit_price !== 'number' || !Number.isFinite(item.unit_price) || item.unit_price < 0
  ));

  if (hasInvalidItem) {
    return response.status(400).json({
      success: false,
      error: 'Each item must include a product_id, product_name, positive integer quantity, and valid unit_price'
    });
  }

  if (!supabaseClient) {
    return response.status(503).json({
      success: false,
      error: supabaseConfigError
    });
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const total = subtotal + DELIVERY_FEE;
  const orderId = generateOrderId();
  let insertedOrderId;

  try {
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        order_id: orderId,
        customer_name: customer_name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: typeof notes === 'string' ? notes.trim() : '',
        subtotal,
        delivery_fee: DELIVERY_FEE,
        total,
        status: 'pending'
      })
      .select('id')
      .single();

    if (orderError) {
      return response.status(500).json({
        success: false,
        error: `Failed to create order: ${orderError.message}`
      });
    }

    insertedOrderId = order && order.id;
    if (!insertedOrderId) {
      throw new Error('Supabase did not return the new order id');
    }

    const orderItems = items.map((item) => ({
      order_id: insertedOrderId,
      product_id: item.product_id,
      product_name: item.product_name.trim(),
      quantity: item.quantity,
      unit_price: item.unit_price,
      item_total: item.quantity * item.unit_price
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    return response.status(201).json({
      success: true,
      order_id: orderId,
      total
    });
  } catch (error) {
    if (insertedOrderId) {
      const { error: cleanupError } = await supabaseClient
        .from('orders')
        .delete()
        .eq('id', insertedOrderId);

      if (cleanupError) {
        console.error(`Order cleanup failed for ${orderId}: ${cleanupError.message}`);
      }
    }

    console.error(`Order creation failed for ${orderId}: ${error.message}`);
    return response.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const server = app.listen(port, () => {
  console.log(`Taste Lahore backend running on http://localhost:${port}`);
});

server.on('error', (error) => {
  console.error('Taste Lahore backend failed to start:', error.message);
  process.exitCode = 1;
});
