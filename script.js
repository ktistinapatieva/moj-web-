document.documentElement.classList.add("js");

const year = document.querySelector("#current-year");
if (year) year.textContent = String(new Date().getFullYear());

const searchForm = document.querySelector("#product-search");
const searchInput = document.querySelector("#search-input");
const productCards = [...document.querySelectorAll(".product-card")];
const searchResults = document.querySelector("#search-results");

function normalizeText(value) {
  return value.toLocaleLowerCase("sk").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function filterProducts() {
  const query = normalizeText(searchInput.value.trim());
  let visibleCount = 0;

  productCards.forEach((card) => {
    const matches = normalizeText(`${card.dataset.search || ""} ${card.textContent}`).includes(query);
    card.hidden = !matches;
    if (matches) visibleCount += 1;
  });

  if (searchResults) searchResults.textContent = query
    ? visibleCount === 0
      ? "Nenašli sa žiadne produkty."
      : `Počet nájdených produktov: ${visibleCount}.`
    : "";
}

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    filterProducts();
  });
}

if (searchInput) searchInput.addEventListener("input", filterProducts);

const cart = new Map();
const productVisuals = new Map(productCards.flatMap((card) => {
  const productId = card.querySelector(".add-to-cart")?.dataset.productId;
  const visual = card.querySelector(".product-visual");
  return productId && visual ? [[productId, visual]] : [];
}));
const fallbackProductVisuals = {
  "glow-serum": ["visual-serum", "serum", "LUXE", "GLOW SERUM", "Bestseller"],
  "daily-cream": ["visual-cream", "cream", "BOTANICA", "DAILY CREAM", "Každodenný rituál"],
  "calming-oil": ["visual-oil", "oil", "LUXE", "CALMING OIL", "Jemné čistenie"],
  "night-cream": ["visual-cream", "cream", "LUXE", "NIGHT CREAM", "Novinka"],
  "hydra-tonic": ["visual-serum", "serum", "BOTANICA", "HYDRA TONIC", "Hydratácia"],
  "lip-balm": ["visual-oil", "cream", "LUXE", "LIP BALM", "Denný základ"],
  "body-butter": ["visual-cream", "cream", "BOTANICA", "BODY BUTTER", "Pre telo"],
  "clear-mask": ["visual-oil", "cream", "LUXE", "CLEAR MASK", "Týždenný rituál"]
};
const fallbackProductSizes = {
  "glow-serum": "30 ml",
  "daily-cream": "50 ml",
  "calming-oil": "100 ml",
  "night-cream": "50 ml",
  "hydra-tonic": "150 ml",
  "lip-balm": "15 ml",
  "body-butter": "200 ml",
  "clear-mask": "75 ml"
};
const productSizes = new Map(productCards.flatMap((card) => {
  const productId = card.querySelector(".add-to-cart")?.dataset.productId;
  const size = card.querySelector(".product-size")?.textContent.trim();
  return productId && size ? [[productId, size]] : [];
}));
try {
  const savedCart = JSON.parse(localStorage.getItem("luxe-cart") || "[]");
  savedCart.forEach((item) => {
    if (item.id && item.name && Number.isFinite(item.price) && Number.isFinite(item.quantity) && item.quantity > 0) {
      cart.set(item.id, {
        name: item.name,
        price: item.price,
        quantity: item.quantity
      });
    }
  });
} catch {
  localStorage.removeItem("luxe-cart");
}
const cartDialog = document.querySelector("#cart-dialog");
const cartTrigger = document.querySelector(".cart-trigger");
const cartClose = document.querySelector(".cart-close");
const cartItems = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const cartAnnouncement = document.querySelector("#cart-announcement");
const checkoutButton = document.querySelector("#checkout-button");
const continueShoppingButton = document.querySelector("#continue-shopping-button");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutItems = document.querySelector("#checkout-items");
const checkoutTotal = document.querySelector("#checkout-total");
const checkoutEmpty = document.querySelector("#checkout-empty");
const orderConfirmation = document.querySelector("#order-confirmation");
const currency = new Intl.NumberFormat("sk-SK", {
  style: "currency",
  currency: "EUR"
});

