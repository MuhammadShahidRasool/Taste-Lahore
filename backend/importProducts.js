const fs = require('fs');
const path = require('path');
const { supabaseClient, supabaseConfigError } = require('./supabaseClient');

const expectedProductCount = 107;
const frontendScriptPath = path.join(__dirname, '..', 'script.js');
const frontendSource = fs.readFileSync(frontendScriptPath, 'utf8');
const menuItemsMatch = frontendSource.match(
  /const menuItems = (\{[\s\S]*?\});\s*\n\s*const productCategoryLabels/
);

if (!menuItemsMatch) {
  throw new Error('Could not find the menuItems data in script.js');
}

const menuItems = Function(`return (${menuItemsMatch[1]})`)();
const productCategoryLabels = {
  'daily-menu': 'Daily Menu',
  breakfast: 'Breakfast',
  chicken: 'Chicken',
  mutton: 'Mutton',
  bbq: 'BBQ',
  tawa: 'Tawa',
  tandoor: 'Tandoor',
  'sweets-chats': 'Sweets & Chats',
  drinks: 'Drinks'
};

const products = Object.entries(menuItems).flatMap(([categoryKey, items]) => {
  const categoryName = productCategoryLabels[categoryKey] || categoryKey;

  return items.map(([name, priceText, image]) => ({
    name,
    category: categoryName,
    price: Number.parseFloat(String(priceText).replace(/[^0-9.]/g, '')),
    image,
    description: `Classic ${name} from our ${categoryName} menu.`,
    available: true
  }));
});

async function importProducts() {
  if (!supabaseClient) {
    throw new Error(supabaseConfigError);
  }

  if (products.length !== expectedProductCount) {
    throw new Error(`Expected ${expectedProductCount} products, found ${products.length}`);
  }

  const { data, error } = await supabaseClient
    .from('products')
    .insert(products)
    .select('id');

  if (error) {
    throw new Error(`Product import failed: ${error.message}`);
  }

  console.log(`Product import succeeded: ${data.length} rows inserted.`);
}

importProducts().catch((error) => {
  console.error(`Product import failed: ${error.message}`);
  process.exitCode = 1;
});
