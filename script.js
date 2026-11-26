document.documentElement.classList.add("js");

const year = document.querySelector("#current-year");
year.textContent = String(new Date().getFullYear());

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
const checkoutNote = document.querySelector("#checkout-note");
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
  cartTrigger.setAttribute("aria-label", `Košík, ${itemCount} ${itemWord}`);
  cartTotal.textContent = currency.format(total);
  cartEmpty.hidden = cart.size > 0;
  checkoutButton.disabled = cart.size === 0;
  cartItems.replaceChildren();

  cart.forEach((item, id) => {
    const row = document.createElement("li");
    row.className = "cart-item";

    const details = document.createElement("div");
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
    row.append(details, controls);
    cartItems.append(row);
  });
}

renderCart();

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
  });
});

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

if (cartTrigger && cartDialog) {
  cartTrigger.addEventListener("click", () => {
    cartDialog.showModal();
    cartTrigger.setAttribute("aria-expanded", "true");
  });
}
if (cartClose && cartDialog) {
  cartClose.addEventListener("click", () => cartDialog.close());
  cartDialog.addEventListener("close", () => cartTrigger.setAttribute("aria-expanded", "false"));
  cartDialog.addEventListener("click", (event) => {
    if (event.target === cartDialog) cartDialog.close();
  });
}

if (checkoutButton) {
  checkoutButton.addEventListener("click", () => {
    checkoutNote.textContent = "Toto je ukážkový košík. Pre prijímanie platieb je potrebné prepojiť pokladňu s platobnou bránou.";
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