function createCartControl(label, action, text, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.dataset.cartAction = action;
  button.className = className;
  button.textContent = text;
  return button;
}

function getProductVisual(productId) {
  const source = productVisuals.get(productId);
  if (source) return source.cloneNode(true);

  const visualDetails = Object.prototype.hasOwnProperty.call(fallbackProductVisuals, productId)
    ? fallbackProductVisuals[productId]
    : null;
  if (!visualDetails) return null;

  const [background, containerType, brand, productName, badgeText] = visualDetails;
  const visual = document.createElement("div");
  visual.className = `product-visual ${background}`;

  const container = document.createElement("span");
  container.className = containerType === "cream"
    ? "cream-jar"
    : `product-bottle ${containerType === "oil" ? "oil-bottle" : "serum-bottle"}`;

  if (containerType !== "cream") {
    const cap = document.createElement("span");
    cap.className = "bottle-cap";
    container.append(cap);
  } else {
    const lid = document.createElement("span");
    lid.className = "jar-lid";
    container.append(lid);
  }

  const label = document.createElement("span");
  label.className = containerType === "cream" ? "jar-label" : "bottle-label";
  label.append(document.createTextNode(brand), document.createElement("br"));
  const productLabel = document.createElement("small");
  productLabel.textContent = productName;
  label.append(productLabel);
  container.append(label);
  visual.append(container);

  const badge = document.createElement("span");
  badge.className = "product-badge";
  badge.textContent = badgeText;
  visual.append(badge);
  return visual;
}

function saveCart() {
  const savedCart = [...cart.entries()].map(([id, item]) => ({
    id,
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));
  localStorage.setItem("luxe-cart", JSON.stringify(savedCart));
}

function renderCart() {
  saveCart();
  const itemCount = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  const total = [...cart.values()].reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemWord = itemCount === 1 ? "položka" : itemCount >= 2 && itemCount <= 4 ? "položky" : "položiek";

  cartCount.textContent = String(itemCount);
  if (cartTrigger) cartTrigger.setAttribute("aria-label", `Košík, ${itemCount} ${itemWord}`);
  cartTotal.textContent = currency.format(total);
  cartEmpty.hidden = cart.size > 0;
  checkoutButton.disabled = cart.size === 0;
  cartItems.replaceChildren();

  cart.forEach((item, id) => {
    const row = document.createElement("li");
    row.className = "cart-item";

    const thumbnail = document.createElement("div");
    thumbnail.className = "cart-item-thumbnail";
    thumbnail.setAttribute("aria-hidden", "true");
    const productVisual = getProductVisual(id);
    if (productVisual) thumbnail.append(productVisual);

    const details = document.createElement("div");
    details.className = "cart-item-details";
    const name = document.createElement("h3");
    name.textContent = item.name;
    const price = document.createElement("p");
    price.textContent = currency.format(item.price * item.quantity);
    details.append(name, price);

    const controls = document.createElement("div");
    controls.className = "cart-item-controls";
    controls.append(
      createCartControl(`Odobrať jeden kus produktu ${item.name}`, "decrease", "−"),
    );
    const quantity = document.createElement("span");
    quantity.textContent = String(item.quantity);
    quantity.setAttribute("aria-label", `Počet kusov: ${item.quantity}`);
    controls.append(
      quantity,
      createCartControl(`Pridať jeden kus produktu ${item.name}`, "increase", "+"),
      createCartControl(`Odstrániť produkt ${item.name}`, "remove", "×", "remove-item"),
    );

    row.dataset.productId = id;
    row.append(thumbnail, details, controls);
    cartItems.append(row);
  });
}

function openCart() {
  if (!cartDialog || !cartTrigger || cartDialog.open) return;
  cartDialog.showModal();
  cartTrigger.setAttribute("aria-expanded", "true");
}

function renderCheckout() {
  if (!checkoutForm || !checkoutItems || !checkoutTotal || !checkoutEmpty) return;

  checkoutItems.replaceChildren();
  let total = 0;

  cart.forEach((item, id) => {
    const row = document.createElement("li");
    row.className = "checkout-item";

    const thumbnail = document.createElement("div");
    thumbnail.className = "checkout-item-thumbnail";
    thumbnail.setAttribute("aria-hidden", "true");
    const productVisual = getProductVisual(id);
    if (productVisual) thumbnail.append(productVisual);

    const details = document.createElement("div");
    details.className = "checkout-item-details";
    const name = document.createElement("h3");
    name.textContent = item.name;
    const fallbackSize = Object.prototype.hasOwnProperty.call(fallbackProductSizes, id)
      ? fallbackProductSizes[id]
      : "";
    const size = productSizes.get(id) || fallbackSize;
    const meta = document.createElement("p");
    meta.textContent = `${size} · ${item.quantity} ks`;
    const price = document.createElement("strong");
    price.textContent = currency.format(item.price * item.quantity);
    details.append(name, meta);

    row.append(thumbnail, details, price);
    checkoutItems.append(row);
    total += item.price * item.quantity;
  });

  checkoutTotal.textContent = currency.format(total);
  const hasItems = cart.size > 0;
  checkoutForm.hidden = !hasItems;
  checkoutEmpty.hidden = hasItems;
}

if (cartItems) renderCart();
if (checkoutForm) renderCheckout();

document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", () => {
    const { productId, productName } = button.dataset;
    const price = Number(button.dataset.productPrice);

    if (!productId || !productName || !Number.isFinite(price) || price <= 0) {
      throw new Error("Produkt v katalógu má neplatné údaje pre košík.");
    }

    const item = cart.get(productId);
    if (item) {
      item.quantity += 1;
    } else {
      cart.set(productId, { name: productName, price, quantity: 1 });
    }

    renderCart();
    cartAnnouncement.textContent = `${productName} bol pridaný do košíka.`;
    openCart();
  });
});

