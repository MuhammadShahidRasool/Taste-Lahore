// Centralized click logging makes placeholder links easy to replace later.
document.querySelectorAll('[data-log]').forEach((element) => {
  element.addEventListener('click', (event) => {
    console.log(`${element.dataset.log} clicked`);
    if (element.getAttribute('href') === '#') event.preventDefault();
  });
});


// Reusable helper for sticky-header-aware scrolling so other header links can reuse it.
function getNavbarHeight() {
  const navbar = document.querySelector('.main-nav');
  return navbar ? navbar.offsetHeight : 0;
}

function scrollToSection(targetId, options = {}) {
  const target = document.getElementById(targetId);
  if (!target) return false;

  // Subtract the fixed/sticky header height from the section top so the target
  // sits just below the navbar instead of getting hidden underneath it.
  const navbarOffset = getNavbarHeight();
  const adjustedPosition = Math.max(target.getBoundingClientRect().top + window.scrollY - navbarOffset, 0);

  window.scrollTo({
    top: adjustedPosition,
    behavior: options.behavior || 'smooth'
  });

  return true;
}

// Mobile navigation toggle.
const mainNav = document.querySelector('.main-nav');
const menuToggle = document.querySelector('.menu-toggle');

menuToggle.addEventListener('click', () => {
  console.log('Mobile menu clicked');
  const isOpen = mainNav.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.innerHTML = isOpen
    ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
    : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
});

// Food Menu uses hover on desktop and an accordion toggle on touch-sized screens.
const foodMenuItem = document.querySelector('.food-menu-item');
const foodMenuTrigger = document.querySelector('.food-menu-trigger');
const foodMenuNavLink = document.querySelector('.food-menu-nav-link');
let foodMenuCloseTimer;

function setFoodMenuState(isOpen) {
  if (!foodMenuItem || !foodMenuTrigger) return;
  foodMenuItem.classList.toggle('is-open', isOpen);
  foodMenuTrigger.setAttribute('aria-expanded', String(isOpen));
}

function triggerDailyMenuTab() {
  const defaultTab = document.querySelector('.menu-tab[data-category="daily-menu"]');
  if (defaultTab) {
    // TODO: call your existing switchCategory('daily-menu') function here instead of clicking the tab.
    defaultTab.click();
  }
}

if (foodMenuItem && foodMenuTrigger) {
  // Delay desktop closing so moving from the trigger into the panel feels natural.
  foodMenuItem.addEventListener('mouseenter', () => {
    clearTimeout(foodMenuCloseTimer);
    if (window.matchMedia('(min-width: 769px)').matches) setFoodMenuState(true);
  });
  foodMenuItem.addEventListener('mouseleave', () => {
    if (window.matchMedia('(min-width: 769px)').matches) {
      foodMenuCloseTimer = window.setTimeout(() => setFoodMenuState(false), 200);
    }
  });

  // On mobile, the trigger opens a single flat accordion and keeps the links in flow.
  foodMenuTrigger.addEventListener('click', (event) => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      event.preventDefault();
      setFoodMenuState(!foodMenuItem.classList.contains('is-open'));
      return;
    }

    // Desktop clicks should scroll to the section instead of doing a hard jump.
    event.preventDefault();
    const targetExists = document.getElementById('food-menu-section');
    if (targetExists) {
      scrollToSection('food-menu-section');
      triggerDailyMenuTab();
      return;
    }
    window.location.href = 'index.html#food-menu-section';
  });

  document.addEventListener('click', (event) => {
    if (!foodMenuItem.contains(event.target)) setFoodMenuState(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && foodMenuItem.classList.contains('is-open')) {
      setFoodMenuState(false);
      foodMenuTrigger.focus();
    }
  });
}

if (foodMenuNavLink) {
  foodMenuNavLink.addEventListener('click', (event) => {
    const targetId = 'food-menu-section';
    const targetExists = document.getElementById(targetId);

    // If the section is on this page, use a smooth scroll after subtracting the sticky navbar.
    if (targetExists) {
      event.preventDefault();
      scrollToSection(targetId);
      triggerDailyMenuTab();
      return;
    }

    // If this nav is on a different page, let the browser navigate to the homepage section.
    event.preventDefault();
    window.location.href = `index.html#${targetId}`;
  });
}

// HEADER DROPDOWN TO TABS INTEGRATION
// ====================================
// When a user clicks a category link in the header dropdown (e.g., "Chicken", "BBQ"),
// this handler:
// 1) Finds the matching tab button by matching data-category values
// 2) Clicks the tab to trigger the existing tab-switching logic
// 3) Smoothly scrolls to the menu section below the sticky navbar
// 4) Closes the dropdown menu
//
// This allows single-page navigation: clicking a dropdown item acts as both
// a smooth scroll AND an automatic tab activation, all on the same page.
document.querySelectorAll('.food-menu-dropdown a[data-category]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const selectedCategory = link.getAttribute('data-category');
    
    // Find the matching tab button using the same data-category value.
    const matchingTab = document.querySelector(`.menu-tab[data-category="${selectedCategory}"]`);
    
    if (matchingTab) {
      // Click the tab to trigger existing tab-switching logic (updates active class,
      // aria-selected, and renders the dish list via renderMenu()).
      matchingTab.click();
    }
    
    // Smooth scroll to the menu section, offset by the sticky navbar height.
    scrollToSection('food-menu-section');
    
    // Close the dropdown by reverting the is-open state and aria-expanded.
    setFoodMenuState(false);
  });
});
// END HEADER DROPDOWN TO TABS INTEGRATION

// On the destination page, do the smooth scroll after the page and images finish loading.
if (window.location.hash === '#food-menu-section') {
  window.addEventListener('load', () => {
    window.setTimeout(() => {
      scrollToSection('food-menu-section');
      triggerDailyMenuTab();
    }, 250);
  });
}

// Keep the existing click behavior for the other top-level dropdowns on mobile.
document.querySelectorAll('.nav-item:not(.food-menu-item) > a').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const parent = link.parentElement;
    const wasOpen = parent.classList.contains('is-open');
    document.querySelectorAll('.nav-item.is-open').forEach((item) => item.classList.remove('is-open'));
    if (!wasOpen) parent.classList.add('is-open');
  });
});

// Toggle the compact search field and focus it when opened.
const searchWrap = document.querySelector('.search-wrap');
const searchButton = document.querySelector('.search-button');
const searchInput = document.querySelector('.search-form input');

searchButton.addEventListener('click', () => {
  console.log('Search clicked');
  const isOpen = searchWrap.classList.toggle('is-open');
  searchButton.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) searchInput.focus();
});

document.querySelector('.search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  console.log(`Search submitted: ${searchInput.value}`);
});

// Hero slides are kept in the markup so each slide can be edited independently.
const SLIDE_DURATION = 5500;
const hero = document.querySelector('.hero');
const heroSlides = document.querySelectorAll('.hero-slide');
const heroDots = document.querySelectorAll('.hero__dot');
let activeHeroSlide = 0;
let heroTimer;

// Toggle the active slide and keep carousel state accessible to screen readers.
function showHeroSlide(nextIndex) {
  activeHeroSlide = (nextIndex + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, index) => {
    const isActive = index === activeHeroSlide;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
  });
  heroDots.forEach((dot, index) => {
    const isActive = index === activeHeroSlide;
    dot.classList.toggle('is-active', isActive);
    dot.setAttribute('aria-selected', String(isActive));
  });
}

// Auto-rotation pauses on hover and restarts from the full duration afterward.
function startHeroRotation() {
  window.clearInterval(heroTimer);
  heroTimer = window.setInterval(() => showHeroSlide(activeHeroSlide + 1), SLIDE_DURATION);
}

if (hero && heroSlides.length) {
  heroDots.forEach((dot, index) => dot.addEventListener('click', () => {
    showHeroSlide(index);
    startHeroRotation();
  }));
  hero.addEventListener('mouseenter', () => window.clearInterval(heroTimer));
  hero.addEventListener('mouseleave', startHeroRotation);
  startHeroRotation();
}

// Edit this target date to control when the Special Offer expires.
const targetDate = new Date('2026-12-31T23:59:59');
const countdownParts = {
  days: document.querySelector('#countdown-days'),
  hours: document.querySelector('#countdown-hours'),
  minutes: document.querySelector('#countdown-minutes'),
  seconds: document.querySelector('#countdown-seconds')
};
const countdownStatus = document.querySelector('.countdown-status');
let countdownTimer;

function updateCountdown() {
  const remainingMilliseconds = Math.max(0, targetDate - new Date());
  const totalSeconds = Math.floor(remainingMilliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const values = {
    days: String(days),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0')
  };
  Object.entries(values).forEach(([part, value]) => {
    const numberElement = countdownParts[part];
    if (numberElement.textContent !== value) {
      numberElement.classList.remove('is-changing');
      void numberElement.offsetWidth;
      numberElement.textContent = value;
      numberElement.classList.add('is-changing');
    }
  });
  if (remainingMilliseconds === 0) {
    countdownStatus.textContent = 'Offer Expired';
    window.clearInterval(countdownTimer);
  }
}

updateCountdown();
countdownTimer = window.setInterval(updateCountdown, 1000);

// Carousel controls. Adjust these values to tune the marquee for your menu.
const popularFood = document.querySelector('.popular-food');
const foodTrack = document.querySelector('.food-track');
const carouselSpeedSeconds = window.matchMedia('(max-width: 560px)').matches ? 34 : 28;
popularFood.style.setProperty('--marquee-speed', `${carouselSpeedSeconds}s`);

document.querySelectorAll('.food-card[data-item]').forEach((card) => {
  card.addEventListener('click', (event) => {
    event.preventDefault();
    console.log(`${card.dataset.item} clicked`);
  });
});

let resumeTimer;
function nudgeCarousel(direction) {
  clearTimeout(resumeTimer);
  foodTrack.classList.add('is-paused');
  foodTrack.style.transform = `translateX(${direction * 105}px)`;
  resumeTimer = window.setTimeout(() => {
    foodTrack.style.transform = '';
    foodTrack.classList.remove('is-paused');
  }, 650);
}

document.querySelector('.carousel-arrow--prev').addEventListener('click', () => {
  console.log('Previous food items clicked');
  nudgeCarousel(1);
});

document.querySelector('.carousel-arrow--next').addEventListener('click', () => {
  console.log('Next food items clicked');
  nudgeCarousel(-1);
});

// Best Selling Dishes interactions.
document.querySelectorAll('.dish-card').forEach((card) => {
  const dishName = card.dataset.dish;
  const wishlistButton = card.querySelector('.wishlist-button');
  const wishlistIcon = wishlistButton.querySelector('i');
  const addCartButton = card.querySelector('.add-cart-button');
  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  wishlistButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const isFavorite = wishlistButton.classList.toggle('is-favorite');
    wishlistButton.setAttribute('aria-pressed', String(isFavorite));
    wishlistIcon.className = isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    console.log(`${dishName} ${isFavorite ? 'added to' : 'removed from'} wishlist`);
  });

  addCartButton.addEventListener('click', (event) => {
    event.stopPropagation();
    console.log(`${dishName} added to cart`);
  });

  // Touch devices use a tap to toggle the same dark theme state that :hover provides on desktop.
  card.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    if (isTouchDevice) {
      card.classList.toggle('active-dark');
      card.classList.toggle('is-touch-active', card.classList.contains('active-dark'));
    }
  });

  if (isTouchDevice) {
    card.addEventListener('mouseleave', () => {
      card.classList.remove('active-dark');
      card.classList.remove('is-touch-active');
    });
  }
});