if (cartItems) {
  cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-cart-action]");
    if (!button) return;

    const row = button.closest(".cart-item");
    const item = cart.get(row.dataset.productId);
    if (!item) return;

    if (button.dataset.cartAction === "increase") {
      item.quantity += 1;
    } else if (button.dataset.cartAction === "decrease") {
      item.quantity -= 1;
      if (item.quantity === 0) cart.delete(row.dataset.productId);
    } else if (button.dataset.cartAction === "remove") {
      cart.delete(row.dataset.productId);
    }

    renderCart();
  });
}

if (cartTrigger && cartDialog) {
  cartTrigger.addEventListener("click", openCart);
}
if (cartClose && cartDialog) {
  cartClose.addEventListener("click", () => cartDialog.close());
  cartDialog.addEventListener("close", () => cartTrigger.setAttribute("aria-expanded", "false"));
  cartDialog.addEventListener("click", (event) => {
    if (event.target === cartDialog) cartDialog.close();
  });
}

if (continueShoppingButton && cartDialog) {
  continueShoppingButton.addEventListener("click", () => cartDialog.close());
}

if (checkoutButton) {
  checkoutButton.addEventListener("click", () => {
    if (cart.size === 0) return;
    window.location.href = "objednavka.html";
  });
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (cart.size === 0) return;

    const customerName = new FormData(checkoutForm).get("name");
    cart.clear();
    saveCart();
    renderCheckout();
    checkoutEmpty.hidden = true;
    if (orderConfirmation) {
      orderConfirmation.textContent = `Ďakujeme${customerName ? `, ${customerName}` : ""}. Objednávka bola zaznamenaná v ukážkovej pokladni. Údaje neboli odoslané.`;
      orderConfirmation.hidden = false;
    }
  });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !prefersReducedMotion) {
  document.documentElement.classList.add("motion-ready");

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: "0px 0px -35px 0px"
  });

  document.querySelectorAll("[data-reveal]").forEach((element) => {
    revealObserver.observe(element);
  });
}