// Menu data is grouped by category so new dishes can be added without changing the markup.
const menuItems = {
  'daily-menu': [
    ['Daal Makhni', '$14.99', 'images/Daily-menu/Daal-Makhni-1024x682.jpeg'],
    ['Egg', '$8.99', 'images/Daily-menu/EGG.jpg'],
    ['Haleem', '$16.99', 'images/Daily-menu/Haleem.jpeg'],
    ['Murgh Channa', '$18.99', 'images/Daily-menu/murgh-channa.jpg'],
    ['Mutton Chilli', '$27.99', 'images/Daily-menu/MUTTON-CHILLI.jpg'],
    ['Mutton Korma', '$31.99', 'images/Daily-menu/mutton-korma.jpg'],
    ['Nihari', '$24.99', 'images/Daily-menu/NIHARI-1024x682.jpg'],
    ['Punjabi Kadhi Pakora', '$15.99', 'images/Daily-menu/punjabi-kadhi-pakora.jpg'],
    ['Beef Paya', '$26.99', 'images/Daily-menu/qasr-lahore-beef-paya.jpg'],
    ['Sabzi', '$12.99', 'images/Daily-menu/Sabzi.jpeg']
  ],

  'breakfast': [
    ['Aloo Paratha', '$9.99', 'images/Break-fast/ALOO-PARATHA.jpg'],
    ['Anda Channa', '$11.99', 'images/Break-fast/ANDA-CHANA.jpg'],
    ['Beef Paya', '$26.99', 'images/Break-fast/BEEF-PAYA-1536x1053.jpg'],
    ['Bong Channa', '$18.99', 'images/Break-fast/BONG-CHANA-1536x1026.jpg'],
    ['Bong Paya', '$24.99', 'images/Break-fast/BONG-PAYA-1536x1026.jpg'],
    ['Egg', '$8.99', 'images/Break-fast/EGG.jpg'],
    ['Halwa Puri', '$13.99', 'images/Break-fast/HALWA-PURI-1536x1026.jpg'],
    ['Lahori Channa Kofta', '$16.99', 'images/Break-fast/LAHORI-CHANA-KOFTA.jpg'],
    ['Nihari', '$24.99', 'images/Break-fast/NIHARI.jpg'],
    ['Qasr Lahore Channay', '$12.99', 'images/Break-fast/qasr-lahore-channay.png'],
    ['Sabzi', '$12.99', 'images/Break-fast/SABZI.jpg']
  ],

  'chicken': [
    ['Chicken Achari', '$21.99', 'images/Chicken/Chicken-Achari.jpeg'],
    ['Chicken Cheese Handi', '$24.99', 'images/Chicken/chicken-cheese-handi.jpg'],
    ['Chicken Chilli', '$22.99', 'images/Chicken/CHICKEN-CHILLI.jpg'],
    ['Chicken Ginger', '$21.99', 'images/Chicken/CHICKEN-GINGER-1536x1026.jpg'],
    ['Chicken Handi', '$23.99', 'images/Chicken/CHICKEN-HANDI.jpg'],
    ['Chicken Jalfrezi', '$22.99', 'images/Chicken/CHICKEN-JALFERAZI-1536x1026.jpg'],
    ['Chicken Karahi', '$25.99', 'images/Chicken/CHICKEN-KARAHI-1536x1024.jpg'],
    ['Chicken Multani', '$22.99', 'images/Chicken/CHICKEN-multani.jpg'],
    ['Chicken Nawabi', '$23.99', 'images/Chicken/CHICKEN-NAWABI.jpg'],
    ['Chicken Peshawari', '$23.99', 'images/Chicken/CHICKEN-PESHAWARI-1536x1026.jpg']
  ],

  'mutton': [
    ['Mutton Achaar Gosht', '$32.99', 'images/Mutton/MUTTON-ACHAAR-GOSHT-1536x1024.jpg'],
    ['Mutton Chilli', '$29.99', 'images/Mutton/MUTTON-CHILLI-1536x1024.jpg'],
    ['Mutton Handi', '$34.99', 'images/Mutton/MUTTON-HANDI-1536x1026.jpg'],
    ['Mutton Karahi', '$36.99', 'images/Mutton/MUTTON-KARAHI.jpg'],
    ['Mutton Karahi (Special)', '$38.99', 'images/Mutton/MUTTON-KARAHII-1536x986.jpg'],
    ['Mutton Peshawari', '$33.99', 'images/Mutton/MUTTON-PESHAWARI-1536x1026.jpg'],
    ['Mutton White Karahi', '$35.99', 'images/Mutton/Mutton-white-karahi_.jpg']
  ],

  'bbq': [
    ['Beef Tikka Boti', '$27.99', 'images/Bbq/BEEF-TIKKA-BOTI-1338x1536_180x120.jpg'],
    ['Chicken Irani Boti', '$23.99', 'images/Bbq/chcken-irani-boti_180x120.jpg'],
    ['Chicken Tikka Boti Masala', '$24.99', 'images/Bbq/Chicken_tikka_Boti_Masala_180x120.jpg'],
    ['Chicken Cheese Kabab', '$25.99', 'images/Bbq/Chicken-Cheese-Kabab_180x120.jpg'],
    ['Chicken Cheese Kebab (Special)', '$26.99', 'images/Bbq/CHICKEN-CHEESE-KEBAB_180x120.jpg'],
    ['Chicken Hari Boti', '$24.99', 'images/Bbq/CHICKEN-HARI-BOTI-1372x1536_180x120.jpg'],
    ['Chicken Karahi', '$25.99', 'images/Bbq/Chicken-Karahi-1536x1026_180x120.jpg'],
    ['Chicken Kebab', '$22.99', 'images/Bbq/CHICKEN-KEBAB-1536x1026_180x120.jpg'],
    ['Chicken Seekh Kabab', '$21.99', 'images/Bbq/Chicken-Seekh-Kabab-1536x864_180x120.jpg'],
    ['Chicken Tikka', '$22.99', 'images/Bbq/Chicken-Tikka-1536x1024_180x120.jpg'],
    ['Chicken Wings', '$19.99', 'images/Bbq/CHICKEN-WINGS-1536x1026_180x120.jpg'],
    ['Fish Fillet', '$26.99', 'images/Bbq/FISH-FILLET-1536x1026_180x120.jpg'],
    ['Fish Tikka', '$27.99', 'images/Bbq/Fish-Tikka-1536x1024_180x120.jpg'],
    ['Hari Boti', '$23.99', 'images/Bbq/Hari-Boti-1536x1024_180x120.jpg'],
    ['Lahori Chargha Meal', '$29.99', 'images/Bbq/Lahori-chargha-meal_Bosckie-113-2-1024x682_180x120.jpg'],
    ['Malai Boti', '$24.99', 'images/Bbq/Malai-Boti-1536x1024_180x120.jpg'],
    ['Mix Grill', '$34.99', 'images/Bbq/mix-grill-3_180x120.jpg'],
    ['Mix Grill (Special)', '$36.99', 'images/Bbq/MIX-GRILL-1536x1026_180x120.jpg'],
    ['Tikka Boti', '$23.99', 'images/Bbq/Tikka-boti-1536x1024_180x120.jpg']
  ],

  'tawa': [
    ['Champ Masala', '$29.99', "images/Tawa/Champ Masala.jpg"],
    ['Chicken Tawa Qeema', '$23.99', "images/Tawa/Chicken Tawa Qeema.jpg"],
    ['Lahori Tawa Piece', '$25.99', "images/Tawa/Lahori Tawa Piece.jpg"],
    ['Mutton Tawa Qeema', '$27.99', "images/Tawa/Mutton Tawa Qeema.jpg"],
    ['Mutton Kebab', '$26.99', 'images/Tawa/MUTTON-KEBAB-1536x1026.jpg'],
    ['Mix Grill (1 Kg)', '$54.99', "images/Tawa/Q-Lahore -Mix-Grill-1-Kg.jpg"],
    ['Chicken Kabab Masala', '$24.99', "images/Tawa/QL Chicken Kabab Masala.jpeg"],
    ['Mutton Kabab Masala', '$28.99', "images/Tawa/QL Mutton Kabab Masala.jpg"],
    ['Special Chicken Kabab Handi', '$26.99', "images/Tawa/QL SP Chicken Kabab handi.jpg"],
    ['Special Mutton Kabab Handi', '$30.99', "images/Tawa/QL SP Mutton Kabab handi.jpg"],
    ['Taka Tak Mix with Qeema', '$28.99', "images/Tawa/Taka tak Mix with Qeema.jpg"],
    ['Taka Tak Mix', '$26.99', "images/Tawa/Taka tak Mix.jpg"],
    ['Tikka Boti', '$23.99', 'images/Tawa/Tikka-boti-1-1536x1024.jpg']
  ],

  'tandoor': [
    ['Aloo Naan', '$5.99', 'images/Tandoor/ALOO-NAAN.jpg'],
    ['Butter Kulcha', '$4.99', 'images/Tandoor/Butter-kulcha.jpg'],
    ['Garlic Naan', '$4.99', 'images/Tandoor/Garlic Naan.jpeg'],
    ['Kalongi Kulcha', '$5.49', 'images/Tandoor/Kalongi-Kulcha.jpg'],
    ['Keema Naan', '$6.99', 'images/Tandoor/Keema-naan.jpeg'],
    ['Rogni Naan', '$5.49', 'images/Tandoor/Rogni Naan.jpg'],
    ['Zeera Naan', '$4.99', 'images/Tandoor/Zeera Naan.jpg']
  ],

  'sweets-chats': [
    ['Almond Barfi', '$12.99', 'images/channachat-sweet/almond-barfi.webp'],
    ['Barfi', '$10.99', 'images/channachat-sweet/BARFI-1536x1026.jpg'],
    ['Cham Cham', '$9.99', 'images/channachat-sweet/CHAM-CHAM-1536x1026.jpg'],
    ['Cham Cham (Classic)', '$9.99', 'images/channachat-sweet/cham-cham.jpeg'],
    ['Channa Pappri Chaat', '$11.99', "images/channachat-sweet/Channa-Pappri Chaat.jpg"],
    ['Dahi Bhalay', '$10.99', 'images/channachat-sweet/Dahi-Bhalay.jpg'],
    ['Falooda', '$13.99', 'images/channachat-sweet/FALOODA-1536x1026.jpg'],
    ['Falooda (Classic)', '$13.99', 'images/channachat-sweet/Falooda.jpg'],
    ['Gulab Jamun', '$8.99', "images/channachat-sweet/Ghulab Jamun.jpg"],
    ['Gol Gappay', '$9.99', 'images/channachat-sweet/gol-gappy.jpeg'],
    ['Gulab Jamun (Special)', '$8.99', 'images/channachat-sweet/GULAB-JAMUN.jpg'],
    ['Jalebi', '$7.99', 'images/channachat-sweet/Jalebi.webp'],
    ['Kheer', '$9.99', 'images/channachat-sweet/Kheer-.jpeg'],
    ['Kheer (Classic)', '$9.99', 'images/channachat-sweet/KHEER-1536x1026.jpg'],
    ['Mix Sweets', '$14.99', 'images/channachat-sweet/MIX-SWEETS.jpg'],
    ['Namak Paray', '$6.99', 'images/channachat-sweet/Namak-paray.jpeg'],
    ['Ras Malai', '$10.99', "images/channachat-sweet/Rus malai.jpeg"],
    ['Samosa Chaat', '$10.99', 'images/channachat-sweet/samosa-chat.jpeg'],
    ['Sohan Halwa', '$11.99', 'images/channachat-sweet/shon-halwa.jpeg'],
    ['Sohan Halwa (Classic)', '$11.99', 'images/channachat-sweet/SOHAN-HALWA-1536x1026.jpg']
  ],

  'drinks': [
    ['Apna Soda', '$3.99', "images/Drinks/Apna Soda.jpg"],
    ['Banana Milkshake', '$7.99', 'images/Drinks/Banana-Milkshake-1152x1536.jpg'],
    ['Khoya Khajour', '$8.99', 'images/Drinks/Khoya-Khajour.jpeg'],
    ['Mango Lassi', '$6.99', 'images/Drinks/mango-lassi-1536x1024.jpg'],
    ['Mango Shake', '$7.49', 'images/Drinks/mango-shake.jpg'],
    ['Pak Cola', '$2.99', 'images/Drinks/pak-cola.jpeg'],
    ['Pepsi / 7Up / Mirinda', '$2.99', 'images/Drinks/pepsi-7up-Miranda.jpg'],
    ['Rooh Afza Plus Soda', '$4.99', "images/Drinks/Rooh afza plus soda.jpeg"],
    ['Strawberry Lassi', '$6.99', 'images/Drinks/Strawberry-Lassi.jpg'],
    ['Strawberry Shake', '$7.49', "images/Drinks/Straweberry Shake.jpg"]
  ]
};

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

const products = [];
let productIdCounter = 1;

Object.entries(menuItems).forEach(([categoryKey, items]) => {
  const categoryName = productCategoryLabels[categoryKey] || categoryKey;

  items.forEach(([name, priceText, image]) => {
    const numericPrice = Number.parseFloat(String(priceText).replace(/[^0-9.]/g, ''));

    products.push({
      id: productIdCounter,
      name,
      category: categoryName,
      price: numericPrice,
      image,
      description: `Classic ${name} from our ${categoryName} menu.`,
      available: true
    });

    productIdCounter += 1;
  });
});

let cart = [];
const CART_STORAGE_KEY = 'tasteLahoreCart';
const cartToast = document.querySelector('.cart-toast');
const cartOverlay = document.querySelector('.cart-overlay');
const cartDrawer = document.querySelector('.cart-drawer');
const cartItemsContainer = document.querySelector('.cart-drawer__items');
const cartSubtotal = document.querySelector('.cart-summary__value');
const cartCloseButton = document.querySelector('.cart-drawer__close');
const checkoutDrawer = document.querySelector('.checkout-drawer');
const checkoutCloseButton = document.querySelector('.checkout-drawer__close');
const checkoutProceedButton = document.querySelector('.checkout-proceed-btn');
const checkoutForm = document.querySelector('.checkout-form');
const checkoutSummaryItems = document.querySelector('.checkout-summary__items');
const checkoutSubtotalValue = document.querySelector('.checkout-subtotal__value');
const checkoutTotalValue = document.querySelector('.checkout-total__value');
const checkoutEmptyState = document.querySelector('.checkout-empty');
const checkoutConfirmation = document.querySelector('.checkout-confirmation');
const checkoutModalBackdrop = document.querySelector('.checkout-modal-backdrop');
const checkoutConfirmationModal = document.querySelector('.checkout-confirmation-modal');
const checkoutConfirmationModalMessage = document.querySelector('.checkout-confirmation-modal__message');
const checkoutConfirmationModalClose = document.querySelector('.checkout-confirmation-modal__close');
const checkoutConfirmationModalButton = document.querySelector('.checkout-confirmation-modal__button');
let cartToastTimer;

function saveCart() {
  try {
    const cartState = cart.map(({ id, quantity }) => ({ id, quantity }));
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
  } catch (error) {
    console.warn('Taste Lahore cart could not be saved:', error);
  }
}

function loadCart() {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      cart = [];
      return;
    }

    const parsedCart = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) {
      cart = [];
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }

    const validProductIds = new Set(products.map((product) => product.id));

    cart = parsedCart
      .filter((item) => {
        if (!item || typeof item !== 'object') return false;

        const parsedId = Number(item.id);
        const parsedQuantity = Number(item.quantity);
        const hasValidProduct = validProductIds.has(parsedId);
        const hasValidQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0;

        return hasValidProduct && hasValidQuantity;
      })
      .map((item) => {
        const product = products.find((menuProduct) => menuProduct.id === Number(item.id));
        const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity
        };
      });
  } catch (error) {
    console.warn('Taste Lahore cart could not be loaded:', error);
    cart = [];
    localStorage.removeItem(CART_STORAGE_KEY);
  }
}

function formatPrice(value) {
  const numericValue = Number(value || 0);
  return `Rs. ${numericValue.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

function calculateCartSubtotal() {
  return cart.reduce((sum, item) => {
    const product = products.find((menuProduct) => menuProduct.id === item.id);
    return sum + ((product ? product.price : item.price || 0) * Number(item.quantity || 0));
  }, 0);
}

function updateCartCount() {
  const totalQuantity = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const cartCount = document.querySelector('.cart-count');
  if (cartCount) cartCount.textContent = String(totalQuantity);
  const cartButton = document.querySelector('.cart-button');
  if (cartButton) cartButton.setAttribute('aria-label', `Shopping cart with ${totalQuantity} items`);
}

function renderCart() {
  if (!cartItemsContainer || !cartSubtotal) return;

  const checkoutProceedButton = document.querySelector('.checkout-proceed-btn');
  if (checkoutProceedButton) {
    checkoutProceedButton.hidden = !cart.length;
  }

  if (!cart.length) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty__icon"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i></div>
        <h3>Your cart is empty.</h3>
        <p>Add some delicious food from our menu.</p>
      </div>
    `;
    cartSubtotal.textContent = formatPrice(0);
    return;
  }

  const cartMarkup = cart.map((item) => {
    const product = products.find((menuProduct) => menuProduct.id === item.id) || {
      name: item.name,
      price: item.price,
      image: item.image
    };

    return `
      <article class="cart-item" data-cart-id="${item.id}">
        <div class="cart-item__image-wrap">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="cart-item__details">
          <h3>${product.name}</h3>
          <p>${formatPrice(product.price || 0)}</p>
          <div class="cart-item__controls">
            <div class="cart-quantity" aria-label="Quantity controls">
              <button class="cart-quantity__button cart-quantity__button--decrease" type="button" data-product-id="${item.id}" aria-label="Decrease quantity">
                <i class="fa-solid fa-minus" aria-hidden="true"></i>
              </button>
              <span class="cart-quantity__value">${Number(item.quantity || 0)}</span>
              <button class="cart-quantity__button cart-quantity__button--increase" type="button" data-product-id="${item.id}" aria-label="Increase quantity">
                <i class="fa-solid fa-plus" aria-hidden="true"></i>
              </button>
            </div>
            <button class="cart-remove-btn" type="button" data-product-id="${item.id}" aria-label="Remove ${product.name}">Remove</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  cartItemsContainer.innerHTML = cartMarkup;
  cartSubtotal.textContent = formatPrice(calculateCartSubtotal());
}

function updateCartQuantity(productId, change) {
  const numericId = Number(productId);
  const itemIndex = cart.findIndex((item) => item.id === numericId);

  if (itemIndex === -1) return;

  const nextQuantity = cart[itemIndex].quantity + change;

  if (nextQuantity <= 0) {
    cart.splice(itemIndex, 1);
  } else {
    cart[itemIndex].quantity = nextQuantity;
  }

  saveCart();
  updateCartCount();
  renderCart();
  if (checkoutDrawer && checkoutDrawer.classList.contains('is-open')) {
    renderCheckout();
  }
}

function removeCartItem(productId) {
  const numericId = Number(productId);
  cart = cart.filter((item) => item.id !== numericId);
  saveCart();
  updateCartCount();
  renderCart();
  if (checkoutDrawer && checkoutDrawer.classList.contains('is-open')) {
    renderCheckout();
  }
}

function openCartDrawer() {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.add('is-open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  if (checkoutDrawer) {
    checkoutDrawer.classList.remove('is-open');
    checkoutDrawer.setAttribute('aria-hidden', 'true');
  }
  cartOverlay.classList.add('is-open');
  cartOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
  renderCart();
}

function closeCartDrawer() {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.remove('is-open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartOverlay.classList.remove('is-open');
  cartOverlay.setAttribute('aria-hidden', 'true');
  if (!checkoutDrawer || !checkoutDrawer.classList.contains('is-open')) {
    document.body.classList.remove('cart-open');
  }
}

function closeCheckoutDrawer() {
  if (!checkoutDrawer || !cartOverlay) return;
  checkoutDrawer.classList.remove('is-open');
  checkoutDrawer.setAttribute('aria-hidden', 'true');
  cartOverlay.classList.remove('is-open');
  cartOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-open');
}

function getCheckoutSummaryItems() {
  return cart.map((item) => {
    const product = products.find((menuProduct) => menuProduct.id === item.id);
    const unitPrice = product ? product.price : Number(item.price || 0);
    const quantity = Number(item.quantity || 0);
    return {
      id: item.id,
      name: product ? product.name : item.name,
      image: product ? product.image : item.image,
      quantity,
      unitPrice,
      itemTotal: unitPrice * quantity
    };
  });
}

function renderCheckout() {
  if (!checkoutForm || !checkoutSummaryItems || !checkoutSubtotalValue || !checkoutTotalValue) return;

  if (!cart.length) {
    checkoutForm.hidden = true;
    if (checkoutEmptyState) {
      checkoutEmptyState.hidden = false;
    }
    if (checkoutConfirmation) {
      checkoutConfirmation.textContent = '';
    }
    if (checkoutSubtotalValue) {
      checkoutSubtotalValue.textContent = formatPrice(0);
    }
    if (checkoutTotalValue) {
      checkoutTotalValue.textContent = formatPrice(0);
    }
    checkoutSummaryItems.innerHTML = `
      <div class="checkout-summary__empty">
        <p>Your cart is empty.</p>
      </div>
    `;
    return;
  }

  if (checkoutEmptyState) {
    checkoutEmptyState.hidden = true;
  }
  checkoutForm.hidden = false;

  const summaryItems = getCheckoutSummaryItems();
  const subtotal = calculateCartSubtotal();
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  checkoutSummaryItems.innerHTML = summaryItems.map((item) => `
    <article class="checkout-summary__item" data-checkout-id="${item.id}">
      <div class="checkout-summary__thumb">
        <img src="${item.image}" alt="${item.name}">
      </div>
      <div class="checkout-summary__details">
        <h4>${item.name}</h4>
        <p>Qty: ${item.quantity}</p>
        <p>${formatPrice(item.unitPrice)} each</p>
        <strong>Item Total: ${formatPrice(item.itemTotal)}</strong>
      </div>
    </article>
  `).join('');

  checkoutSubtotalValue.textContent = formatPrice(subtotal);
  checkoutTotalValue.textContent = formatPrice(total);
}

function openCheckoutDrawer() {
  if (!checkoutDrawer || !cartOverlay) return;

  if (!cart.length) {
    renderCheckout();
    checkoutDrawer.classList.add('is-open');
    checkoutDrawer.setAttribute('aria-hidden', 'false');
    cartOverlay.classList.add('is-open');
    cartOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-open');
    return;
  }

  if (cartDrawer) {
    cartDrawer.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
  }

  renderCheckout();
  checkoutDrawer.classList.add('is-open');
  checkoutDrawer.setAttribute('aria-hidden', 'false');
  cartOverlay.classList.add('is-open');
  cartOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
}

function setCheckoutFieldError(fieldName, message) {
  const input = checkoutForm ? checkoutForm.querySelector(`[name="${fieldName}"]`) : null;
  const errorElement = checkoutForm ? checkoutForm.querySelector(`[data-error-for="${fieldName}"]`) : null;

  if (!input || !errorElement) return;

  input.classList.toggle('checkout-field--error', Boolean(message));
  input.setAttribute('aria-invalid', String(Boolean(message)));
  errorElement.textContent = message || '';
}

function validateCheckoutField(fieldName) {
  const field = checkoutForm ? checkoutForm.querySelector(`[name="${fieldName}"]`) : null;
  if (!field) return true;

  const value = field.value.trim();

  if (fieldName === 'name') {
    if (!value) {
      setCheckoutFieldError('name', 'Please enter your full name.');
      return false;
    }
    setCheckoutFieldError('name', '');
    return true;
  }

  if (fieldName === 'phone') {
    const normalizedPhone = value.replace(/\s+/g, '').replace(/-/g, '');
    const isPakistaniPhone = /^(?:\+92|92|0)?3\d{9}$/.test(normalizedPhone);
    if (!value) {
      setCheckoutFieldError('phone', 'Please enter your phone number.');
      return false;
    }
    if (!isPakistaniPhone) {
      setCheckoutFieldError('phone', 'Please enter a valid Pakistani phone number.');
      return false;
    }
    setCheckoutFieldError('phone', '');
    return true;
  }

  if (fieldName === 'address') {
    if (!value) {
      setCheckoutFieldError('address', 'Please enter your delivery address.');
      return false;
    }
    setCheckoutFieldError('address', '');
    return true;
  }

  return true;
}

function validateCheckoutForm() {
  const fields = ['name', 'phone', 'address'];
  let isValid = true;

  fields.forEach((fieldName) => {
    if (!validateCheckoutField(fieldName)) {
      isValid = false;
    }
  });

  return isValid;
}

function openCheckoutConfirmation(message) {
  if (!checkoutModalBackdrop || !checkoutConfirmationModal || !checkoutConfirmationModalMessage) return;
  checkoutConfirmationModalMessage.textContent = message;
  checkoutModalBackdrop.setAttribute('aria-hidden', 'false');
  checkoutConfirmationModal.setAttribute('aria-hidden', 'false');
  checkoutModalBackdrop.classList.add('is-visible');
  checkoutConfirmationModal.classList.add('is-visible');
  checkoutConfirmationModal.setAttribute('tabindex', '-1');
  checkoutConfirmationModal.focus();
}

function closeCheckoutConfirmation() {
  if (!checkoutModalBackdrop || !checkoutConfirmationModal) return;
  checkoutModalBackdrop.setAttribute('aria-hidden', 'true');
  checkoutConfirmationModal.setAttribute('aria-hidden', 'true');
  checkoutModalBackdrop.classList.remove('is-visible');
  checkoutConfirmationModal.classList.remove('is-visible');
}

function showCheckoutConfirmation(message) {
  if (!checkoutConfirmation) return;
  checkoutConfirmation.textContent = message;
}

function showCartToast(message) {
  if (!cartToast) return;
  cartToast.textContent = message;
  cartToast.classList.add('is-visible');
  window.clearTimeout(cartToastTimer);
  cartToastTimer = window.setTimeout(() => cartToast.classList.remove('is-visible'), 1400);
}

function addToCart(productId) {
  const numericId = Number(productId);
  const product = products.find((item) => item.id === numericId);

  if (!product || !product.available) return;

  const existingItem = cart.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  console.log('Taste Lahore Cart:', cart);
  saveCart();
  updateCartCount();
  renderCart();
  showCartToast(`✓ ${product.name} added to cart`);
}

console.log('Taste Lahore Products:', products);
console.log('Total Products:', products.length);
console.log('First Product:', products[0]);

// Rebuild the dish grid whenever a category tab is selected.
const menuTabs = document.querySelectorAll('.menu-tab');
const menuDishes = document.querySelector('.menu-dishes');

function renderMenu(category) {
  const normalizedCategory = menuItems[category] ? category : 'daily-menu';
  const categoryName = productCategoryLabels[normalizedCategory] || normalizedCategory;
  const categoryProducts = products.filter((product) => product.category === categoryName);

  if (!menuDishes) return;

  menuDishes.classList.add('is-changing');
  menuDishes.innerHTML = '';

  categoryProducts.forEach((product) => {
    const dish = document.createElement('div');
    dish.className = 'menu-dish';
    dish.dataset.productId = String(product.id);
    dish.dataset.name = product.name;
    dish.innerHTML = `
      <img class="menu-dish__image" src="${product.image}" alt="${product.name}">
      <span class="menu-dish__text">
        <strong class="menu-dish__name">${product.name}</strong>
        <small class="menu-dish__description">${product.description}</small>
      </span>
      <span class="menu-dish__meta">
        <strong class="menu-dish__price">${formatPrice(product.price)}</strong>
        <button class="add-to-cart-btn" type="button" data-product-id="${product.id}">Add to Cart</button>
      </span>
    `;

    dish.addEventListener('click', (event) => {
      if (event.target.closest('.add-to-cart-btn')) return;
      console.log(`${product.name} clicked`);
    });

    const addButton = dish.querySelector('.add-to-cart-btn');
    addButton.addEventListener('click', (event) => {
      event.stopPropagation();
      addToCart(event.currentTarget.dataset.productId);
    });

    menuDishes.appendChild(dish);
  });

  window.requestAnimationFrame(() => menuDishes.classList.remove('is-changing'));
}

if (menuDishes) {
  menuTabs.forEach((tab) => tab.addEventListener('click', () => {
    menuTabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-selected', String(isActive));
    });
    renderMenu(tab.dataset.category);
  }));
  renderMenu('daily-menu');
}

const cartButton = document.querySelector('.cart-button');
if (cartButton) {
  cartButton.addEventListener('click', () => {
    openCartDrawer();
  });
}

if (cartCloseButton) {
  cartCloseButton.addEventListener('click', closeCartDrawer);
}

if (cartOverlay) {
  cartOverlay.addEventListener('click', () => {
    closeCartDrawer();
    closeCheckoutDrawer();
  });
}

if (cartItemsContainer) {
  cartItemsContainer.addEventListener('click', (event) => {
    const control = event.target.closest('.cart-quantity__button');
    if (control) {
      const delta = control.classList.contains('cart-quantity__button--increase') ? 1 : -1;
      updateCartQuantity(control.dataset.productId, delta);
      return;
    }

    const removeButton = event.target.closest('.cart-remove-btn');
    if (removeButton) {
      removeCartItem(removeButton.dataset.productId);
    }
  });
}

if (checkoutProceedButton) {
  checkoutProceedButton.addEventListener('click', () => {
    openCheckoutDrawer();
  });
}

if (checkoutCloseButton) {
  checkoutCloseButton.addEventListener('click', closeCheckoutDrawer);
}

const checkoutContinueButtons = document.querySelectorAll('.checkout-continue-btn');
checkoutContinueButtons.forEach((button) => {
  button.addEventListener('click', () => {
    closeCheckoutDrawer();
    closeCartDrawer();
  });
});

if (checkoutForm) {
  checkoutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    showCheckoutConfirmation('');
    closeCheckoutConfirmation();

    if (!validateCheckoutForm()) {
      showCheckoutConfirmation('Please complete all required fields.');
      return;
    }

    openCheckoutConfirmation('Your customer information has been successfully validated. Actual order submission will be connected in a future step.');
  });

  ['name', 'phone', 'address'].forEach((fieldName) => {
    const field = checkoutForm.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    field.addEventListener('input', () => {
      validateCheckoutField(fieldName);
      if (checkoutConfirmation) {
        checkoutConfirmation.textContent = '';
      }
    });

    field.addEventListener('blur', () => {
      validateCheckoutField(fieldName);
    });
  });
}

if (checkoutModalBackdrop) {
  checkoutModalBackdrop.addEventListener('click', closeCheckoutConfirmation);
}

if (checkoutConfirmationModalClose) {
  checkoutConfirmationModalClose.addEventListener('click', closeCheckoutConfirmation);
}

if (checkoutConfirmationModalButton) {
  checkoutConfirmationModalButton.addEventListener('click', closeCheckoutConfirmation);
}

if (checkoutDrawer) {
  const checkoutBackButton = checkoutDrawer.querySelector('.checkout-back-btn');
  if (checkoutBackButton) {
    checkoutBackButton.addEventListener('click', () => {
      closeCheckoutDrawer();
      openCartDrawer();
    });
  }
}

loadCart();
updateCartCount();
renderCart();
renderCheckout();

// Newsletter validation: customize the rules or success copy here later.
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const consentInput = newsletterForm.querySelector('input[type="checkbox"]');
    const message = newsletterForm.querySelector('.newsletter-message');
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
    if (!emailIsValid) {
      message.textContent = 'Please enter a valid email address.';
      return;
    }
    if (!consentInput.checked) {
      message.textContent = 'Please agree to the Privacy Policy.';
      return;
    }
    console.log(`Newsletter signup: ${emailInput.value.trim()}`);
    message.textContent = 'Thanks! You are subscribed.';
    newsletterForm.reset();
  });
}

// Close transient controls when the user clicks elsewhere.
document.addEventListener('click', (event) => {
  if (!event.target.closest('.search-wrap')) {
    searchWrap.classList.remove('is-open');
    searchButton.setAttribute('aria-expanded', 'false');
  }
  if (!event.target.closest('.nav-item')) {
    document.querySelectorAll('.nav-item.is-open').forEach((item) => item.classList.remove('is-open'));
  }
});
