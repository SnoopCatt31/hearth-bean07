import { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";

/* =========================================================================
   Hearth & Bean — QR table-ordering (v4, multilingual + allergens + currency)
   Languages: English, Türkçe, Русский, Deutsch, العربية (with RTL)
   ========================================================================= */

const REWARD_THRESHOLD = 5;
const REWARD_ITEMS = ["filter", "donut"];
const TABLE_COUNT = 12;

const STAFF_EMAIL = "admin@hearthbean.co";
const STAFF_PASSWORD = "cafe1234";

// ── Para birimleri ──────────────────────────────────────────────────────────
const CURRENCIES = {
  TRY: { symbol: "₺", name: "Türk Lirası", locale: "tr-TR" },
  EUR: { symbol: "€", name: "Euro",         locale: "de-DE" },
  USD: { symbol: "$", name: "US Dollar",    locale: "en-US" },
  GBP: { symbol: "£", name: "British Pound",locale: "en-GB" },
  AED: { symbol: "د.إ",name: "UAE Dirham",  locale: "ar-AE" },
};
const DEFAULT_CURRENCY = "TRY";
const formatMoney = (n, cur) => {
  const code = cur || DEFAULT_CURRENCY;
  const c = CURRENCIES[code] || CURRENCIES.TRY;
  try { return new Intl.NumberFormat(c.locale, { style: "currency", currency: code, minimumFractionDigits: 2 }).format(Number(n)); }
  catch { return `${c.symbol}${Number(n).toFixed(2)}`; }
};

// ── Alerjenler (AB direktifi 14 + vegan/vejetaryen) ────────────────────────
const ALLERGENS = [
  { id: "gluten",     emoji: "🌾", tr: "Gluten",        en: "Gluten"      },
  { id: "lactose",    emoji: "🥛", tr: "Laktoz",        en: "Lactose"     },
  { id: "eggs",       emoji: "🥚", tr: "Yumurta",       en: "Eggs"        },
  { id: "nuts",       emoji: "🥜", tr: "Kuruyemiş",     en: "Nuts"        },
  { id: "peanuts",    emoji: "🥜", tr: "Fıstık",        en: "Peanuts"     },
  { id: "fish",       emoji: "🐟", tr: "Balık",         en: "Fish"        },
  { id: "shellfish",  emoji: "🦐", tr: "Kabuklu Deniz", en: "Shellfish"   },
  { id: "soy",        emoji: "🫘", tr: "Soya",          en: "Soy"         },
  { id: "sesame",     emoji: "🌰", tr: "Susam",         en: "Sesame"      },
  { id: "mustard",    emoji: "🌭", tr: "Hardal",        en: "Mustard"     },
  { id: "sulphites",  emoji: "🍷", tr: "Sülfit",        en: "Sulphites"   },
  { id: "celery",     emoji: "🌿", tr: "Kereviz",       en: "Celery"      },
  { id: "vegan",      emoji: "🌱", tr: "Vegan",         en: "Vegan"       },
  { id: "vegetarian", emoji: "🥗", tr: "Vejetaryen",    en: "Vegetarian"  },
];

const CATS = [{ key: "hot" }, { key: "cold" }, { key: "fruit" }, { key: "shakes" }, { key: "softdrinks" }, { key: "snacks" }, { key: "dessert" }];
const CAT_TINT = { hot: "#efe0c6", cold: "#d8e6e2", fruit: "#f0e0d6", shakes: "#ecdfe8", softdrinks: "#dde8ee", snacks: "#ece2cf", dessert: "#f1e4cf" };
const CAT_EMOJI = { hot: "☕", cold: "🧋", fruit: "🍊", shakes: "🥤", softdrinks: "🥂", snacks: "🥐", dessert: "🍰" };
const CAT_IMG = { hot: "/menu/cat-hot.jpg", cold: "/menu/cat-cold.jpg", fruit: "/menu/cat-fruit.jpg", shakes: "/menu/cat-shakes.jpg", softdrinks: "/menu/cat-softdrinks.jpg", snacks: "/menu/cat-snacks.jpg", dessert: "/menu/cat-dessert.jpg" };

const IMG = (name) => `/menu/${name}.jpg`;
const DEFAULT_MENU = [
  { id: "filter", cat: "hot", name: "Filter Coffee", desc: "Single-origin, slow drip", ingredients: "Single-origin beans, filtered water", allergens: [], price: 45, emoji: "☕", image: IMG("filter"), available: true },
  { id: "flatwhite", cat: "hot", name: "Flat White", desc: "Double ristretto, silk milk", ingredients: "Espresso, steamed milk", allergens: ["lactose"], price: 70, emoji: "🥛", image: IMG("flatwhite"), available: true },
  { id: "cappuccino", cat: "hot", name: "Cappuccino", desc: "Equal parts, cocoa dusted", ingredients: "Espresso, milk, foam, cocoa", allergens: ["lactose"], price: 68, emoji: "☕", image: IMG("cappuccino"), available: true },
  { id: "latte", cat: "hot", name: "Café Latte", desc: "Smooth, comforting, classic", ingredients: "Espresso, steamed milk", allergens: ["lactose"], price: 72, emoji: "☕", image: IMG("latte"), available: true },
  { id: "mocha", cat: "hot", name: "Hearth Mocha", desc: "Dark chocolate + espresso", ingredients: "Espresso, dark chocolate, milk", allergens: ["lactose"], price: 80, emoji: "🍫", image: IMG("mocha"), available: true },
  { id: "espresso", cat: "hot", name: "Espresso", desc: "One honest shot", ingredients: "Single espresso", allergens: [], price: 40, emoji: "☕", image: IMG("filter"), available: true },
  { id: "double", cat: "hot", name: "Double Espresso", desc: "Twice the resolve", ingredients: "Double espresso", allergens: [], price: 55, emoji: "☕", image: IMG("filter"), available: true },
  { id: "cortado", cat: "hot", name: "Cortado", desc: "Cut with warm milk", ingredients: "Espresso, warm milk", allergens: ["lactose"], price: 58, emoji: "🥛", image: IMG("flatwhite"), available: true },
  { id: "macchiato", cat: "hot", name: "Macchiato", desc: "Espresso, a spot of foam", ingredients: "Espresso, milk foam", allergens: ["lactose"], price: 50, emoji: "☕", image: IMG("cappuccino"), available: true },
  { id: "icedlatte", cat: "cold", name: "Iced Latte", desc: "Chilled, mellow, easy", ingredients: "Espresso, cold milk, ice", allergens: ["lactose"], price: 75, emoji: "🧋", image: IMG("icedlatte"), available: true },
  { id: "coldbrew", cat: "cold", name: "Cold Brew", desc: "18-hour steep, bold", ingredients: "Cold-steeped coffee, ice", allergens: [], price: 78, emoji: "🥤", image: IMG("coldbrew"), available: true },
  { id: "icedmocha", cat: "cold", name: "Iced Mocha", desc: "Chocolate cold brew", ingredients: "Cold brew, chocolate, milk, ice", allergens: ["lactose"], price: 85, emoji: "🧊", image: IMG("icedmocha"), available: true },
  { id: "affogato", cat: "cold", name: "Affogato", desc: "Espresso over vanilla gelato", ingredients: "Espresso, vanilla gelato", allergens: ["lactose", "eggs"], price: 90, emoji: "🍨", image: IMG("affogato"), available: true },
  { id: "orangemint", cat: "fruit", name: "Orange & Mint", desc: "Fresh-pressed, bright", ingredients: "Orange, mint, ice", allergens: [], price: 65, emoji: "🍊", image: IMG("orangemint"), available: true },
  { id: "berrylem", cat: "fruit", name: "Berry Lemonade", desc: "Mixed berries, house lemonade", ingredients: "Mixed berries, lemon, soda", allergens: [], price: 70, emoji: "🫐", image: IMG("berrylem"), available: true },
  { id: "watermelon", cat: "fruit", name: "Watermelon Cooler", desc: "Just melon and ice", ingredients: "Watermelon, ice", allergens: [], price: 68, emoji: "🍉", image: IMG("watermelon"), available: true },
  { id: "applefizz", cat: "fruit", name: "Green Apple Fizz", desc: "Tart apple, sparkling", ingredients: "Green apple, sparkling water", allergens: [], price: 66, emoji: "🍏", image: IMG("applefizz"), available: true },
  { id: "vanilla", cat: "shakes", name: "Vanilla Bean Shake", desc: "Real vanilla, real cream", ingredients: "Vanilla ice cream, milk", allergens: ["lactose", "eggs"], price: 88, emoji: "🥤", image: IMG("vanilla"), available: true },
  { id: "choc", cat: "shakes", name: "Chocolate Shake", desc: "Double cocoa", ingredients: "Chocolate ice cream, cocoa, milk", allergens: ["lactose", "eggs"], price: 90, emoji: "🍫", image: IMG("choc"), available: true },
  { id: "caramel", cat: "shakes", name: "Salted Caramel Shake", desc: "Sweet meets salt", ingredients: "Caramel, sea salt, ice cream, milk", allergens: ["lactose", "eggs"], price: 95, emoji: "🍮", image: IMG("vanilla"), available: true },
  { id: "strawberry", cat: "shakes", name: "Strawberry Shake", desc: "Fresh strawberries", ingredients: "Strawberries, ice cream, milk", allergens: ["lactose", "eggs"], price: 90, emoji: "🍓", image: IMG("strawberry"), available: true },
  { id: "cola", cat: "softdrinks", name: "Cola", desc: "Ice-cold classic", ingredients: "Cola, ice", allergens: [], price: 35, emoji: "🥤", image: "", available: true },
  { id: "sparkling", cat: "softdrinks", name: "Sparkling Water", desc: "Crisp and clean", ingredients: "Carbonated mineral water", allergens: [], price: 28, emoji: "💧", image: "", available: true },
  { id: "lemonsoda", cat: "softdrinks", name: "Lemon Soda", desc: "Zesty and refreshing", ingredients: "Lemon, soda water", allergens: [], price: 38, emoji: "🍋", image: "", available: true },
  { id: "ayran", cat: "softdrinks", name: "Ayran", desc: "Traditional yogurt drink", ingredients: "Yogurt, water, salt", allergens: ["lactose"], price: 30, emoji: "🥛", image: "", available: true },
  { id: "icedtea", cat: "softdrinks", name: "Iced Tea", desc: "Brewed, chilled, lightly sweet", ingredients: "Black tea, lemon, ice", allergens: [], price: 40, emoji: "🧊", image: "", available: true },
  { id: "croissant", cat: "snacks", name: "Butter Croissant", desc: "Flaky, golden, French", ingredients: "Flour, butter", allergens: ["gluten", "lactose", "eggs"], price: 45, emoji: "🥐", image: "", available: true },
  { id: "toastie", cat: "snacks", name: "Cheese Toastie", desc: "Melted cheese, grilled", ingredients: "Bread, cheese, butter", allergens: ["gluten", "lactose"], price: 65, emoji: "🥪", image: "", available: true },
  { id: "bagel", cat: "snacks", name: "Sesame Bagel", desc: "Toasted, with cream cheese", ingredients: "Bagel, cream cheese", allergens: ["gluten", "lactose", "sesame"], price: 55, emoji: "🥯", image: "", available: true },
  { id: "simit", cat: "snacks", name: "Simit", desc: "Turkish sesame ring", ingredients: "Flour, sesame, molasses", allergens: ["gluten", "sesame"], price: 25, emoji: "🥨", image: "", available: true },
  { id: "muffin", cat: "snacks", name: "Blueberry Muffin", desc: "Soft, fruity, baked daily", ingredients: "Flour, blueberries, butter", allergens: ["gluten", "lactose", "eggs"], price: 48, emoji: "🧁", image: "", available: true },
  { id: "donut", cat: "dessert", name: "Glazed Donut", desc: "Still warm if you're lucky", ingredients: "Flour, sugar glaze, butter", allergens: ["gluten", "lactose", "eggs"], price: 35, emoji: "🍩", image: IMG("donut"), available: true },
  { id: "cheesecake", cat: "dessert", name: "Cheesecake Slice", desc: "New York style", ingredients: "Cream cheese, biscuit base, cream", allergens: ["gluten", "lactose", "eggs"], price: 75, emoji: "🍰", image: IMG("cheesecake"), available: true },
  { id: "brownie", cat: "dessert", name: "Fudge Brownie", desc: "Gooey middle", ingredients: "Dark chocolate, butter, walnuts", allergens: ["gluten", "lactose", "nuts"], price: 60, emoji: "🟫", image: IMG("brownie"), available: true },
  { id: "cinnamon", cat: "dessert", name: "Cinnamon Roll", desc: "Cream cheese frosting", ingredients: "Flour, cinnamon, cream cheese", allergens: ["gluten", "lactose", "eggs"], price: 65, emoji: "🥐", image: IMG("cinnamon"), available: true },
  { id: "carrot", cat: "dessert", name: "Carrot Cake", desc: "Walnuts, warm spice", ingredients: "Carrot, walnuts, spice, cream cheese", allergens: ["gluten", "lactose", "eggs", "nuts"], price: 70, emoji: "🥕", image: IMG("carrot"), available: true },
];

const SLIDE_GRADS = [
  "linear-gradient(150deg,#3b5142,#26352b)", "linear-gradient(150deg,#6b4a2b,#3a2a18)",
  "linear-gradient(150deg,#b9526a,#7a3142)", "linear-gradient(150deg,#c5703b,#8a4a26)",
  "linear-gradient(150deg,#2F4A3A,#1d2e23)", "linear-gradient(150deg,#4a6b5a,#2f4a3a)",
];
const DEFAULT_SLIDES = [
  { id: "s1", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=70", emoji: "🪟", grad: SLIDE_GRADS[0], cap: "The corner by the window" },
  { id: "s2", img: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=70", emoji: "🌿", grad: SLIDE_GRADS[4], cap: "Plants, light, good company" },
  { id: "s3", img: "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?auto=format&fit=crop&w=900&q=70", emoji: "☕", grad: SLIDE_GRADS[1], cap: "Where mornings slow down" },
  { id: "s4", img: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=70", emoji: "🛋️", grad: SLIDE_GRADS[3], cap: "Pull up a chair, stay a while" },
  { id: "s5", img: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=900&q=70", emoji: "🪴", grad: SLIDE_GRADS[5], cap: "Your neighbourhood hearth" },
];

const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  { code: "ru", label: "Русский", flag: "🇷🇺", dir: "ltr" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
];

const THEMES = [
  { id: "hearth", label: "Hearth Classic", swatch: ["#2F4A3A","#D99A2B","#9C3B52"], shape: "rounded", vars: { bg:"#FBF6EC", paper:"#FFFDF8", ink:"#23332A", "ink-soft":"#5b6b60", pine:"#2F4A3A", "pine-2":"#3E5C49", "pine-ink":"#f3efe3", honey:"#D99A2B", "honey-2":"#E8B042", "honey-ink":"#3a2c0c", berry:"#9C3B52", "berry-soft":"#c98397", line:"#E7DAC2", "line-2":"#efe6d3", shadow:"0 1px 2px rgba(35,51,42,.05),0 8px 30px rgba(35,51,42,.07)", "shadow-lg":"0 20px 60px rgba(35,51,42,.18)", font:"'Fraunces',Georgia,serif", "bg-pattern":"none" } },
  { id: "jazal", label: "Jazal Sunrise", swatch: ["#005246","#F37721","#FFE8D1"], shape: "arch", vars: { bg:"#FFF3E1", paper:"#FFFBF3", ink:"#1F3A33", "ink-soft":"#5b7b70", pine:"#005246", "pine-2":"#0B6657", "pine-ink":"#FCEFDD", honey:"#F37721", "honey-2":"#FF8A3D", "honey-ink":"#3A1B05", berry:"#C2511B", "berry-soft":"#E59A6E", line:"#F0D9B8", "line-2":"#F8ECDA", shadow:"0 1px 2px rgba(31,58,51,.06),0 8px 30px rgba(31,58,51,.09)", "shadow-lg":"0 20px 60px rgba(31,58,51,.22)", font:"'Fraunces',Georgia,serif", "bg-pattern":"none" } },
  { id: "midnight", label: "Midnight Roast", swatch: ["#0E3D32","#E2691F","#C98A2E"], shape: "sharp", vars: { bg:"#1B1410", paper:"#241A14", ink:"#F3E7D8", "ink-soft":"#B7A593", pine:"#0E3D32", "pine-2":"#155244", "pine-ink":"#EFE6D8", honey:"#E2691F", "honey-2":"#F0823A", "honey-ink":"#1B1410", berry:"#C98A2E", "berry-soft":"#7A5A28", line:"#3A2C22", "line-2":"#2E2219", shadow:"0 1px 2px rgba(0,0,0,.3),0 8px 30px rgba(0,0,0,.4)", "shadow-lg":"0 20px 60px rgba(0,0,0,.55)", font:"'Fraunces',Georgia,serif", "bg-pattern":"none" } },
  { id: "garden", label: "Garden Terracotta", swatch: ["#5C7A63","#D97B4F","#B5697A"], shape: "rounded", vars: { bg:"#F6EFE4", paper:"#FFFBF3", ink:"#3A3026", "ink-soft":"#8A7C68", pine:"#5C7A63", "pine-2":"#6F8F76", "pine-ink":"#F6F2E9", honey:"#D97B4F", "honey-2":"#E89368", "honey-ink":"#3A1C0E", berry:"#B5697A", "berry-soft":"#D6A3AE", line:"#E8DCC8", "line-2":"#F0E8D9", shadow:"0 1px 2px rgba(58,48,38,.05),0 8px 30px rgba(58,48,38,.07)", "shadow-lg":"0 20px 60px rgba(58,48,38,.18)", font:"'Fraunces',Georgia,serif", "bg-pattern":"none" } },
  { id: "mercado", label: "Mercado Rojo", swatch: ["#B21D25","#F1E7D2","#2B2118"], shape: "sharp", vars: { bg:"#F1E7D2", paper:"#FBF6EC", ink:"#2B2118", "ink-soft":"#7a6a57", pine:"#B21D25", "pine-2":"#C73540", "pine-ink":"#FBF6EC", honey:"#D98B2B", "honey-2":"#E6A347", "honey-ink":"#2B2118", berry:"#7A1620", "berry-soft":"#C97D83", line:"#E3D2B0", "line-2":"#ECE0C5", shadow:"0 1px 2px rgba(43,33,24,.06),0 8px 30px rgba(43,33,24,.08)", "shadow-lg":"0 20px 60px rgba(43,33,24,.22)", font:"'Bitter',Georgia,serif", "bg-pattern":"repeating-linear-gradient(0deg,rgba(178,29,37,.09) 0px,rgba(178,29,37,.09) 1px,transparent 1px,transparent 26px),repeating-linear-gradient(90deg,rgba(178,29,37,.09) 0px,rgba(178,29,37,.09) 1px,transparent 1px,transparent 26px)" } },
  { id: "cobalt", label: "Cobalt Pop", swatch: ["#1B1FA8","#F4EDE2","#FF6A3D"], shape: "sharp", vars: { bg:"#EDE6D6", paper:"#F8F3E8", ink:"#14156B", "ink-soft":"#5557A0", pine:"#1B1FA8", "pine-2":"#2A2FC7", "pine-ink":"#F4EDE2", honey:"#FF6A3D", "honey-2":"#FF8657", "honey-ink":"#1A0900", berry:"#5B5FE0", "berry-soft":"#A6A8F0", line:"#DDD2B8", "line-2":"#EAE1CB", shadow:"0 1px 2px rgba(20,21,107,.06),0 8px 30px rgba(20,21,107,.09)", "shadow-lg":"0 20px 60px rgba(20,21,107,.24)", font:"'Anton',sans-serif", "bg-pattern":"none" } },
  { id: "tangerine", label: "Tangerine Pop", swatch: ["#4A2412","#E2521B","#FBF6EC"], shape: "pill", vars: { bg:"#FBF6EC", paper:"#FFFDF6", ink:"#2B2118", "ink-soft":"#8a7a63", pine:"#4A2412", "pine-2":"#5C2F18", "pine-ink":"#FBF6EC", honey:"#E2521B", "honey-2":"#EE6B3B", "honey-ink":"#2B1206", berry:"#B23A12", "berry-soft":"#E2906B", line:"#EDE0C8", "line-2":"#F5EEDC", shadow:"0 1px 2px rgba(43,33,24,.05),0 8px 30px rgba(43,33,24,.07)", "shadow-lg":"0 20px 60px rgba(43,33,24,.18)", font:"'Lilita One',cursive", "bg-pattern":"none" } },
];

const STR = {
  en: {
    tagline: "Pull up a chair — order from your seat, we'll bring it over.",
    sign_in: "Sign in", hi_name: "Hi, {name}",
    scan_reading: "Reading the table's code…", scan_found: "Table found", scan_title: "Reading your table",
    scan_blurb: "Every table's QR holds a unique code, so we know exactly where to bring your order — you never enter a table number.",
    demo_control: "Demo control", demo_blurb: "In real life the table's sticker decides this. Tap one to simulate scanning a different table:",
    table_n: "Table {n}", not_your_table: "not your table?",
    bill_open: "Bill open", all_settled: "All settled", on_your_table: "{amt} on your table", nothing_owing: "Thanks — nothing owing",
    unpaid: "Unpaid", paid: "Paid",
    reward_ready_t: "Your reward is ready!", reward_ready_b: "A free filter coffee or donut is waiting in your basket.",
    bean_club: "Bean Club", stamps_progress: "{n}/{max} stamps — 5 earns a free filter coffee or donut",
    signin_to_collect: "Sign in to collect a stamp with every order", join_free: "Join the Bean Club — it's free",
    view_menu: "View the menu", in_basket: "{n} in basket", whats_on: "What's on today",
    congrats_t: "You earned a free donut!", congrats_b: "5 stamps complete. Here's your reward — it's saved to your account.",
    free_donut: "Free Donut", coupon_sub: "Bean Club reward", copy: "Copy", copied: "Copied",
    coupon_how: "Show this code at the counter, or tap \"use reward\" in your basket next time.",
    see_my_coupons: "See my coupons", keep_ordering: "Keep ordering",
    my_coupons: "My coupons", coupon_used_on: "Used on {d}", active: "Active", used: "Used",
    coupons_ready_n: "{n} free donuts waiting", coupon_ready_1: "A free donut is waiting",
    coupon_tap_view: "Tap to see your coupon code",
    redeem_coupon: "Redeem a coupon", redeem_ph: "Enter coupon code", redeem_btn: "Check & redeem",
    redeem_ok: "Valid! Donut redeemed ✓", redeem_used: "This coupon was already used", redeem_bad: "No such coupon code",
    menu: "Menu", sold_out: "Sold out", view_basket: "View basket", items: "items", item: "item",
    your_basket: "Your basket", empty_basket_t: "Nothing here yet", empty_basket_b: "Add something tasty from the menu.",
    browse_menu: "Browse the menu", delivering_to: "Delivering to Table {n}",
    note_for_item: "Note for {name} — e.g. oat milk, no sugar", order_note_label: "Note for the whole order",
    order_note_ph: "Anything else? Allergies, timing, a birthday candle…",
    use_reward: "Use your free reward", reward_applied: "Reward applied",
    reward_free_item: "{name} is on us", reward_add_item: "Add a filter coffee or donut to redeem",
    subtotal: "Subtotal", club_reward: "Bean Club reward", total: "Total",
    guest_1: "Ordering as a guest.", guest_2: "to earn a stamp on this order.", send_order: "Send order to kitchen",
    quick_order: "Order now", review_basket: "Review basket",
    pay_title: "Pay the bill", pay_full_cta: "Pay the full bill", or_split: "or split it",
    choose_split: "How would you like to pay?", split_whole: "Pay the whole table",
    split_whole_d: "Settle everything that's owed on this table", split_mine: "Pay only my orders",
    split_mine_d: "Just the items you ordered", split_even: "Split evenly",
    split_even_d: "Divide the table bill into equal shares", split_custom: "Enter an amount",
    split_custom_d: "Type exactly how much you'd like to pay", split_items: "Pick items to pay",
    split_items_d: "Choose exactly what you're paying for", pick_items_t: "What are you paying for?",
    pick_items_b: "Tap the items you'd like to cover", selected_total: "Selected total",
    nothing_selected: "Select at least one item", pay_selected: "Pay for selected",
    how_many_people: "How many people?", per_person: "{amt} per person", your_share: "Your share",
    enter_amount: "Amount to pay", of_remaining: "of {amt} remaining",
    add_tip: "Add a tip", tip_none: "No tip", tip_custom: "Custom",
    subtotal_label: "Subtotal", tip_label: "Tip", to_pay: "To pay", continue_btn: "Continue",
    pay_now: "Pay {amt}", confirm_payment: "Confirm payment", payment_sent: "Payment recorded",
    payment_sent_d: "Your payment of {amt} has been sent to staff for Table {n}.",
    pay_at_register_note: "Online payment is coming soon. For now this notifies staff of your amount — settle at the counter or with your server.",
    back_to_options: "← Back to options", nothing_to_pay: "Nothing left to pay on this table.",
    paying_amount: "You're paying", remaining_after: "Remaining after this: {amt}",
    order_sent: "Order sent!", getting_ready: "We're getting it ready for Table {n}.", order_id: "Order {id}",
    step_received: "Received", step_preparing: "Preparing", step_served: "Served",
    status_updates: "Status updates here as the kitchen works. (Switch to Café Admin below to move it along.)",
    reward_unlocked: "Reward unlocked! 🎁", stamp_earned: "+1 stamp earned ⭐", view_account: "View my account",
    missed_stamp_t: "Missed a stamp", missed_stamp_b: "Members get a free filter coffee or donut every 5 orders.",
    join_club: "Join the Bean Club", order_more: "Order something else", view_bill: "View my table bill",
    join_banner: "A stamp with every order. Five stamps = a free filter coffee or donut.",
    your_name: "Your name", email: "Email",
    email_consent: "We'll only email you about rewards and the occasional treat. No spam.",
    create_account: "Create my account", already_member: "Already a member? Just enter your email above.",
    account: "Account", not_signed_in: "Not signed in", join_to_track: "Join to track orders and collect rewards.",
    orders_count: "{n} orders", order_history: "Order history",
    no_orders_hist: "No orders yet — your past orders will live here.",
    reorder: "Reorder", sign_out: "Sign out",
    reward_ready_short: "🎁 A free filter coffee or donut is ready — redeem it in your basket.",
    more_until: "{n} more order(s) until your free treat.",
    bill_title: "Table {n} bill", no_orders_yet: "No orders yet", bill_builds: "Your bill builds up as you order.",
    reward_word: "Reward", order_total: "Order total", total_ordered: "Total ordered", already_paid: "Already paid",
    amount_due: "Amount due", settled: "Settled", pay_at_counter: "Pay at the counter or with your server",
    ask_bill: "Ask for the bill", server_notified: "Server notified",
    someone_over: "Someone will be over shortly to settle Table {n}.",
    ask_bill_hint: "Tapping this lets staff know you're ready to pay. They'll mark the table paid once you've settled up.",
    all_settled_thanks: "All settled — thank you!",
    t_added: "{name} added", t_signed_in: "Signed in — you'll earn stamps now", t_to_basket: "Added to your basket",
    t_unavailable: "Those items aren't available right now",
    t_server_notified: "Your server has been notified — bill coming to Table {n}",
    t_table_paid: "Table {n} marked paid", t_table_reopened: "Table {n} bill reopened",
    t_order_status: "Order {id} → {status}", t_item_removed: "Item removed", t_changes_saved: "Changes saved",
    t_photo_removed: "Photo removed", t_photo_added: "Photo added", t_photo_updated: "Photo updated",
    t_reset: "Demo data, menu & gallery reset", t_promo_queued: "Promo queued to {n} customer(s) (demo)",
    t_order_error: "Error — please try again",
    nav_orders: "Orders", nav_tables: "Tables", nav_menu: "Menu", nav_gallery: "Gallery",
    nav_brand: "Brand", nav_stats: "Statistics", nav_customers: "Customers",
    brand_title: "Brand & theme", brand_sub: "Pick a look for your café — colors and shapes update everywhere instantly.",
    theme_applied: "{name} theme applied", current_theme: "Current",
    currency_label: "Currency", allergens_label: "Allergens",
    staff_login_title: "Staff login", staff_login_sub: "This area is for café staff only.",
    staff_password: "Password", staff_signin: "Sign in", staff_wrong: "Wrong email or password",
    staff_signout: "Sign out", staff_back_customer: "← Back to customer view",
    staff_counter: "Staff · Counter", reset_demo: "Reset demo", new_order_in: "New order just came in!",
    sound_on: "Sound on", auto_settled: "Settled automatically", sound_off: "Sound off",
    live_orders: "Live orders", live_orders_sub: "Tickets arrive the moment a guest sends them. Tap to move an order along.",
    n_new: "{n} new", f_active: "Active", f_new: "New", f_preparing: "Preparing", f_served: "Served", f_all: "All",
    no_orders_admin_t: "No orders here yet",
    no_orders_admin_b: "Switch to the Customer view below, place an order, and it lands here instantly.",
    guest: "Guest", reward_tag: "reward", mark_paid: "Mark paid", mark_unpaid: "Mark unpaid",
    start_preparing: "Start preparing", mark_served: "Mark as served", reopen: "Reopen", served_btn: "Served",
    tables: "Tables", tables_sub: "Each occupied table and its bill. Owing tables come first.",
    tables_sub2: "See which tables have paid and which still owe.",
    no_tables_t: "No active tables",
    no_tables_b: "Once guests order, each occupied table shows up here with its running bill.",
    n_owing: "{n} owing · {total}", all_tables_settled: "All tables settled", owing: "Owing",
    bill_requested_alert: "🔔 Bill requested — guest is ready to pay",
    orders_word: "orders", order_word: "order", in_kitchen: "in kitchen",
    paid_in_full: "{total} paid in full", of_total: "of {total} total",
    reopen_bill: "Reopen bill", mark_paid_due: "Mark paid · {due}",
    menu_admin_sub: "Add items, set prices and ingredients, upload photos, or mark something sold out. Changes show to guests instantly.",
    add_item: "Add item", items_count: "{n} item(s)", empty_cat: "Nothing in this category yet.",
    add_item_title: "Add item", edit_item_title: "Edit item", menu_editor_sub: "What guests see on the menu.",
    upload_photo: "Upload photo", remove_photo: "Remove photo", paste_url: "Or paste an image URL",
    name: "Name", category: "Category", price: "Price", emoji: "Emoji", short_desc: "Short description",
    ingredients: "Ingredients", available_order: "Available to order", marked_sold_out: "Marked sold out",
    add_to_menu: "Add to menu", cancel: "Cancel", save_changes: "Save changes",
    gallery: "Gallery", gallery_sub: "The swiping photos guests see when they land. Reorder them, swap pictures, or change the captions.",
    add_photo: "Add photo", no_photos_t: "No photos yet",
    no_photos_b: "Add a few shots of your space and best plates — they're the first thing guests see.",
    no_caption: "No caption", uploaded_photo: "Uploaded photo", gradient_fallback: "Gradient + emoji fallback",
    add_photo_title: "Add photo", edit_photo_title: "Edit photo",
    gallery_editor_sub: "Shows full-width at the top of the guest home page.",
    caption: "Caption", fallback_colour: "Fallback colour",
    fallback_hint: "The emoji and colour show only if a photo fails to load — a graceful backup.",
    statistics: "Statistics", stats_sub: "A read on the day so far.", stats_sub2: "Numbers fill in as orders come through.",
    no_data_t: "No data yet", no_data_b: "Place a few orders from the customer view to see your stats come alive.",
    revenue: "Revenue", outstanding: "Outstanding", orders_stat: "Orders", avg_order: "Avg. order", members: "Members",
    tips_collected: "Tips", repeat_guests: "Repeat guests", peak_hour: "Peak hour",
    best_sellers: "Best sellers", busiest_tables: "Busiest tables", orders_by_hour: "Orders by hour",
    customers: "Customers", customers_sub: "Your Bean Club members and their history.",
    customers_sub2: "Members who sign up while ordering show up here.",
    no_members_t: "No members yet",
    no_members_b: "When a guest joins the Bean Club from the customer view, you'll see them — with their email — right here.",
    email_all: "Email all members", col_name: "Name", col_email: "Email", col_orders: "Orders",
    col_stamps: "Stamps", col_spent: "Spent", col_joined: "Joined",
    email_btn: "Email", compose_promo: "Compose promo", to_label: "To:", all_members_n: "All members ({n})",
    subject: "Subject", message: "Message", send_promo: "Send promo",
    promo_demo_note: "Demo only — no real emails are sent. Connect an email provider to go live.",
    cat_hot: "Hot Coffees", cat_hot_b: "Pulled this morning, poured all day",
    cat_cold: "Cold Coffees", cat_cold_b: "Over ice, never bitter",
    cat_shots: "Espresso Shots", cat_shots_b: "Small, serious, fast",
    cat_fruit: "Fresh Fruit Drinks", cat_fruit_b: "Pressed to order",
    cat_shakes: "Shakes", cat_shakes_b: "Thick, cold, generous",
    cat_softdrinks: "Soft Drinks", cat_softdrinks_b: "Cold and refreshing",
    cat_snacks: "Snacks", cat_snacks_b: "Light bites, freshly made",
    cat_dessert: "Desserts", cat_dessert_b: "Baked in-house daily",
    ago_s: "{n}s ago", ago_m: "{n}m ago", ago_h: "{n}h ago",
    pill_new: "New", pill_preparing: "Preparing", pill_served: "Served",
  },
  tr: {
    tagline: "Bir sandalye çek — yerinden sipariş ver, biz getirelim.",
    sign_in: "Giriş yap", hi_name: "Merhaba, {name}",
    scan_reading: "Masanın kodu okunuyor…", scan_found: "Masa bulundu", scan_title: "Masan okunuyor",
    scan_blurb: "Her masanın QR'ı benzersizdir; siparişini nereye getireceğimizi tam olarak biliriz — masa numarası girmene gerek yok.",
    demo_control: "Demo kontrolü", demo_blurb: "Gerçekte masadaki etiket bunu belirler. Farklı bir masayı taramayı denemek için dokun:",
    table_n: "Masa {n}", not_your_table: "masan bu değil mi?",
    bill_open: "Hesap açık", all_settled: "Hepsi ödendi", on_your_table: "Masanda {amt}", nothing_owing: "Teşekkürler — borç yok",
    unpaid: "Ödenmedi", paid: "Ödendi",
    reward_ready_t: "Ödülün hazır!", reward_ready_b: "Ücretsiz filtre kahve veya donut sepetinde seni bekliyor.",
    bean_club: "Bean Club", stamps_progress: "{n}/{max} damga — 5 damga ücretsiz filtre kahve veya donut kazandırır",
    signin_to_collect: "Her siparişte damga kazanmak için giriş yap", join_free: "Bean Club'a katıl — ücretsiz",
    view_menu: "Menüyü gör", in_basket: "sepette {n}", whats_on: "Bugün neler var",
    congrats_t: "Bedava donut kazandın!", congrats_b: "5 damga tamamlandı. İşte ödülün — hesabına kaydedildi.",
    free_donut: "Bedava Donut", coupon_sub: "Bean Club ödülü", copy: "Kopyala", copied: "Kopyalandı",
    coupon_how: "Bu kodu kasada göster ya da bir dahaki sepetinde \"ödülü kullan\"a dokun.",
    see_my_coupons: "Kuponlarımı gör", keep_ordering: "Siparişe devam",
    my_coupons: "Kuponlarım", coupon_used_on: "{d} tarihinde kullanıldı", active: "Geçerli", used: "Kullanıldı",
    coupons_ready_n: "{n} bedava donut bekliyor", coupon_ready_1: "Bir bedava donut bekliyor",
    coupon_tap_view: "Kupon kodunu görmek için dokun",
    redeem_coupon: "Kupon kullan", redeem_ph: "Kupon kodunu gir", redeem_btn: "Kontrol et & kullan",
    redeem_ok: "Geçerli! Donut verildi ✓", redeem_used: "Bu kupon zaten kullanılmış", redeem_bad: "Böyle bir kupon kodu yok",
    menu: "Menü", sold_out: "Tükendi", view_basket: "Sepeti gör", items: "ürün", item: "ürün",
    your_basket: "Sepetin", empty_basket_t: "Henüz boş", empty_basket_b: "Menüden lezzetli bir şey ekle.",
    browse_menu: "Menüye göz at", delivering_to: "Masa {n}'e getirilecek",
    note_for_item: "{name} için not — ör. yulaf sütü, şekersiz", order_note_label: "Tüm sipariş için not",
    order_note_ph: "Başka bir şey? Alerjiler, zamanlama, doğum günü mumu…",
    use_reward: "Ücretsiz ödülünü kullan", reward_applied: "Ödül uygulandı",
    reward_free_item: "{name} bizden", reward_add_item: "Kullanmak için filtre kahve veya donut ekle",
    subtotal: "Ara toplam", club_reward: "Bean Club ödülü", total: "Toplam",
    guest_1: "Misafir olarak sipariş veriyorsun.", guest_2: "bu siparişte damga kazanmak için.", send_order: "Siparişi mutfağa gönder",
    quick_order: "Hemen sipariş ver", review_basket: "Sepeti gözden geçir",
    pay_title: "Hesabı öde", pay_full_cta: "Tüm hesabı öde", or_split: "ya da böl",
    choose_split: "Nasıl ödemek istersin?", split_whole: "Masanın tamamını öde",
    split_whole_d: "Bu masada borçlu olan her şeyi kapat", split_mine: "Sadece kendi siparişlerimi öde",
    split_mine_d: "Yalnızca senin sipariş ettiklerin", split_even: "Eşit böl (Alman usulü)",
    split_even_d: "Masa hesabını eşit paylara böl", split_custom: "Tutar gir",
    split_custom_d: "Tam olarak ne kadar ödeyeceğini yaz", split_items: "Ürün seçerek öde",
    split_items_d: "Tam olarak neyin parasını ödediğini seç", pick_items_t: "Neyin parasını ödüyorsun?",
    pick_items_b: "Ödemek istediğin ürünlere dokun", selected_total: "Seçilen toplam",
    nothing_selected: "En az bir ürün seç", pay_selected: "Seçilenleri öde",
    how_many_people: "Kaç kişi?", per_person: "Kişi başı {amt}", your_share: "Senin payın",
    enter_amount: "Ödenecek tutar", of_remaining: "/ kalan {amt}",
    add_tip: "Bahşiş ekle", tip_none: "Bahşiş yok", tip_custom: "Özel",
    subtotal_label: "Ara toplam", tip_label: "Bahşiş", to_pay: "Ödenecek", continue_btn: "Devam et",
    pay_now: "{amt} öde", confirm_payment: "Ödemeyi onayla", payment_sent: "Ödeme kaydedildi",
    payment_sent_d: "{amt} tutarındaki ödemen Masa {n} için personele iletildi.",
    pay_at_register_note: "Online ödeme yakında geliyor. Şimdilik bu, tutarını personele bildirir — kasada veya garsonla öde.",
    back_to_options: "← Seçeneklere dön", nothing_to_pay: "Bu masada ödenecek bir şey kalmadı.",
    paying_amount: "Ödüyorsun", remaining_after: "Bundan sonra kalan: {amt}",
    order_sent: "Sipariş gönderildi!", getting_ready: "Masa {n} için hazırlıyoruz.", order_id: "Sipariş {id}",
    step_received: "Alındı", step_preparing: "Hazırlanıyor", step_served: "Servis edildi",
    status_updates: "Durum mutfak çalıştıkça burada güncellenir.",
    reward_unlocked: "Ödül açıldı! 🎁", stamp_earned: "+1 damga kazanıldı ⭐", view_account: "Hesabımı gör",
    missed_stamp_t: "Damga kaçtı", missed_stamp_b: "Üyeler her 5 siparişte ücretsiz filtre kahve veya donut alır.",
    join_club: "Bean Club'a katıl", order_more: "Başka bir şey sipariş et", view_bill: "Masa hesabımı gör",
    join_banner: "Her siparişte bir damga. Beş damga = ücretsiz filtre kahve veya donut.",
    your_name: "Adın", email: "E-posta",
    email_consent: "Sadece ödüller ve ara sıra ikramlar için e-posta atarız. Spam yok.",
    create_account: "Hesabımı oluştur", already_member: "Zaten üye misin? Yukarıya e-postanı gir.",
    account: "Hesap", not_signed_in: "Giriş yapılmadı", join_to_track: "Siparişleri takip etmek ve ödül toplamak için katıl.",
    orders_count: "{n} sipariş", order_history: "Sipariş geçmişi",
    no_orders_hist: "Henüz sipariş yok — geçmiş siparişlerin burada görünecek.",
    reorder: "Tekrar sipariş et", sign_out: "Çıkış yap",
    reward_ready_short: "🎁 Ücretsiz filtre kahve veya donut hazır — sepetinde kullan.",
    more_until: "Ücretsiz ikramına {n} sipariş kaldı.",
    bill_title: "Masa {n} hesabı", no_orders_yet: "Henüz sipariş yok", bill_builds: "Sipariş verdikçe hesabın oluşur.",
    reward_word: "Ödül", order_total: "Sipariş toplamı", total_ordered: "Toplam sipariş", already_paid: "Ödenen",
    amount_due: "Ödenecek tutar", settled: "Ödendi", pay_at_counter: "Kasada veya garsonla öde",
    ask_bill: "Hesabı iste", server_notified: "Garson bilgilendirildi",
    someone_over: "Masa {n} için birazdan birisi gelecek.",
    ask_bill_hint: "Buna dokunmak personele ödemeye hazır olduğunu bildirir.",
    all_settled_thanks: "Hepsi ödendi — teşekkürler!",
    t_added: "{name} eklendi", t_signed_in: "Giriş yapıldı — artık damga kazanacaksın", t_to_basket: "Sepete eklendi",
    t_unavailable: "Bu ürünler şu an mevcut değil",
    t_server_notified: "Garson bilgilendirildi — hesap Masa {n}'e geliyor",
    t_table_paid: "Masa {n} ödendi olarak işaretlendi", t_table_reopened: "Masa {n} hesabı yeniden açıldı",
    t_order_status: "Sipariş {id} → {status}", t_item_removed: "Ürün kaldırıldı",
    t_changes_saved: "Değişiklikler kaydedildi", t_photo_removed: "Fotoğraf kaldırıldı",
    t_photo_added: "Fotoğraf eklendi", t_photo_updated: "Fotoğraf güncellendi",
    t_reset: "Demo verisi, menü ve galeri sıfırlandı", t_promo_queued: "Promosyon {n} müşteriye sıraya alındı (demo)",
    t_order_error: "Hata — tekrar deneyin",
    nav_orders: "Siparişler", nav_tables: "Masalar", nav_menu: "Menü", nav_gallery: "Galeri",
    nav_brand: "Marka", nav_stats: "İstatistik", nav_customers: "Müşteriler",
    brand_title: "Marka ve tema", brand_sub: "Kafen için bir görünüm seç — renkler ve şekiller her yerde anında güncellenir.",
    theme_applied: "{name} teması uygulandı", current_theme: "Geçerli",
    currency_label: "Para Birimi", allergens_label: "Alerjenler",
    staff_login_title: "Personel girişi", staff_login_sub: "Bu alan yalnızca kafe personeli içindir.",
    staff_password: "Şifre", staff_signin: "Giriş yap", staff_wrong: "Hatalı e-posta veya şifre",
    staff_signout: "Çıkış yap", staff_back_customer: "← Müşteri görünümüne dön",
    staff_counter: "Personel · Kasa", reset_demo: "Demoyu sıfırla", new_order_in: "Yeni sipariş geldi!",
    sound_on: "Ses açık", auto_settled: "Otomatik kapandı", sound_off: "Ses kapalı",
    live_orders: "Canlı siparişler", live_orders_sub: "Misafir gönderir göndermez fişler buraya düşer.",
    n_new: "{n} yeni", f_active: "Aktif", f_new: "Yeni", f_preparing: "Hazırlanıyor", f_served: "Servis edildi", f_all: "Tümü",
    no_orders_admin_t: "Henüz sipariş yok", no_orders_admin_b: "Aşağıdan Müşteri görünümüne geç, sipariş ver ve anında burada belirsin.",
    guest: "Misafir", reward_tag: "ödül", mark_paid: "Ödendi işaretle", mark_unpaid: "Ödenmedi işaretle",
    start_preparing: "Hazırlamaya başla", mark_served: "Servis edildi işaretle", reopen: "Yeniden aç", served_btn: "Servis edildi",
    tables: "Masalar", tables_sub: "Her dolu masa ve hesabı. Borçlu masalar önce gelir.",
    tables_sub2: "Hangi masaların ödediğini, hangilerinin borçlu olduğunu gör.",
    no_tables_t: "Aktif masa yok", no_tables_b: "Misafirler sipariş verince her dolu masa hesabıyla burada görünür.",
    n_owing: "{n} borçlu · {total}", all_tables_settled: "Tüm masalar ödendi", owing: "Borçlu",
    bill_requested_alert: "🔔 Hesap istendi — misafir ödemeye hazır",
    orders_word: "sipariş", order_word: "sipariş", in_kitchen: "mutfakta",
    paid_in_full: "{total} tamamen ödendi", of_total: "/ {total} toplam",
    reopen_bill: "Hesabı yeniden aç", mark_paid_due: "Ödendi işaretle · {due}",
    menu_admin_sub: "Ürün ekle, fiyat ve içerik belirle, fotoğraf yükle veya tükendi işaretle.",
    add_item: "Ürün ekle", items_count: "{n} ürün", empty_cat: "Bu kategoride henüz bir şey yok.",
    add_item_title: "Ürün ekle", edit_item_title: "Ürünü düzenle", menu_editor_sub: "Misafirlerin menüde gördüğü.",
    upload_photo: "Fotoğraf yükle", remove_photo: "Fotoğrafı kaldır", paste_url: "Ya da bir görsel bağlantısı yapıştır",
    name: "Ad", category: "Kategori", price: "Fiyat", emoji: "Emoji", short_desc: "Kısa açıklama",
    ingredients: "İçindekiler", available_order: "Siparişe açık", marked_sold_out: "Tükendi olarak işaretli",
    add_to_menu: "Menüye ekle", cancel: "İptal", save_changes: "Değişiklikleri kaydet",
    gallery: "Galeri", gallery_sub: "Misafirlerin girişte gördüğü kayan fotoğraflar.",
    add_photo: "Fotoğraf ekle", no_photos_t: "Henüz fotoğraf yok",
    no_photos_b: "Mekanından ve en güzel tabaklarından birkaç kare ekle.",
    no_caption: "Alt yazı yok", uploaded_photo: "Yüklenen fotoğraf", gradient_fallback: "Degrade + emoji yedeği",
    add_photo_title: "Fotoğraf ekle", edit_photo_title: "Fotoğrafı düzenle",
    gallery_editor_sub: "Misafir ana sayfasının en üstünde tam genişlikte görünür.",
    caption: "Alt yazı", fallback_colour: "Yedek renk", fallback_hint: "Emoji ve renk yalnızca fotoğraf yüklenmezse görünür.",
    statistics: "İstatistik", stats_sub: "Günün şu ana kadarki özeti.", stats_sub2: "Siparişler geldikçe sayılar dolar.",
    no_data_t: "Henüz veri yok", no_data_b: "İstatistiklerin canlanması için müşteri görünümünden birkaç sipariş ver.",
    revenue: "Ciro", outstanding: "Bekleyen", orders_stat: "Sipariş", avg_order: "Ort. sipariş", members: "Üyeler",
    tips_collected: "Bahşiş", repeat_guests: "Tekrar gelen", peak_hour: "Yoğun saat",
    best_sellers: "En çok satanlar", busiest_tables: "En yoğun masalar", orders_by_hour: "Saate göre siparişler",
    customers: "Müşteriler", customers_sub: "Bean Club üyelerin ve geçmişleri.",
    customers_sub2: "Sipariş verirken kaydolan üyeler burada görünür.",
    no_members_t: "Henüz üye yok", no_members_b: "Bir misafir Bean Club'a katılınca onları burada görürsün.",
    email_all: "Tüm üyelere e-posta", col_name: "Ad", col_email: "E-posta", col_orders: "Sipariş",
    col_stamps: "Damga", col_spent: "Harcama", col_joined: "Katıldı",
    email_btn: "E-posta", compose_promo: "Promosyon yaz", to_label: "Kime:", all_members_n: "Tüm üyeler ({n})",
    subject: "Konu", message: "Mesaj", send_promo: "Promosyonu gönder",
    promo_demo_note: "Sadece demo — gerçek e-posta gönderilmez.",
    cat_hot: "Sıcak Kahveler", cat_hot_b: "Sabah demlendi, gün boyu servis",
    cat_cold: "Soğuk Kahveler", cat_cold_b: "Buzlu, asla acı değil",
    cat_shots: "Espresso Shotları", cat_shots_b: "Küçük, ciddi, hızlı",
    cat_fruit: "Taze Meyve İçecekleri", cat_fruit_b: "Siparişe göre sıkılır",
    cat_shakes: "Milkshake", cat_shakes_b: "Koyu, soğuk, bol",
    cat_softdrinks: "Soğuk İçecekler", cat_softdrinks_b: "Soğuk ve ferahlatıcı",
    cat_snacks: "Atıştırmalıklar", cat_snacks_b: "Hafif lezzetler, taze",
    cat_dessert: "Tatlılar", cat_dessert_b: "Her gün yerinde pişer",
    ago_s: "{n}sn önce", ago_m: "{n}dk önce", ago_h: "{n}sa önce",
    pill_new: "Yeni", pill_preparing: "Hazırlanıyor", pill_served: "Servis",
  },
  ru: {
    tagline: "Присаживайтесь — заказывайте со своего места, мы принесём.",
    sign_in: "Войти", hi_name: "Привет, {name}", table_n: "Стол {n}", not_your_table: "не ваш стол?",
    bill_open: "Счёт открыт", all_settled: "Всё оплачено", on_your_table: "{amt} на вашем столе", nothing_owing: "Спасибо — задолженности нет",
    unpaid: "Не оплачено", paid: "Оплачено", bean_club: "Bean Club",
    stamps_progress: "{n}/{max} штампов — 5 дают бесплатный кофе или пончик",
    signin_to_collect: "Войдите, чтобы получать штамп за каждый заказ", join_free: "Вступить в Bean Club — бесплатно",
    view_menu: "Открыть меню", in_basket: "{n} в корзине", whats_on: "Что сегодня",
    congrats_t: "Вы получили бесплатный пончик!", congrats_b: "5 штампов собрано. Вот ваша награда.",
    free_donut: "Бесплатный пончик", coupon_sub: "Награда Bean Club", copy: "Копировать", copied: "Скопировано",
    coupon_how: "Покажите код на кассе.", see_my_coupons: "Мои купоны", keep_ordering: "Продолжить заказ",
    my_coupons: "Мои купоны", coupon_used_on: "Использован {d}", active: "Активен", used: "Использован",
    coupons_ready_n: "{n} бесплатных пончиков ждут", coupon_ready_1: "Бесплатный пончик ждёт",
    coupon_tap_view: "Нажмите для кода",
    redeem_coupon: "Использовать купон", redeem_ph: "Введите код", redeem_btn: "Проверить",
    redeem_ok: "Верно! ✓", redeem_used: "Уже использован", redeem_bad: "Нет такого купона",
    menu: "Меню", sold_out: "Закончилось", view_basket: "Корзина", items: "поз.", item: "поз.",
    your_basket: "Ваша корзина", empty_basket_t: "Пока пусто", empty_basket_b: "Добавьте что-нибудь вкусное.",
    browse_menu: "Открыть меню", delivering_to: "Доставим на стол {n}",
    note_for_item: "Заметка к «{name}»", order_note_label: "Заметка ко всему заказу",
    order_note_ph: "Что-то ещё? Аллергии, пожелания…",
    use_reward: "Использовать награду", reward_applied: "Награда применена",
    reward_free_item: "{name} за наш счёт", reward_add_item: "Добавьте кофе или пончик",
    subtotal: "Подытог", club_reward: "Награда Bean Club", total: "Итого",
    guest_1: "Заказ как гость.", guest_2: "чтобы получить штамп.", send_order: "Отправить на кухню",
    quick_order: "Заказать сейчас", review_basket: "Проверить корзину",
    pay_title: "Оплата", pay_full_cta: "Оплатить весь счёт", or_split: "или разделить",
    choose_split: "Как хотите оплатить?", split_whole: "Оплатить весь стол",
    split_whole_d: "Погасить всё по столу", split_mine: "Только мои заказы",
    split_mine_d: "Только то, что вы заказали", split_even: "Разделить поровну",
    split_even_d: "Поделить счёт на равные части", split_custom: "Ввести сумму",
    split_custom_d: "Укажите, сколько хотите оплатить", split_items: "Выбрать блюда",
    split_items_d: "Выберите, за что платите", pick_items_t: "За что вы платите?",
    pick_items_b: "Нажмите на блюда", selected_total: "Сумма выбранного",
    nothing_selected: "Выберите хотя бы одно", pay_selected: "Оплатить выбранное",
    how_many_people: "Сколько человек?", per_person: "{amt} с человека", your_share: "Ваша доля",
    enter_amount: "Сумма", of_remaining: "из {amt}",
    add_tip: "Добавить чаевые", tip_none: "Без чаевых", tip_custom: "Своя сумма",
    subtotal_label: "Подытог", tip_label: "Чаевые", to_pay: "К оплате", continue_btn: "Продолжить",
    pay_now: "Оплатить {amt}", confirm_payment: "Подтвердить", payment_sent: "Платёж записан",
    payment_sent_d: "Ваш платёж {amt} отправлен персоналу стола {n}.",
    pay_at_register_note: "Рассчитайтесь на кассе или у официанта.",
    back_to_options: "← Назад", nothing_to_pay: "По этому столу платить нечего.",
    paying_amount: "Вы оплачиваете", remaining_after: "Останется: {amt}",
    order_sent: "Заказ отправлен!", getting_ready: "Готовим для стола {n}.", order_id: "Заказ {id}",
    step_received: "Принят", step_preparing: "Готовится", step_served: "Подан",
    status_updates: "Статус обновляется по ходу работы кухни.",
    reward_unlocked: "Награда открыта! 🎁", stamp_earned: "+1 штамп ⭐", view_account: "Мой аккаунт",
    missed_stamp_t: "Штамп упущен", missed_stamp_b: "Участники получают бесплатное угощение каждые 5 заказов.",
    join_club: "Вступить в Bean Club", order_more: "Заказать ещё", view_bill: "Счёт стола",
    join_banner: "Штамп за каждый заказ. Пять штампов = бесплатный кофе или пончик.",
    your_name: "Ваше имя", email: "Эл. почта", email_consent: "Пишем только о наградах. Без спама.",
    create_account: "Создать аккаунт", already_member: "Уже участник? Введите почту выше.",
    account: "Аккаунт", not_signed_in: "Вы не вошли", join_to_track: "Войдите, чтобы отслеживать заказы.",
    orders_count: "{n} заказов", order_history: "История заказов", no_orders_hist: "Заказов пока нет.",
    reorder: "Повторить", sign_out: "Выйти",
    reward_ready_short: "🎁 Бесплатный кофе или пончик готов.",
    more_until: "Ещё {n} заказ(ов) до угощения.",
    bill_title: "Счёт стола {n}", no_orders_yet: "Заказов пока нет", bill_builds: "Счёт растёт с заказами.",
    reward_word: "Награда", order_total: "Сумма заказа", total_ordered: "Всего", already_paid: "Оплачено",
    amount_due: "К оплате", settled: "Оплачено", pay_at_counter: "Оплата на кассе или у официанта",
    ask_bill: "Попросить счёт", server_notified: "Официант уведомлён", someone_over: "К столу {n} скоро подойдут.",
    ask_bill_hint: "Персонал узнает, что вы готовы платить.", all_settled_thanks: "Всё оплачено — спасибо!",
    t_added: "{name} добавлено", t_signed_in: "Вы вошли", t_to_basket: "Добавлено в корзину",
    t_unavailable: "Этих позиций сейчас нет", t_server_notified: "Официант уведомлён — стол {n}",
    t_table_paid: "Стол {n} оплачен", t_table_reopened: "Счёт стола {n} открыт", t_order_status: "Заказ {id} → {status}",
    t_item_removed: "Удалено", t_changes_saved: "Сохранено", t_photo_removed: "Фото удалено",
    t_photo_added: "Фото добавлено", t_photo_updated: "Фото обновлено", t_reset: "Сброс демо",
    t_promo_queued: "Промо для {n} клиент(ов)", t_order_error: "Ошибка — попробуйте снова",
    nav_orders: "Заказы", nav_tables: "Столы", nav_menu: "Меню", nav_gallery: "Галерея",
    nav_brand: "Бренд", nav_stats: "Статистика", nav_customers: "Клиенты",
    brand_title: "Бренд и тема", brand_sub: "Выберите стиль.", theme_applied: "Тема «{name}» применена", current_theme: "Текущая",
    currency_label: "Валюта", allergens_label: "Аллергены",
    staff_login_title: "Вход для персонала", staff_login_sub: "Только для сотрудников.",
    staff_password: "Пароль", staff_signin: "Войти", staff_wrong: "Неверная почта или пароль",
    staff_signout: "Выйти", staff_back_customer: "← К виду клиента",
    staff_counter: "Персонал · Касса", reset_demo: "Сбросить демо", new_order_in: "Поступил новый заказ!",
    sound_on: "Звук вкл.", auto_settled: "Закрыто", sound_off: "Звук выкл.",
    live_orders: "Текущие заказы", live_orders_sub: "Чеки появляются сразу.",
    n_new: "{n} новых", f_active: "Активные", f_new: "Новые", f_preparing: "Готовятся", f_served: "Поданы", f_all: "Все",
    no_orders_admin_t: "Заказов пока нет", no_orders_admin_b: "Оформите заказ из вида клиента.",
    guest: "Гость", reward_tag: "награда", mark_paid: "Отметить оплаченным", mark_unpaid: "Отметить неоплаченным",
    start_preparing: "Начать готовить", mark_served: "Отметить поданным", reopen: "Открыть снова", served_btn: "Подан",
    tables: "Столы", tables_sub: "Занятые столы и их счета.", tables_sub2: "Статус оплаты по столам.",
    no_tables_t: "Нет активных столов", no_tables_b: "Столы появятся после первого заказа.",
    n_owing: "{n} с долгом · {total}", all_tables_settled: "Все столы оплачены", owing: "Долг",
    bill_requested_alert: "🔔 Запрошен счёт", orders_word: "заказов", order_word: "заказ", in_kitchen: "на кухне",
    paid_in_full: "{total} оплачено", of_total: "из {total}", reopen_bill: "Открыть счёт", mark_paid_due: "Оплачено · {due}",
    menu_admin_sub: "Управление меню.", add_item: "Добавить", items_count: "{n} поз.", empty_cat: "Пусто.",
    add_item_title: "Добавить позицию", edit_item_title: "Изменить", menu_editor_sub: "Меню для гостей.",
    upload_photo: "Загрузить фото", remove_photo: "Удалить фото", paste_url: "Или вставьте ссылку",
    name: "Название", category: "Категория", price: "Цена", emoji: "Эмодзи", short_desc: "Описание",
    ingredients: "Состав", available_order: "Доступно", marked_sold_out: "Закончилось",
    add_to_menu: "Добавить", cancel: "Отмена", save_changes: "Сохранить",
    gallery: "Галерея", gallery_sub: "Фотографии для гостей.", add_photo: "Добавить фото",
    no_photos_t: "Фото нет", no_photos_b: "Добавьте фото заведения.",
    no_caption: "Без подписи", uploaded_photo: "Фото", gradient_fallback: "Градиент",
    add_photo_title: "Добавить фото", edit_photo_title: "Изменить фото", gallery_editor_sub: "Показывается вверху.",
    caption: "Подпись", fallback_colour: "Цвет", fallback_hint: "Показывается если фото не загрузилось.",
    statistics: "Статистика", stats_sub: "Срез дня.", stats_sub2: "Заполняется с заказами.",
    no_data_t: "Нет данных", no_data_b: "Оформите заказы для статистики.",
    revenue: "Выручка", outstanding: "К оплате", orders_stat: "Заказы", avg_order: "Средний чек", members: "Участники",
    tips_collected: "Чаевые", repeat_guests: "Повторные", peak_hour: "Пик", best_sellers: "Хиты", busiest_tables: "Столы", orders_by_hour: "По часам",
    customers: "Клиенты", customers_sub: "Участники Bean Club.", customers_sub2: "Регистрируются при заказе.",
    no_members_t: "Нет участников", no_members_b: "Появятся после регистрации.",
    email_all: "Письмо всем", col_name: "Имя", col_email: "Почта", col_orders: "Заказы", col_stamps: "Штампы", col_spent: "Потрачено", col_joined: "Регистрация",
    email_btn: "Письмо", compose_promo: "Промо", to_label: "Кому:", all_members_n: "Все ({n})",
    subject: "Тема", message: "Сообщение", send_promo: "Отправить", promo_demo_note: "Только демо.",
    cat_hot: "Горячий кофе", cat_hot_b: "Заварен утром", cat_cold: "Холодный кофе", cat_cold_b: "Со льдом",
    cat_shots: "Эспрессо", cat_shots_b: "Быстро", cat_fruit: "Фруктовые", cat_fruit_b: "Свежие",
    cat_shakes: "Шейки", cat_shakes_b: "Густые", cat_softdrinks: "Напитки", cat_softdrinks_b: "Холодные",
    cat_snacks: "Закуски", cat_snacks_b: "Лёгкие", cat_dessert: "Десерты", cat_dessert_b: "Домашние",
    ago_s: "{n}с", ago_m: "{n}м", ago_h: "{n}ч", pill_new: "Новый", pill_preparing: "Готовится", pill_served: "Подан",
  },
  de: {
    tagline: "Setz dich — bestell vom Platz aus, wir bringen's.",
    sign_in: "Anmelden", hi_name: "Hallo, {name}", table_n: "Tisch {n}", not_your_table: "nicht dein Tisch?",
    bill_open: "Rechnung offen", all_settled: "Alles bezahlt", on_your_table: "{amt} auf deinem Tisch", nothing_owing: "Danke — nichts offen",
    unpaid: "Offen", paid: "Bezahlt", bean_club: "Bean Club",
    stamps_progress: "{n}/{max} Stempel — 5 bringen einen Gratis-Kaffee oder Donut",
    signin_to_collect: "Anmelden für Stempel", join_free: "Bean Club beitreten — gratis",
    view_menu: "Speisekarte", in_basket: "{n} im Korb", whats_on: "Heute im Angebot",
    congrats_t: "Gratis-Donut!", congrats_b: "5 Stempel voll. Deine Belohnung.",
    free_donut: "Gratis-Donut", coupon_sub: "Bean-Club-Belohnung", copy: "Kopieren", copied: "Kopiert",
    coupon_how: "Zeig den Code an der Theke.", see_my_coupons: "Meine Gutscheine", keep_ordering: "Weiter bestellen",
    my_coupons: "Meine Gutscheine", coupon_used_on: "Eingelöst am {d}", active: "Aktiv", used: "Eingelöst",
    coupons_ready_n: "{n} Gratis-Donuts warten", coupon_ready_1: "Gratis-Donut wartet",
    coupon_tap_view: "Tippe für deinen Code",
    redeem_coupon: "Gutschein einlösen", redeem_ph: "Code eingeben", redeem_btn: "Prüfen",
    redeem_ok: "Gültig! ✓", redeem_used: "Bereits eingelöst", redeem_bad: "Kein solcher Code",
    menu: "Speisekarte", sold_out: "Ausverkauft", view_basket: "Korb", items: "Artikel", item: "Artikel",
    your_basket: "Dein Korb", empty_basket_t: "Noch leer", empty_basket_b: "Füge etwas hinzu.",
    browse_menu: "Karte", delivering_to: "Lieferung an Tisch {n}",
    note_for_item: "Notiz für {name}", order_note_label: "Notiz zur Bestellung", order_note_ph: "Noch etwas?",
    use_reward: "Belohnung einlösen", reward_applied: "Belohnung angewendet",
    reward_free_item: "{name} geht auf uns", reward_add_item: "Kaffee oder Donut hinzufügen",
    subtotal: "Zwischensumme", club_reward: "Bean-Club-Belohnung", total: "Summe",
    guest_1: "Als Gast.", guest_2: "für einen Stempel.", send_order: "An die Küche",
    quick_order: "Jetzt bestellen", review_basket: "Korb prüfen",
    pay_title: "Zahlen", pay_full_cta: "Ganze Rechnung", or_split: "oder aufteilen",
    choose_split: "Wie zahlen?", split_whole: "Ganzen Tisch", split_whole_d: "Alles begleichen",
    split_mine: "Nur meine Bestellungen", split_mine_d: "Was du bestellt hast",
    split_even: "Gleichmäßig teilen", split_even_d: "In gleiche Teile",
    split_custom: "Betrag eingeben", split_custom_d: "Genau eingeben",
    split_items: "Artikel auswählen", split_items_d: "Genau wählen",
    pick_items_t: "Was zahlst du?", pick_items_b: "Tippe an",
    selected_total: "Ausgewählt", nothing_selected: "Mindestens einen wählen", pay_selected: "Ausgewählte zahlen",
    how_many_people: "Wie viele?", per_person: "{amt} pro Person", your_share: "Dein Anteil",
    enter_amount: "Betrag", of_remaining: "von {amt}",
    add_tip: "Trinkgeld", tip_none: "Kein Trinkgeld", tip_custom: "Eigen",
    subtotal_label: "Zwischensumme", tip_label: "Trinkgeld", to_pay: "Zu zahlen", continue_btn: "Weiter",
    pay_now: "{amt} zahlen", confirm_payment: "Bestätigen", payment_sent: "Zahlung erfasst",
    payment_sent_d: "Deine Zahlung {amt} für Tisch {n} gemeldet.",
    pay_at_register_note: "Zahle an der Theke oder beim Kellner.",
    back_to_options: "← Zurück", nothing_to_pay: "Nichts mehr zu zahlen.",
    paying_amount: "Du zahlst", remaining_after: "Danach: {amt}",
    order_sent: "Bestellung gesendet!", getting_ready: "Wir bereiten Tisch {n} vor.", order_id: "Bestellung {id}",
    step_received: "Erhalten", step_preparing: "Zubereitung", step_served: "Serviert",
    status_updates: "Status aktualisiert sich.",
    reward_unlocked: "Belohnung! 🎁", stamp_earned: "+1 Stempel ⭐", view_account: "Mein Konto",
    missed_stamp_t: "Stempel verpasst", missed_stamp_b: "Mitglieder: 5 Bestellungen = Gratis-Belohnung.",
    join_club: "Bean Club beitreten", order_more: "Noch bestellen", view_bill: "Rechnung",
    join_banner: "Ein Stempel pro Bestellung. Fünf = Gratis.",
    your_name: "Name", email: "E-Mail", email_consent: "Nur Belohnungen. Kein Spam.",
    create_account: "Konto erstellen", already_member: "Schon Mitglied? E-Mail eingeben.",
    account: "Konto", not_signed_in: "Nicht angemeldet", join_to_track: "Beitritt für Bestellverlauf.",
    orders_count: "{n} Bestellungen", order_history: "Bestellverlauf", no_orders_hist: "Noch keine Bestellungen.",
    reorder: "Erneut bestellen", sign_out: "Abmelden",
    reward_ready_short: "🎁 Gratis bereit.", more_until: "Noch {n} Bestellung(en).",
    bill_title: "Rechnung Tisch {n}", no_orders_yet: "Noch keine", bill_builds: "Wächst mit Bestellungen.",
    reward_word: "Belohnung", order_total: "Bestellsumme", total_ordered: "Gesamt", already_paid: "Bezahlt",
    amount_due: "Offen", settled: "Bezahlt", pay_at_counter: "An der Theke zahlen",
    ask_bill: "Rechnung", server_notified: "Kellner benachrichtigt", someone_over: "Kommt zu Tisch {n}.",
    ask_bill_hint: "Personal wird benachrichtigt.", all_settled_thanks: "Alles bezahlt!",
    t_added: "{name} hinzugefügt", t_signed_in: "Angemeldet", t_to_basket: "Zum Korb",
    t_unavailable: "Nicht verfügbar", t_server_notified: "Kellner benachrichtigt — Tisch {n}",
    t_table_paid: "Tisch {n} bezahlt", t_table_reopened: "Tisch {n} geöffnet", t_order_status: "Bestellung {id} → {status}",
    t_item_removed: "Entfernt", t_changes_saved: "Gespeichert", t_photo_removed: "Foto entfernt",
    t_photo_added: "Foto hinzugefügt", t_photo_updated: "Foto aktualisiert", t_reset: "Demo zurückgesetzt",
    t_promo_queued: "Promo für {n}", t_order_error: "Fehler — nochmal versuchen",
    nav_orders: "Bestellungen", nav_tables: "Tische", nav_menu: "Karte", nav_gallery: "Galerie",
    nav_brand: "Marke", nav_stats: "Statistik", nav_customers: "Kunden",
    brand_title: "Marke & Theme", brand_sub: "Look auswählen.", theme_applied: "Thema {name} aktiviert", current_theme: "Aktuell",
    currency_label: "Währung", allergens_label: "Allergene",
    staff_login_title: "Mitarbeiter-Login", staff_login_sub: "Nur für Personal.",
    staff_password: "Passwort", staff_signin: "Anmelden", staff_wrong: "Falsche E-Mail oder Passwort",
    staff_signout: "Abmelden", staff_back_customer: "← Kundenansicht",
    staff_counter: "Personal · Theke", reset_demo: "Demo zurück", new_order_in: "Neue Bestellung!",
    sound_on: "Ton an", auto_settled: "Abgeschlossen", sound_off: "Ton aus",
    live_orders: "Live-Bestellungen", live_orders_sub: "Bons erscheinen sofort.",
    n_new: "{n} neu", f_active: "Aktiv", f_new: "Neu", f_preparing: "In Zubereitung", f_served: "Serviert", f_all: "Alle",
    no_orders_admin_t: "Keine Bestellungen", no_orders_admin_b: "Bestellen aus Kundenansicht.",
    guest: "Gast", reward_tag: "Belohnung", mark_paid: "Als bezahlt", mark_unpaid: "Als offen",
    start_preparing: "Starten", mark_served: "Als serviert", reopen: "Öffnen", served_btn: "Serviert",
    tables: "Tische", tables_sub: "Besetzte Tische.", tables_sub2: "Bezahlstatus.",
    no_tables_t: "Keine aktiven Tische", no_tables_b: "Erscheinen nach Bestellungen.",
    n_owing: "{n} offen · {total}", all_tables_settled: "Alle bezahlt", owing: "Offen",
    bill_requested_alert: "🔔 Rechnung angefordert", orders_word: "Bestellungen", order_word: "Bestellung", in_kitchen: "in Küche",
    paid_in_full: "{total} bezahlt", of_total: "von {total}", reopen_bill: "Öffnen", mark_paid_due: "Bezahlt · {due}",
    menu_admin_sub: "Menü verwalten.", add_item: "Hinzufügen", items_count: "{n} Artikel", empty_cat: "Leer.",
    add_item_title: "Hinzufügen", edit_item_title: "Bearbeiten", menu_editor_sub: "Gästemenü.",
    upload_photo: "Foto hochladen", remove_photo: "Entfernen", paste_url: "URL einfügen",
    name: "Name", category: "Kategorie", price: "Preis", emoji: "Emoji", short_desc: "Beschreibung",
    ingredients: "Zutaten", available_order: "Bestellbar", marked_sold_out: "Ausverkauft",
    add_to_menu: "Hinzufügen", cancel: "Abbrechen", save_changes: "Speichern",
    gallery: "Galerie", gallery_sub: "Fotos für Gäste.", add_photo: "Foto hinzufügen",
    no_photos_t: "Keine Fotos", no_photos_b: "Fotos hinzufügen.",
    no_caption: "Keine Bildunterschrift", uploaded_photo: "Foto", gradient_fallback: "Verlauf",
    add_photo_title: "Foto hinzufügen", edit_photo_title: "Bearbeiten", gallery_editor_sub: "Oben angezeigt.",
    caption: "Bildunterschrift", fallback_colour: "Farbe", fallback_hint: "Bei fehlendem Foto.",
    statistics: "Statistik", stats_sub: "Tagesübersicht.", stats_sub2: "Mit Bestellungen.",
    no_data_t: "Keine Daten", no_data_b: "Bestellungen aufgeben.",
    revenue: "Umsatz", outstanding: "Offen", orders_stat: "Bestellungen", avg_order: "Ø", members: "Mitglieder",
    tips_collected: "Trinkgeld", repeat_guests: "Stammgäste", peak_hour: "Stoßzeit",
    best_sellers: "Bestseller", busiest_tables: "Aktivste Tische", orders_by_hour: "Nach Stunde",
    customers: "Kunden", customers_sub: "Bean-Club-Mitglieder.", customers_sub2: "Registrieren beim Bestellen.",
    no_members_t: "Keine Mitglieder", no_members_b: "Erscheinen nach Beitritt.",
    email_all: "E-Mail an alle", col_name: "Name", col_email: "E-Mail", col_orders: "Bestellungen",
    col_stamps: "Stempel", col_spent: "Ausgegeben", col_joined: "Beigetreten",
    email_btn: "E-Mail", compose_promo: "Promo", to_label: "An:", all_members_n: "Alle ({n})",
    subject: "Betreff", message: "Nachricht", send_promo: "Senden", promo_demo_note: "Nur Demo.",
    cat_hot: "Heiße Kaffees", cat_hot_b: "Heute früh gebrüht", cat_cold: "Kalte Kaffees", cat_cold_b: "Auf Eis",
    cat_shots: "Espresso", cat_shots_b: "Klein und stark", cat_fruit: "Fruchtsäfte", cat_fruit_b: "Frisch gepresst",
    cat_shakes: "Shakes", cat_shakes_b: "Dick und kalt", cat_softdrinks: "Getränke", cat_softdrinks_b: "Kalt",
    cat_snacks: "Snacks", cat_snacks_b: "Frisch", cat_dessert: "Desserts", cat_dessert_b: "Hausgemacht",
    ago_s: "vor {n}s", ago_m: "vor {n}m", ago_h: "vor {n}h", pill_new: "Neu", pill_preparing: "Zubereitung", pill_served: "Serviert",
  },
  ar: {
    tagline: "اسحب كرسيًا — اطلب من مكانك وسنحضره إليك.",
    sign_in: "تسجيل الدخول", hi_name: "مرحبًا، {name}", table_n: "طاولة {n}", not_your_table: "ليست طاولتك؟",
    bill_open: "الفاتورة مفتوحة", all_settled: "تم الدفع", on_your_table: "{amt} على طاولتك", nothing_owing: "شكرًا — لا يوجد مستحق",
    unpaid: "غير مدفوع", paid: "مدفوع", bean_club: "نادي Bean",
    stamps_progress: "{n}/{max} ختم — 5 تمنحك قهوة أو دونات مجانية",
    signin_to_collect: "سجّل للحصول على ختم", join_free: "انضم مجانًا",
    view_menu: "القائمة", in_basket: "{n} في السلة", whats_on: "عروض اليوم",
    congrats_t: "دونات مجانية!", congrats_b: "اكتملت 5 أختام.",
    free_donut: "دونات مجانية", coupon_sub: "مكافأة النادي", copy: "نسخ", copied: "تم",
    coupon_how: "أظهر الرمز عند الكاشير.", see_my_coupons: "قسائمي", keep_ordering: "متابعة",
    my_coupons: "قسائمي", coupon_used_on: "استُخدمت {d}", active: "فعّالة", used: "مستخدمة",
    coupons_ready_n: "{n} دونات مجانية", coupon_ready_1: "دونات بانتظارك", coupon_tap_view: "اضغط للرمز",
    redeem_coupon: "استخدم قسيمة", redeem_ph: "أدخل الرمز", redeem_btn: "تحقق",
    redeem_ok: "صحيح! ✓", redeem_used: "مستخدمة", redeem_bad: "لا يوجد",
    menu: "القائمة", sold_out: "نفد", view_basket: "السلة", items: "عناصر", item: "عنصر",
    your_basket: "سلتك", empty_basket_t: "فارغة", empty_basket_b: "أضف شيئًا.",
    browse_menu: "القائمة", delivering_to: "الطاولة {n}",
    note_for_item: "ملاحظة لـ {name}", order_note_label: "ملاحظة", order_note_ph: "أي شيء آخر؟",
    use_reward: "استخدم المكافأة", reward_applied: "تم التطبيق",
    reward_free_item: "{name} مجانًا", reward_add_item: "أضف قهوة أو دونات",
    subtotal: "المجموع", club_reward: "مكافأة النادي", total: "الإجمالي",
    guest_1: "كضيف.", guest_2: "للحصول على ختم.", send_order: "أرسل للمطبخ",
    quick_order: "اطلب الآن", review_basket: "راجع السلة",
    pay_title: "الدفع", pay_full_cta: "ادفع الكل", or_split: "أو قسّم",
    choose_split: "كيف تدفع؟", split_whole: "الطاولة كاملة", split_whole_d: "كل المستحق",
    split_mine: "طلباتي فقط", split_mine_d: "ما طلبته",
    split_even: "بالتساوي", split_even_d: "حصص متساوية",
    split_custom: "مبلغ محدد", split_custom_d: "أدخل المبلغ",
    split_items: "اختر أصنافًا", split_items_d: "اختر ما تدفعه",
    pick_items_t: "ماذا تدفع؟", pick_items_b: "اضغط للاختيار",
    selected_total: "الإجمالي", nothing_selected: "اختر صنفًا", pay_selected: "ادفع المحدد",
    how_many_people: "كم عدد الأشخاص؟", per_person: "{amt} للشخص", your_share: "حصتك",
    enter_amount: "المبلغ", of_remaining: "من {amt}",
    add_tip: "بقشيش", tip_none: "بدون", tip_custom: "مخصص",
    subtotal_label: "المجموع", tip_label: "بقشيش", to_pay: "للدفع", continue_btn: "متابعة",
    pay_now: "ادفع {amt}", confirm_payment: "تأكيد", payment_sent: "تم التسجيل",
    payment_sent_d: "دفعتك {amt} للطاولة {n}.",
    pay_at_register_note: "ادفع عند الكاشير.",
    back_to_options: "← عودة", nothing_to_pay: "لا شيء للدفع.",
    paying_amount: "تدفع", remaining_after: "المتبقّي: {amt}",
    order_sent: "تم الإرسال!", getting_ready: "نحضّر للطاولة {n}.", order_id: "طلب {id}",
    step_received: "تم الاستلام", step_preparing: "قيد التحضير", step_served: "تم التقديم",
    status_updates: "يتحدث الحالة.",
    reward_unlocked: "مكافأة! 🎁", stamp_earned: "+1 ختم ⭐", view_account: "حسابي",
    missed_stamp_t: "فاتك ختم", missed_stamp_b: "5 طلبات = مكافأة مجانية.",
    join_club: "انضم للنادي", order_more: "اطلب أكثر", view_bill: "الفاتورة",
    join_banner: "ختم مع كل طلب. خمسة = مجاني.",
    your_name: "اسمك", email: "البريد", email_consent: "فقط مكافآت.",
    create_account: "إنشاء حساب", already_member: "عضو بالفعل؟ أدخل بريدك.",
    account: "الحساب", not_signed_in: "لم تسجّل", join_to_track: "انضم لتتبع الطلبات.",
    orders_count: "{n} طلبات", order_history: "سجل الطلبات", no_orders_hist: "لا طلبات.",
    reorder: "أعد الطلب", sign_out: "خروج",
    reward_ready_short: "🎁 مكافأة جاهزة.", more_until: "بقي {n} طلب.",
    bill_title: "فاتورة {n}", no_orders_yet: "لا طلبات", bill_builds: "تتراكم مع الطلبات.",
    reward_word: "مكافأة", order_total: "إجمالي الطلب", total_ordered: "الإجمالي", already_paid: "المدفوع",
    amount_due: "المستحق", settled: "مدفوع", pay_at_counter: "ادفع عند الكاشير",
    ask_bill: "الفاتورة", server_notified: "تم الإبلاغ", someone_over: "قريبًا للطاولة {n}.",
    ask_bill_hint: "إبلاغ الموظفين.", all_settled_thanks: "تم الدفع!",
    t_added: "تمت إضافة {name}", t_signed_in: "تم الدخول", t_to_basket: "أُضيف للسلة",
    t_unavailable: "غير متوفر", t_server_notified: "تم الإبلاغ — الطاولة {n}",
    t_table_paid: "الطاولة {n} مدفوعة", t_table_reopened: "أُعيد فتح الطاولة {n}",
    t_order_status: "طلب {id} ← {status}", t_item_removed: "تمت الإزالة", t_changes_saved: "تم الحفظ",
    t_photo_removed: "تمت إزالة الصورة", t_photo_added: "تمت إضافة الصورة", t_photo_updated: "تم التحديث",
    t_reset: "تمت إعادة الضبط", t_promo_queued: "العرض لـ {n}", t_order_error: "خطأ — حاول مجددًا",
    nav_orders: "الطلبات", nav_tables: "الطاولات", nav_menu: "القائمة", nav_gallery: "المعرض",
    nav_brand: "الهوية", nav_stats: "الإحصاءات", nav_customers: "العملاء",
    brand_title: "الهوية والتصميم", brand_sub: "اختر مظهرًا.", theme_applied: "تم تطبيق {name}", current_theme: "الحالي",
    currency_label: "العملة", allergens_label: "مسببات الحساسية",
    staff_login_title: "دخول الموظفين", staff_login_sub: "للموظفين فقط.",
    staff_password: "كلمة المرور", staff_signin: "دخول", staff_wrong: "بيانات خاطئة",
    staff_signout: "خروج", staff_back_customer: "← عرض العميل",
    staff_counter: "الكاشير", reset_demo: "إعادة ضبط", new_order_in: "طلب جديد!",
    sound_on: "الصوت مفعّل", auto_settled: "تمت التسوية", sound_off: "الصوت متوقف",
    live_orders: "الطلبات المباشرة", live_orders_sub: "تصل فورًا.",
    n_new: "{n} جديدة", f_active: "نشطة", f_new: "جديدة", f_preparing: "قيد التحضير", f_served: "مُقدّمة", f_all: "الكل",
    no_orders_admin_t: "لا طلبات", no_orders_admin_b: "اطلب من عرض العميل.",
    guest: "ضيف", reward_tag: "مكافأة", mark_paid: "تحديد كمدفوع", mark_unpaid: "غير مدفوع",
    start_preparing: "ابدأ", mark_served: "تم التقديم", reopen: "إعادة فتح", served_btn: "مُقدّم",
    tables: "الطاولات", tables_sub: "الطاولات المشغولة.", tables_sub2: "حالة الدفع.",
    no_tables_t: "لا طاولات", no_tables_b: "تظهر بعد الطلبات.",
    n_owing: "{n} مدينة · {total}", all_tables_settled: "كل مدفوعة", owing: "مدينة",
    bill_requested_alert: "🔔 طُلبت الفاتورة", orders_word: "طلبات", order_word: "طلب", in_kitchen: "المطبخ",
    paid_in_full: "{total} مدفوعة", of_total: "من {total}", reopen_bill: "إعادة فتح", mark_paid_due: "مدفوع · {due}",
    menu_admin_sub: "إدارة القائمة.", add_item: "إضافة", items_count: "{n} عنصر", empty_cat: "فارغة.",
    add_item_title: "إضافة", edit_item_title: "تعديل", menu_editor_sub: "القائمة للضيوف.",
    upload_photo: "رفع صورة", remove_photo: "إزالة", paste_url: "أو ألصق رابط",
    name: "الاسم", category: "الفئة", price: "السعر", emoji: "إيموجي", short_desc: "وصف",
    ingredients: "المكونات", available_order: "متاح", marked_sold_out: "نفد",
    add_to_menu: "إضافة", cancel: "إلغاء", save_changes: "حفظ",
    gallery: "المعرض", gallery_sub: "صور للضيوف.", add_photo: "إضافة صورة",
    no_photos_t: "لا صور", no_photos_b: "أضف صورًا.",
    no_caption: "بدون", uploaded_photo: "صورة", gradient_fallback: "تدرّج",
    add_photo_title: "إضافة صورة", edit_photo_title: "تعديل", gallery_editor_sub: "أعلى الصفحة.",
    caption: "التسمية", fallback_colour: "اللون", fallback_hint: "عند فشل التحميل.",
    statistics: "الإحصاءات", stats_sub: "نظرة اليوم.", stats_sub2: "مع الطلبات.",
    no_data_t: "لا بيانات", no_data_b: "أنشئ طلبات.",
    revenue: "الإيراد", outstanding: "المستحق", orders_stat: "الطلبات", avg_order: "متوسط", members: "الأعضاء",
    tips_collected: "البقشيش", repeat_guests: "متكررون", peak_hour: "الذروة",
    best_sellers: "الأكثر", busiest_tables: "الأنشط", orders_by_hour: "بالساعة",
    customers: "العملاء", customers_sub: "أعضاء النادي.", customers_sub2: "يسجّلون عند الطلب.",
    no_members_t: "لا أعضاء", no_members_b: "يظهرون بعد التسجيل.",
    email_all: "راسل الكل", col_name: "الاسم", col_email: "البريد", col_orders: "الطلبات",
    col_stamps: "الأختام", col_spent: "أنفق", col_joined: "انضم",
    email_btn: "بريد", compose_promo: "عرض", to_label: "إلى:", all_members_n: "الكل ({n})",
    subject: "الموضوع", message: "الرسالة", send_promo: "أرسل", promo_demo_note: "عرض فقط.",
    cat_hot: "قهوة ساخنة", cat_hot_b: "محضّرة صباحًا", cat_cold: "قهوة باردة", cat_cold_b: "على الثلج",
    cat_shots: "إسبريسو", cat_shots_b: "سريع", cat_fruit: "فواكه", cat_fruit_b: "طازجة",
    cat_shakes: "شيك", cat_shakes_b: "كثيف", cat_softdrinks: "مشروبات", cat_softdrinks_b: "باردة",
    cat_snacks: "وجبات خفيفة", cat_snacks_b: "طازجة", cat_dessert: "حلويات", cat_dessert_b: "يومية",
    ago_s: "{n}ث", ago_m: "{n}د", ago_h: "{n}س", pill_new: "جديد", pill_preparing: "قيد التحضير", pill_served: "مُقدّم",
  },
};

// ── Context & helpers ───────────────────────────────────────────────────────
const LangCtx = createContext({ lang: "en", setLang: () => {}, dir: "ltr", t: (k) => k });
const useT = () => useContext(LangCtx);
const ThemeCtx = createContext({ themeId: "hearth", setThemeId: () => {} });
const useTheme = () => useContext(ThemeCtx);
const CurrencyCtx = createContext({ currency: DEFAULT_CURRENCY, setCurrency: () => {} });
const useCurrency = () => useContext(CurrencyCtx);
const useMoney = () => { const { currency } = useCurrency(); return (n) => formatMoney(n, currency); };

function makeT(lang) {
  return (key, vars) => {
    let s = (STR[lang] && STR[lang][key]) || STR.en[key] || key;
    if (vars) for (const k in vars) s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
    return s;
  };
}
function timeAgo(iso, t) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return t("ago_s", { n: diff });
  if (diff < 3600) return t("ago_m", { n: Math.floor(diff / 60) });
  return t("ago_h", { n: Math.floor(diff / 3600) });
}

// ── Supabase keys ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://lmxgdsjiatkmwounikvk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteGdkc2ppYXRrbXdvdW5pa3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzMzNjQsImV4cCI6MjA5NzIwOTM2NH0.ENft4QX2JZ1rBf_yokbYvgzkyJrJ4VRMOoApvouSHt0";
const SUPA_READY = !/BURAYA_/.test(SUPABASE_URL);

// ── Shared state keys ───────────────────────────────────────────────────────
const K_ORDERS    = "hb:orders";
const K_CUSTOMERS = "hb:customers";
const K_MENU      = "hb:menu:v4";
const K_SLIDES    = "hb:slides:v3";
const K_PAYMENTS  = "hb:payments";
const K_LANG      = "hb:lang";
const K_THEME     = "hb:theme";
const K_CURRENCY  = "hb:currency";
const K_STAFF     = "hb:staff_session";
const SHARED_KEYS = [K_ORDERS, K_CUSTOMERS, K_MENU, K_SLIDES, K_PAYMENTS, K_THEME, K_CURRENCY];
const LOCAL_KEYS  = [K_LANG, K_STAFF];

function supaHeaders() {
  return { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY, "Content-Type": "application/json" };
}
function localLoad(key, fallback) {
  try { const v = window.localStorage.getItem(key); return v != null ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function localSave(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
async function loadJSON(key, fallback) {
  if (LOCAL_KEYS.includes(key)) return localLoad(key, fallback);
  if (!SUPA_READY) return localLoad(key, fallback);
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.${encodeURIComponent(key)}&select=value`, { headers: supaHeaders() });
    const rows = await r.json();
    return rows && rows[0] && rows[0].value != null ? rows[0].value : fallback;
  } catch { return fallback; }
}
async function saveJSON(key, value) {
  if (LOCAL_KEYS.includes(key)) { localSave(key, value); return; }
  if (!SUPA_READY) { localSave(key, value); return; }
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/app_state`, {
      method: "POST",
      headers: { ...supaHeaders(), Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ id: key, value, updated_at: new Date().toISOString() }),
    });
  } catch {}
}

// ── WebSocket realtime (exponential backoff yeniden bağlanma) ───────────────
function subscribeShared(onChange) {
  if (!SUPA_READY || typeof WebSocket === "undefined") return () => {};
  let ws, alive = true, pingTimer, retryTimer;
  let retryDelay = 1000;
  function connect() {
    if (!alive) return;
    try {
      ws = new WebSocket(`${SUPABASE_URL.replace("https://", "wss://")}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`);
      ws.onopen = () => {
        retryDelay = 1000;
        const ref = "hb-" + Math.random().toString(36).slice(2, 8);
        ws.send(JSON.stringify({ topic: "realtime:public:app_state", event: "phx_join", payload: { config: { postgres_changes: [{ event: "*", schema: "public", table: "app_state" }] } }, ref }));
        clearInterval(pingTimer);
        pingTimer = setInterval(() => { try { if (ws.readyState === 1) ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: "hb" })); } catch {} }, 25000);
      };
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.event === "postgres_changes") {
            const rec = data.payload?.data?.record;
            if (rec && rec.id && SHARED_KEYS.includes(rec.id)) onChange(rec.id, rec.value);
          }
        } catch {}
      };
      ws.onerror = () => { try { ws.close(); } catch {} };
      ws.onclose = () => {
        clearInterval(pingTimer);
        if (!alive) return;
        retryTimer = setTimeout(() => { retryDelay = Math.min(retryDelay * 2, 30000); connect(); }, retryDelay);
      };
    } catch { if (alive) retryTimer = setTimeout(connect, retryDelay); }
  }
  connect();
  return () => { alive = false; clearInterval(pingTimer); clearTimeout(retryTimer); try { ws?.close(); } catch {} };
}

function SmartImg({ src, alt, fallback, className, style }) {
  const [err, setErr] = useState(false);
  if (!src || err) return fallback;
  return <img src={src} alt={alt || ""} className={className} style={style} loading="lazy" onError={() => setErr(true)} />;
}
function LangPicker({ dark }) {
  const { lang, setLang } = useT();
  return (
    <select className={`eb-lang ${dark ? "dark" : ""}`} value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">
      {LANGS.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
    </select>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Bitter:wght@500;600;700;800&family=Anton&family=Lilita+One&display=swap');
.eb-app{--bg:#FBF6EC;--paper:#FFFDF8;--ink:#23332A;--ink-soft:#5b6b60;--pine:#2F4A3A;--pine-2:#3E5C49;--pine-ink:#f3efe3;--honey:#D99A2B;--honey-2:#E8B042;--honey-ink:#3a2c0c;--berry:#9C3B52;--berry-soft:#c98397;--line:#E7DAC2;--line-2:#efe6d3;--shadow:0 1px 2px rgba(35,51,42,.05),0 8px 30px rgba(35,51,42,.07);--shadow-lg:0 20px 60px rgba(35,51,42,.18);font-family:'DM Sans','Noto Sans Arabic',system-ui,sans-serif;color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased;min-height:100vh;width:100%;}
.eb-app *{box-sizing:border-box;}.eb-app button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}.eb-app input,.eb-app textarea,.eb-app select{font-family:inherit;}
.eb-serif{font-family:var(--font,'Fraunces',Georgia,serif);font-optical-sizing:auto;}.eb-app[dir="rtl"] .eb-serif{font-family:'Noto Sans Arabic','Fraunces',serif;font-weight:600;}
.eb-mono{font-family:'DM Mono',ui-monospace,monospace;}
.eb-lang{appearance:none;-webkit-appearance:none;border:1.5px solid var(--line);background:var(--paper);color:var(--ink);font-size:12.5px;font-weight:600;padding:7px 12px;border-radius:999px;cursor:pointer;outline:none;}
.eb-lang.dark{background:rgba(20,28,22,.55);color:#fff;border-color:rgba(255,255,255,.25);backdrop-filter:blur(4px);}.eb-lang.dark option{color:#000;}
.eb-stage{display:flex;justify-content:center;padding:34px 16px 110px;}.eb-phone{width:100%;max-width:420px;background:var(--bg-pattern,none) var(--paper);border-radius:34px;box-shadow:var(--shadow-lg);overflow:hidden;position:relative;min-height:760px;border:1px solid var(--line);}
.eb-phone-bar{height:34px;display:flex;align-items:center;justify-content:center;}.eb-phone-bar i{width:90px;height:6px;border-radius:99px;background:var(--line);display:block;}
.eb-screen{padding:0 0 24px;animation:fade .35s ease;}@keyframes fade{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.eb-pad{padding:0 22px;}.eb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--pine);color:var(--pine-ink);font-weight:600;font-size:15px;padding:14px 20px;border-radius:14px;transition:.16s;width:100%;}.eb-btn:hover{background:var(--pine-2);}.eb-btn:active{transform:translateY(1px);}.eb-btn.honey{background:var(--honey);color:var(--honey-ink);}.eb-btn.honey:hover{background:var(--honey-2);}.eb-btn.ghost{background:transparent;color:var(--pine);border:1.5px solid var(--line);}.eb-btn.ghost:hover{border-color:var(--pine);}.eb-btn:disabled{cursor:not-allowed;}
.eb-chip{display:inline-flex;align-items:center;gap:6px;background:var(--pine);color:var(--pine-ink);font-size:12.5px;font-weight:600;padding:6px 12px;border-radius:999px;}
.eb-input{width:100%;padding:13px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--paper);font-size:15px;color:var(--ink);outline:none;transition:.15s;}.eb-input:focus{border-color:var(--pine);box-shadow:0 0 0 3px rgba(47,74,58,.1);}
.eb-label{font-size:12px;font-weight:600;color:var(--ink-soft);letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px;display:block;}
.eb-scan{padding:30px 22px;text-align:center;}.eb-scan-top{display:flex;justify-content:flex-end;margin-bottom:6px;}
.eb-cam{margin:14px auto;width:230px;height:230px;border-radius:24px;position:relative;background:linear-gradient(155deg,#26352b,#3b5142);overflow:hidden;display:flex;align-items:center;justify-content:center;}
.eb-cam .frame{position:absolute;inset:26px;border-radius:16px;}.eb-cam .c1,.eb-cam .c2,.eb-cam .c3,.eb-cam .c4{position:absolute;width:34px;height:34px;}
.eb-cam .c1{top:0;left:0;border-top:3px solid var(--honey);border-left:3px solid var(--honey);border-top-left-radius:10px;}
.eb-cam .c2{top:0;right:0;border-top:3px solid var(--honey);border-right:3px solid var(--honey);border-top-right-radius:10px;}
.eb-cam .c3{bottom:0;left:0;border-bottom:3px solid var(--honey);border-left:3px solid var(--honey);border-bottom-left-radius:10px;}
.eb-cam .c4{bottom:0;right:0;border-bottom:3px solid var(--honey);border-right:3px solid var(--honey);border-bottom-right-radius:10px;}
.eb-cam .laser{position:absolute;left:26px;right:26px;height:2px;background:var(--honey-2);box-shadow:0 0 12px var(--honey);animation:scan 1.6s ease-in-out infinite;}
@keyframes scan{0%,100%{top:30px;}50%{top:196px;}}.eb-cam.found{background:linear-gradient(155deg,#2f4a3a,#3E5C49);}
.eb-detected{animation:pop .4s cubic-bezier(.2,1.4,.5,1);}@keyframes pop{0%{transform:scale(.5);opacity:0;}100%{transform:none;opacity:1;}}
.eb-demobox{margin-top:18px;border:1.5px dashed var(--line);border-radius:14px;padding:13px;text-align:start;background:#fbf7ee;}
.eb-demobox .h{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);display:flex;align-items:center;gap:6px;}
.eb-demobox p{font-size:11.5px;color:var(--ink-soft);margin:4px 0 10px;}.eb-stickers{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;}
.eb-sticker{aspect-ratio:1;border-radius:9px;border:1.5px solid var(--line);background:var(--paper);font-weight:600;font-size:13px;transition:.14s;color:var(--ink);}.eb-sticker.on{background:var(--pine);color:#fff;border-color:var(--pine);}.eb-sticker:hover{border-color:var(--honey);}
.eb-carousel{position:relative;}.eb-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;}.eb-track::-webkit-scrollbar{display:none;}
.eb-slide{flex:0 0 100%;scroll-snap-align:center;height:248px;position:relative;display:flex;align-items:flex-end;overflow:hidden;}
.eb-slide img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}.eb-slide .fb{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:78px;}
.eb-slide .scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(20,28,22,.72),rgba(20,28,22,.05) 55%);}.eb-slide .cap{position:relative;color:#fff;padding:16px 20px;font-family:'Fraunces',serif;font-size:18px;font-weight:500;}
.eb-app[dir="rtl"] .eb-slide .cap{font-family:'Noto Sans Arabic',serif;}.eb-dots{position:absolute;bottom:12px;inset-inline-end:16px;display:flex;gap:6px;z-index:3;}
.eb-dots i{width:7px;height:7px;border-radius:99px;background:rgba(255,255,255,.45);transition:.2s;}.eb-dots i.on{background:#fff;width:18px;}
.eb-overhero{position:absolute;top:14px;inset-inline-start:16px;inset-inline-end:16px;display:flex;justify-content:space-between;align-items:flex-start;z-index:3;gap:8px;}
.eb-logo{width:48px;height:48px;border-radius:14px;background:var(--honey);display:flex;align-items:center;justify-content:center;font-size:25px;box-shadow:var(--shadow);}
.eb-monogram{font-family:'Fraunces',Georgia,serif;font-weight:700;color:var(--honey-ink);letter-spacing:-.02em;display:inline-flex;align-items:baseline;font-size:18px;line-height:1;}
.eb-monogram i{font-style:italic;font-weight:500;font-size:.62em;margin:0 .04em;opacity:.85;}.eb-monogram.sm{font-size:14px;color:var(--honey-ink);}
.eb-namecard{padding:16px 22px 4px;}.eb-namecard h1{font-size:29px;font-weight:600;line-height:1;}.eb-namecard p{color:var(--ink-soft);font-size:13.5px;margin-top:5px;}
.eb-stampcard{background:var(--paper);border:1.5px solid var(--line);border-radius:18px;padding:16px;box-shadow:var(--shadow);}
.eb-stamps{display:flex;gap:8px;margin-top:12px;}.eb-stamp{flex:1;aspect-ratio:1;border-radius:50%;border:2px dashed var(--berry-soft);display:flex;align-items:center;justify-content:center;font-size:17px;color:transparent;transition:.3s;}
.eb-stamp.on{border-style:solid;border-color:var(--berry);background:var(--berry);color:#fff;animation:stamp .4s cubic-bezier(.2,1.4,.5,1);}@keyframes stamp{0%{transform:scale(.4) rotate(-18deg);opacity:0;}100%{transform:none;opacity:1;}}
.eb-reward-banner{background:linear-gradient(100deg,#9C3B52,#b9526a);color:#fff;border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:var(--shadow);}
.eb-reward-screen{position:relative;overflow:hidden;min-height:560px;}.eb-confetti{position:absolute;inset:0;pointer-events:none;z-index:1;}
.eb-confetti i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;opacity:.9;animation:conffall linear forwards;}
@keyframes conffall{0%{transform:translateY(-20px) rotate(0);opacity:1;}100%{transform:translateY(620px) rotate(540deg);opacity:.7;}}
.eb-reward-emoji{font-size:72px;animation:rewardpop .7s cubic-bezier(.2,1.5,.4,1) both;}@keyframes rewardpop{0%{transform:scale(0) rotate(-30deg);}70%{transform:scale(1.25) rotate(8deg);}100%{transform:scale(1) rotate(0);}}
.eb-coupon{position:relative;z-index:2;margin:22px auto 0;max-width:300px;background:var(--paper);border:2px dashed var(--honey);border-radius:18px;padding:0;overflow:hidden;box-shadow:var(--shadow);}
.eb-coupon-top{display:flex;align-items:center;gap:12px;padding:16px;}.eb-coupon-perf{height:0;border-top:2px dashed var(--line);margin:0 14px;position:relative;}
.eb-coupon-perf::before,.eb-coupon-perf::after{content:"";position:absolute;top:-9px;width:18px;height:18px;border-radius:50%;background:var(--bg);}
.eb-coupon-perf::before{left:-23px;}.eb-coupon-perf::after{right:-23px;}
.eb-coupon-code{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;background:var(--honey);}
.eb-coupon-code span{font-family:'DM Mono',ui-monospace,monospace;font-size:18px;font-weight:600;letter-spacing:1px;color:var(--honey-ink);}
.eb-copybtn{background:var(--honey-ink);color:var(--honey);font-size:12px;font-weight:600;padding:7px 12px;border-radius:9px;white-space:nowrap;}
.eb-coupon-row{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:13px;padding:12px;margin-bottom:9px;background:var(--paper);}
.eb-coupon-row.used{opacity:.55;}.eb-coupon-row.used .eb-mono{text-decoration:line-through;}
.eb-pickrow{display:flex;align-items:center;gap:12px;width:100%;padding:13px 15px;border-radius:13px;border:1.5px solid var(--line);background:transparent;transition:.14s;}
.eb-pickrow.on{border-color:var(--honey);background:rgba(214,158,74,.1);}
.eb-pickbox{width:24px;height:24px;border-radius:7px;border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:var(--honey-ink);flex:none;transition:.14s;}
.eb-pickbox.on{background:var(--honey);border-color:var(--honey);}
.eb-billrow{display:flex;align-items:center;justify-content:space-between;width:100%;background:var(--paper);border:1.5px solid var(--line);border-radius:14px;padding:12px 14px;transition:.14s;}
.eb-billrow:hover{border-color:var(--honey);}
.eb-pp{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;}
.eb-pp.unpaid{background:#f6dfe4;color:#7a2336;}.eb-pp.paid{background:#dfeede;color:#1f4f2f;}
.eb-cats{display:flex;gap:8px;overflow-x:auto;padding:14px 22px 6px;scrollbar-width:none;}.eb-cats::-webkit-scrollbar{display:none;}
.eb-cat-pill{white-space:nowrap;padding:9px 15px;border-radius:999px;font-weight:600;font-size:13.5px;background:var(--line-2);color:var(--ink-soft);transition:.14s;}
.eb-cat-pill.on{background:var(--pine);color:var(--pine-ink);}
.eb-cat-head{padding:18px 22px 6px;}.eb-cat-head h2{font-size:23px;font-weight:600;}.eb-cat-head span{font-size:13px;color:var(--ink-soft);}
.eb-item{display:flex;gap:14px;align-items:center;padding:12px 22px;}.eb-item.out{opacity:.5;}
.eb-thumb{width:62px;height:62px;border-radius:15px;flex:none;display:flex;align-items:center;justify-content:center;font-size:30px;overflow:hidden;background-image:linear-gradient(145deg,rgba(255,255,255,.5),rgba(255,255,255,0));background-blend-mode:overlay;}
.eb-catcard{text-align:start;width:100%;transition:transform .15s ease;}.eb-catcard:active{transform:scale(.97);}
.eb-catcard-img{width:100%;aspect-ratio:1/1;border-radius:16px;overflow:hidden;display:flex;align-items:center;justify-content:center;}.eb-catcard-img img{width:100%;height:100%;object-fit:cover;}
.eb-catcard-title{font-size:14px;font-weight:600;margin-top:9px;color:var(--ink);line-height:1.2;}.eb-catcard-sub{font-size:11.5px;color:var(--ink-soft);margin-top:2px;line-height:1.25;}
.eb-thumb img{width:100%;height:100%;object-fit:cover;}
.eb-item-body{flex:1;min-width:0;}.eb-item-body h3{font-size:15.5px;font-weight:600;}.eb-item-body p{font-size:12.5px;color:var(--ink-soft);margin-top:1px;}
.eb-ingredients{font-size:11px;color:var(--ink-soft);margin-top:3px;font-style:italic;}
.eb-allergens{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;}
.eb-allergen-badge{display:inline-flex;align-items:center;gap:3px;font-size:10.5px;background:rgba(255,200,0,.13);color:var(--ink);border:1px solid rgba(255,180,0,.35);border-radius:6px;padding:2px 6px;white-space:nowrap;}
.eb-item-body .price{font-size:14px;font-weight:700;color:var(--pine);margin-top:3px;}
.eb-soldout{font-size:11px;font-weight:700;color:var(--berry);text-transform:uppercase;letter-spacing:.04em;}
.eb-add{width:38px;height:38px;border-radius:11px;background:var(--honey);color:var(--honey-ink);font-size:22px;font-weight:600;flex:none;display:flex;align-items:center;justify-content:center;transition:.14s;}
.eb-add:hover{background:var(--honey-2);}.eb-add:active{transform:scale(.9);}
.eb-qty{display:flex;align-items:center;gap:10px;background:var(--pine);border-radius:11px;padding:3px;flex:none;}
.eb-qty button{width:32px;height:32px;color:var(--pine-ink);font-size:20px;font-weight:600;}
.eb-qty span{color:#fff;font-weight:700;min-width:16px;text-align:center;font-size:14px;}
.eb-bar{position:sticky;bottom:0;background:var(--paper);border-top:1px solid var(--line);padding:14px 22px;box-shadow:0 -8px 24px rgba(35,51,42,.06);}
.eb-orderbar{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);width:calc(100% - 64px);max-width:356px;z-index:60;border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow-lg);padding:12px 14px;}
.eb-cline{display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--line-2);}
.eb-note-in{width:100%;margin-top:8px;padding:9px 11px;border-radius:10px;border:1.5px dashed var(--line);background:transparent;font-size:13px;resize:none;outline:none;color:var(--ink);}
.eb-note-in:focus{border-color:var(--honey);border-style:solid;}
.eb-steps{display:flex;align-items:center;margin:22px 0;}
.eb-step{flex:1;text-align:center;position:relative;}
.eb-step .dot{width:30px;height:30px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;background:var(--line);color:var(--ink-soft);font-size:14px;font-weight:700;transition:.3s;z-index:2;position:relative;}
.eb-step.done .dot{background:var(--pine);color:#fff;}.eb-step.active .dot{background:var(--honey);color:var(--honey-ink);box-shadow:0 0 0 5px rgba(217,154,43,.2);}
.eb-step small{font-size:11px;font-weight:600;color:var(--ink-soft);}.eb-step.done small,.eb-step.active small{color:var(--ink);}
.eb-step:not(:last-child):after{content:"";position:absolute;top:15px;left:60%;right:-40%;height:2px;background:var(--line);z-index:1;}
.eb-step.done:not(:last-child):after{background:var(--pine);}
.eb-admin{min-height:100vh;background:var(--bg-pattern,none) var(--bg);}
.eb-anav{background:var(--pine);color:var(--pine-ink);padding:0 24px;display:flex;align-items:center;gap:6px;height:62px;position:sticky;top:0;z-index:20;box-shadow:var(--shadow);overflow-x:auto;}
.eb-anav .brand{font-weight:600;font-size:18px;margin-inline-end:18px;display:flex;align-items:center;gap:9px;white-space:nowrap;}
.eb-anav .brand b{width:30px;height:30px;border-radius:9px;background:var(--honey);display:flex;align-items:center;justify-content:center;font-size:17px;}
.eb-atab{padding:9px 16px;border-radius:10px;font-weight:600;font-size:14px;color:#cfd8cf;transition:.14s;white-space:nowrap;}
.eb-atab.on{background:rgba(255,255,255,.12);color:#fff;}.eb-atab:hover{color:#fff;}
.eb-awrap{max-width:1120px;margin:0 auto;padding:26px 24px 60px;}
.eb-ahead{display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;}
.eb-ahead h1{font-size:30px;font-weight:600;}.eb-ahead p{color:var(--ink-soft);font-size:14px;margin-top:2px;}
.eb-filters{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;}
.eb-fpill{padding:8px 15px;border-radius:999px;font-weight:600;font-size:13px;background:var(--paper);border:1.5px solid var(--line);color:var(--ink-soft);transition:.14s;}
.eb-fpill.on{background:var(--pine);color:#fff;border-color:var(--pine);}
.eb-tickets{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;}
.eb-ticket{background:var(--paper);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column;}
.eb-ticket-top{padding:14px 16px;border-bottom:1px dashed var(--line);display:flex;align-items:center;justify-content:space-between;}
.eb-tnum{font-size:13px;color:var(--ink-soft);}.eb-tnum b{color:var(--ink);}
.eb-tt{display:flex;align-items:center;gap:8px;}.eb-table-badge{background:var(--pine);color:#fff;font-weight:700;font-size:14px;padding:6px 12px;border-radius:10px;}
.eb-status{font-size:11px;font-weight:700;padding:4px 9px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em;}
.eb-status.new{background:#fbe6c4;color:#7a5510;}.eb-status.preparing{background:#d8e6e2;color:#1f4f43;}.eb-status.served{background:#e3e9e1;color:#5b6b60;}
.eb-ticket-body{padding:14px 16px;flex:1;}.eb-trow{display:flex;justify-content:space-between;font-size:14px;padding:3px 0;}
.eb-trow .q{color:var(--berry);font-weight:700;margin-inline-end:7px;}
.eb-tnote{margin-top:4px;font-size:12.5px;color:var(--ink-soft);background:#fdf6e6;border-inline-start:3px solid var(--honey);padding:5px 9px;border-radius:0 8px 8px 0;}
.eb-pay-row{display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);}
.eb-paybtn{font-size:12.5px;font-weight:600;color:var(--pine);text-decoration:underline;text-underline-offset:2px;}
.eb-paybtn:hover{color:var(--honey);}
.eb-ticket-foot{padding:12px 16px;border-top:1px dashed var(--line);display:flex;gap:8px;}
.eb-tbtn{flex:1;padding:10px;border-radius:10px;font-weight:600;font-size:13px;transition:.14s;}
.eb-tbtn.primary{background:var(--honey);color:var(--honey-ink);}.eb-tbtn.primary:hover{background:var(--honey-2);}
.eb-tbtn.done{background:var(--pine);color:#fff;}.eb-tbtn.muted{background:var(--line-2);color:var(--ink-soft);}
.eb-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;margin-bottom:26px;}
.eb-stat{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:var(--shadow);}
.eb-stat .k{font-size:12px;font-weight:600;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;}.eb-stat .v{font-size:30px;font-weight:600;margin-top:6px;}.eb-stat .v.serif{font-family:'Fraunces',serif;}
.eb-panel{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:var(--shadow);}.eb-panel h3{font-size:16px;font-weight:600;margin-bottom:14px;}
.eb-bar-row{display:flex;align-items:center;gap:12px;margin-bottom:11px;font-size:13.5px;}
.eb-bar-row .nm{width:120px;flex:none;}.eb-bar-track{flex:1;height:11px;border-radius:99px;background:var(--line-2);overflow:hidden;}
.eb-bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--pine),var(--honey));transition:width .6s ease;}
.eb-bar-row .vl{width:40px;text-align:end;font-weight:600;color:var(--ink-soft);font-size:12.5px;}
.eb-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;}@media(max-width:760px){.eb-two{grid-template-columns:1fr;}}
.eb-ctable{width:100%;border-collapse:collapse;font-size:14px;}
.eb-ctable th{text-align:start;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);padding:10px 12px;border-bottom:1px solid var(--line);}
.eb-ctable td{padding:13px 12px;border-bottom:1px solid var(--line-2);}.eb-ctable tr:hover td{background:#fbf7ee;}
.eb-pill-mini{display:inline-flex;align-items:center;gap:5px;background:var(--line-2);padding:3px 9px;border-radius:99px;font-size:12px;font-weight:600;}
.eb-medit-cat{margin-bottom:26px;}.eb-medit-cat h2{font-family:'Fraunces',serif;font-size:20px;font-weight:600;margin-bottom:6px;display:flex;align-items:center;gap:8px;}
.eb-medit-cat h2 small{font-size:12px;font-weight:600;color:var(--ink-soft);font-family:'DM Sans',sans-serif;}
.eb-mrow{display:flex;align-items:center;gap:14px;background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:10px;box-shadow:var(--shadow);}
.eb-mrow.out{opacity:.6;}.eb-mrow .info{flex:1;min-width:0;}.eb-mrow .info b{font-size:15px;}.eb-mrow .info .ing{font-size:12px;color:var(--ink-soft);font-style:italic;margin-top:2px;}
.eb-mrow .pr{font-weight:700;color:var(--pine);font-size:15px;white-space:nowrap;}
.eb-toggle{position:relative;width:42px;height:24px;border-radius:99px;background:var(--line);transition:.2s;flex:none;}
.eb-toggle.on{background:var(--pine);}.eb-toggle i{position:absolute;top:3px;inset-inline-start:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s;}
.eb-toggle.on i{inset-inline-start:21px;}
.eb-iconbtn{width:34px;height:34px;border-radius:9px;background:var(--line-2);display:flex;align-items:center;justify-content:center;font-size:15px;transition:.14s;flex:none;}
.eb-iconbtn:hover{background:var(--line);}
.eb-uploader{display:flex;gap:14px;align-items:center;}
.eb-preview{width:84px;height:84px;border-radius:14px;background:var(--line-2);display:flex;align-items:center;justify-content:center;font-size:38px;overflow:hidden;flex:none;border:1px solid var(--line);}
.eb-preview img{width:100%;height:100%;object-fit:cover;}
.eb-tablecard{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:var(--shadow);}
.eb-tablecard.owing{border:1.5px solid var(--berry-soft);background:linear-gradient(180deg,#fdf3f5,var(--paper) 40%);}
.eb-tablecard.called{box-shadow:0 0 0 2px var(--honey),var(--shadow);}
.eb-called{margin-top:10px;background:#fdf0d6;color:#7a5510;font-size:12px;font-weight:600;padding:7px 10px;border-radius:9px;}
.eb-floor{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;}
.eb-gallery{display:flex;flex-direction:column;gap:10px;max-width:680px;}
.eb-grow{display:flex;align-items:center;gap:14px;background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:10px 12px;box-shadow:var(--shadow);}
.eb-gthumb{width:90px;height:60px;border-radius:10px;overflow:hidden;flex:none;background:var(--line-2);}
.eb-gthumb img{width:100%;height:100%;object-fit:cover;}
.eb-empty{text-align:center;padding:60px 20px;color:var(--ink-soft);}.eb-empty .em{font-size:46px;}
.eb-empty h3{font-size:19px;color:var(--ink);margin:12px 0 5px;font-weight:600;}
.eb-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:78px;z-index:120;background:var(--ink);color:#fff;padding:12px 20px;border-radius:13px;font-weight:500;font-size:14px;box-shadow:var(--shadow-lg);animation:toast .3s ease;display:flex;align-items:center;gap:9px;max-width:90vw;}
@keyframes toast{from{opacity:0;transform:translate(-50%,10px);}to{opacity:1;transform:translateX(-50%);}}
.eb-overlay{position:fixed;inset:0;background:rgba(35,51,42,.5);z-index:110;display:flex;align-items:center;justify-content:center;padding:20px;animation:fade .2s ease;overflow:auto;}
.eb-modal{background:var(--paper);border-radius:20px;max-width:460px;width:100%;padding:24px;box-shadow:var(--shadow-lg);margin:auto;}
.eb-modal h3{font-size:21px;font-weight:600;margin-bottom:4px;}.eb-sep{height:1px;background:var(--line-2);margin:16px 0;}
.eb-link{color:var(--pine);font-weight:600;text-decoration:underline;text-underline-offset:2px;}
.eb-login{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg-pattern,none) var(--bg);}
.eb-login-card{width:100%;max-width:380px;background:var(--paper);border:1px solid var(--line);border-radius:20px;padding:30px 26px;box-shadow:var(--shadow-lg);}
.eb-login-card .lock{width:54px;height:54px;border-radius:50%;background:var(--pine);color:var(--pine-ink);display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px;}
.eb-login-card h1{font-size:22px;font-weight:600;text-align:center;margin:0 0 4px;}.eb-login-card p.sub{font-size:13px;color:var(--ink-soft);text-align:center;margin:0 0 22px;}
.eb-login-card .err{background:#f6dfe4;color:#7a2336;font-size:13px;font-weight:600;padding:9px 12px;border-radius:10px;margin-bottom:14px;text-align:center;}
.eb-neworder{position:fixed;top:0;left:0;right:0;z-index:130;background:var(--honey);color:var(--honey-ink);text-align:center;font-weight:700;font-size:15px;padding:12px;box-shadow:0 4px 18px rgba(0,0,0,.18);animation:slidedown .3s ease;}
@keyframes slidedown{from{transform:translateY(-100%);}to{transform:none;}}
.eb-orderbar{animation:barpop .32s cubic-bezier(.2,1.3,.5,1);}
@keyframes barpop{from{transform:translate(-50%,140%);opacity:.4;}to{transform:translateX(-50%);opacity:1;}}
@media(prefers-reduced-motion:reduce){.eb-app *{animation:none!important;transition:none!important;}}
.eb-themecard{cursor:pointer;background:var(--paper);border:2px solid var(--line);border-radius:18px;padding:16px;transition:.16s;}
.eb-themecard:hover{border-color:var(--honey);}.eb-themecard.on{border-color:var(--pine);box-shadow:0 0 0 3px rgba(47,74,58,.12);}
.eb-theme-swatches{display:flex;gap:6px;margin-bottom:12px;}.eb-theme-swatches i{width:26px;height:26px;border-radius:50%;display:block;border:2px solid rgba(255,255,255,.7);box-shadow:0 0 0 1px var(--line);}
.eb-theme-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
.eb-app[data-shape="sharp"] .eb-logo,.eb-app[data-shape="sharp"] .eb-stampcard,.eb-app[data-shape="sharp"] .eb-reward-banner,.eb-app[data-shape="sharp"] .eb-billrow,.eb-app[data-shape="sharp"] .eb-tablecard,.eb-app[data-shape="sharp"] .eb-ticket,.eb-app[data-shape="sharp"] .eb-panel,.eb-app[data-shape="sharp"] .eb-stat,.eb-app[data-shape="sharp"] .eb-mrow,.eb-app[data-shape="sharp"] .eb-preview,.eb-app[data-shape="sharp"] .eb-thumb,.eb-app[data-shape="sharp"] .eb-gthumb,.eb-app[data-shape="sharp"] .eb-toast,.eb-app[data-shape="sharp"] .eb-modal,.eb-app[data-shape="sharp"] .eb-themecard{border-radius:6px;}
.eb-app[data-shape="sharp"] .eb-phone{border-radius:16px;}
.eb-app[data-shape="sharp"] .eb-btn,.eb-app[data-shape="sharp"] .eb-add,.eb-app[data-shape="sharp"] .eb-chip,.eb-app[data-shape="sharp"] .eb-qty,.eb-app[data-shape="sharp"] .eb-cat-pill,.eb-app[data-shape="sharp"] .eb-fpill,.eb-app[data-shape="sharp"] .eb-status,.eb-app[data-shape="sharp"] .eb-pp{border-radius:5px;}
.eb-app[data-shape="arch"] .eb-logo{border-radius:50% 50% 6px 6px;}
.eb-app[data-shape="arch"] .eb-stampcard,.eb-app[data-shape="arch"] .eb-reward-banner,.eb-app[data-shape="arch"] .eb-tablecard,.eb-app[data-shape="arch"] .eb-ticket,.eb-app[data-shape="arch"] .eb-panel,.eb-app[data-shape="arch"] .eb-stat,.eb-app[data-shape="arch"] .eb-modal,.eb-app[data-shape="arch"] .eb-themecard{border-radius:26px 26px 16px 16px;}
.eb-app[data-shape="arch"] .eb-phone{border-radius:50px 50px 34px 34px;}
.eb-app[data-shape="arch"] .eb-btn,.eb-app[data-shape="arch"] .eb-add,.eb-app[data-shape="arch"] .eb-chip,.eb-app[data-shape="arch"] .eb-qty,.eb-app[data-shape="arch"] .eb-cat-pill,.eb-app[data-shape="arch"] .eb-fpill,.eb-app[data-shape="arch"] .eb-status,.eb-app[data-shape="arch"] .eb-pp,.eb-app[data-shape="arch"] .eb-lang{border-radius:999px;}
.eb-app[data-shape="arch"] .eb-thumb,.eb-app[data-shape="arch"] .eb-preview,.eb-app[data-shape="arch"] .eb-gthumb{border-radius:50% 50% 10px 10px;}
.eb-app[data-shape="arch"] .eb-billrow,.eb-app[data-shape="arch"] .eb-mrow{border-radius:20px;}
.eb-app[data-shape="pill"] .eb-logo{border-radius:50%;}
.eb-app[data-shape="pill"] .eb-stampcard,.eb-app[data-shape="pill"] .eb-reward-banner,.eb-app[data-shape="pill"] .eb-billrow,.eb-app[data-shape="pill"] .eb-tablecard,.eb-app[data-shape="pill"] .eb-ticket,.eb-app[data-shape="pill"] .eb-panel,.eb-app[data-shape="pill"] .eb-stat,.eb-app[data-shape="pill"] .eb-mrow,.eb-app[data-shape="pill"] .eb-modal,.eb-app[data-shape="pill"] .eb-themecard{border-radius:26px;}
.eb-app[data-shape="pill"] .eb-phone{border-radius:46px;}
.eb-app[data-shape="pill"] .eb-btn,.eb-app[data-shape="pill"] .eb-add,.eb-app[data-shape="pill"] .eb-chip,.eb-app[data-shape="pill"] .eb-qty,.eb-app[data-shape="pill"] .eb-cat-pill,.eb-app[data-shape="pill"] .eb-fpill,.eb-app[data-shape="pill"] .eb-status,.eb-app[data-shape="pill"] .eb-pp,.eb-app[data-shape="pill"] .eb-lang{border-radius:999px;}
.eb-app[data-shape="pill"] .eb-thumb,.eb-app[data-shape="pill"] .eb-preview,.eb-app[data-shape="pill"] .eb-gthumb{border-radius:22px;}
`;

// ── App (kök bileşen) ───────────────────────────────────────────────────────
export default function App() {
  const [orders,      setOrdersRaw]   = useState([]);
  const ordersRef = useRef([]);
  const setOrders = (u) => setOrdersRaw((p) => { const n = typeof u === "function" ? u(p) : u; ordersRef.current = n; return n; });

  const [payments,    setPaymentsRaw] = useState({});
  const paymentsRef = useRef({});
  const setPayments = (u) => setPaymentsRaw((p) => { const n = typeof u === "function" ? u(p) : u; paymentsRef.current = n; return n; });

  const [customers,   setCustomers]   = useState({});
  const [menu,        setMenu]        = useState(DEFAULT_MENU);
  const [slides,      setSlides]      = useState(DEFAULT_SLIDES);
  const [lang,        setLang]        = useState("en");
  const [themeId,     setThemeId]     = useState("hearth");
  const [currency,    setCurrency]    = useState(DEFAULT_CURRENCY);
  const [loaded,      setLoaded]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const [staffAuthed, setStaffAuthed] = useState(false);

  const isStaffRoute = useMemo(() => {
    try { const p = new URLSearchParams(window.location.search); return p.has("staff") || p.has("admin"); } catch { return false; }
  }, []);

  useEffect(() => {
    (async () => {
      setOrders(await loadJSON(K_ORDERS, []));
      setCustomers(await loadJSON(K_CUSTOMERS, {}));
      setMenu(await loadJSON(K_MENU, DEFAULT_MENU));
      setSlides(await loadJSON(K_SLIDES, DEFAULT_SLIDES));
      setPayments(await loadJSON(K_PAYMENTS, {}));
      setLang(await loadJSON(K_LANG, "en"));
      setThemeId(await loadJSON(K_THEME, "hearth"));
      setCurrency(await loadJSON(K_CURRENCY, DEFAULT_CURRENCY));
      setStaffAuthed(await loadJSON(K_STAFF, false) === true);
      setLoaded(true);
    })();
  }, []);

  // Akıllı merge: eski/echo realtime güncellemesinin paid/status'ü geri almasını önle
  const STATUS_RANK = { new: 0, preparing: 1, served: 2 };
  const mergeOrders = (incoming) => {
    if (!incoming || incoming.length === 0) return [];
    const cur = ordersRef.current || [];
    const curById = Object.fromEntries(cur.map((o) => [o.id, o]));
    const inById  = Object.fromEntries(incoming.map((o) => [o.id, o]));
    const allIds  = Array.from(new Set([...cur.map((o) => o.id), ...incoming.map((o) => o.id)]));
    return allIds.map((id) => {
      const a = curById[id], b = inById[id];
      if (a && !b) return a;
      if (!a && b) return b;
      const puSum = (o) => Object.values(o.paidUnits || {}).reduce((s, n) => s + n, 0);
      return {
        ...b,
        paid:      a.paid || b.paid,
        paidUnits: puSum(a) >= puSum(b) ? (a.paidUnits || {}) : (b.paidUnits || {}),
        status:    (STATUS_RANK[a.status] ?? 0) >= (STATUS_RANK[b.status] ?? 0) ? a.status : b.status,
        paidAt:    a.paidAt || b.paidAt,
      };
    }).sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
  };

  const applyingRemote = useRef(false);
  const lastSentJSON   = useRef({});

  useEffect(() => {
    const unsub = subscribeShared((key, value) => {
      if (lastSentJSON.current[key] === JSON.stringify(value)) return; // echo
      applyingRemote.current = true;
      if (key === K_ORDERS)    setOrders(mergeOrders(value || []));
      else if (key === K_CUSTOMERS) setCustomers(value || {});
      else if (key === K_MENU)      setMenu(value || DEFAULT_MENU);
      else if (key === K_SLIDES)    setSlides(value || DEFAULT_SLIDES);
      else if (key === K_PAYMENTS)  setPayments(value || {});
      else if (key === K_THEME)     setThemeId(value || "hearth");
      else if (key === K_CURRENCY)  setCurrency(value || DEFAULT_CURRENCY);
      setTimeout(() => { applyingRemote.current = false; }, 0);
    });
    return unsub;
  }, []); // eslint-disable-line

  const persist = (key, value) => {
    lastSentJSON.current[key] = JSON.stringify(value);
    saveJSON(key, value);
  };

  useEffect(() => { if (loaded && !applyingRemote.current) persist(K_ORDERS,    orders);    }, [orders,    loaded]); // eslint-disable-line
  useEffect(() => { if (loaded && !applyingRemote.current) persist(K_CUSTOMERS,  customers); }, [customers, loaded]); // eslint-disable-line
  useEffect(() => { if (loaded && !applyingRemote.current) persist(K_MENU,       menu);      }, [menu,      loaded]); // eslint-disable-line
  useEffect(() => { if (loaded && !applyingRemote.current) persist(K_SLIDES,     slides);    }, [slides,    loaded]); // eslint-disable-line
  useEffect(() => { if (loaded && !applyingRemote.current) persist(K_PAYMENTS,   payments);  }, [payments,  loaded]); // eslint-disable-line
  useEffect(() => { if (loaded) saveJSON(K_LANG,  lang);        }, [lang,  loaded]); // eslint-disable-line
  useEffect(() => { if (loaded && isStaffRoute && !applyingRemote.current) persist(K_THEME,    themeId);  }, [themeId,  loaded, isStaffRoute]); // eslint-disable-line
  useEffect(() => { if (loaded && isStaffRoute && !applyingRemote.current) persist(K_CURRENCY, currency); }, [currency, loaded, isStaffRoute]); // eslint-disable-line
  useEffect(() => { if (loaded) saveJSON(K_STAFF, staffAuthed); }, [staffAuthed, loaded]); // eslint-disable-line

  const t          = useMemo(() => makeT(lang), [lang]);
  const dir        = useMemo(() => (LANGS.find((l) => l.code === lang)?.dir || "ltr"), [lang]);
  const theme      = useMemo(() => THEMES.find((th) => th.id === themeId) || THEMES[0], [themeId]);
  const themeStyle = useMemo(() => Object.fromEntries(Object.entries(theme.vars).map(([k, v]) => ["--" + k, v])), [theme]);

  const flash = useCallback((msg) => {
    setToast(msg);
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const resetDemo = () => { setOrders([]); setCustomers({}); setMenu(DEFAULT_MENU); setSlides(DEFAULT_SLIDES); flash(t("t_reset")); };
  const goCustomer = () => { try { window.location.href = window.location.pathname; } catch {} };
  const signOutStaff = () => { setStaffAuthed(false); goCustomer(); };

  if (!loaded) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FBF6EC" }}>
      <div style={{ textAlign: "center", fontFamily: "Georgia,serif", color: "#3b5142" }}>
        <div style={{ fontSize: 48 }}>☕</div><div style={{ marginTop: 12, opacity: .7 }}>Hazırlanıyor…</div>
      </div>
    </div>
  );

  return (
    <LangCtx.Provider value={{ lang, setLang, dir, t }}>
      <ThemeCtx.Provider value={{ themeId, setThemeId }}>
        <CurrencyCtx.Provider value={{ currency, setCurrency }}>
          <div className="eb-app" dir={dir} data-shape={theme.shape} style={themeStyle}>
            <style>{CSS}</style>
            {!isStaffRoute ? (
              <CustomerApp orders={orders} setOrders={setOrders} customers={customers} setCustomers={setCustomers}
                menu={menu} slides={slides} payments={payments} setPayments={setPayments}
                ordersRef={ordersRef} paymentsRef={paymentsRef} flash={flash} />
            ) : staffAuthed ? (
              <AdminApp orders={orders} setOrders={setOrders} customers={customers} setCustomers={setCustomers}
                menu={menu} setMenu={setMenu} slides={slides} setSlides={setSlides}
                payments={payments} setPayments={setPayments} flash={flash}
                resetDemo={resetDemo} onSignOut={signOutStaff} />
            ) : (
              <StaffLogin onSuccess={() => setStaffAuthed(true)} onBack={goCustomer} />
            )}
            {toast && <div className="eb-toast">🔔 {toast}</div>}
          </div>
        </CurrencyCtx.Provider>
      </ThemeCtx.Provider>
    </LangCtx.Provider>
  );
}

// ── CustomerApp ─────────────────────────────────────────────────────────────
function CustomerApp({ orders, setOrders, customers, setCustomers, menu, slides, payments, setPayments, ordersRef, paymentsRef, flash }) {
  const { t, lang } = useT();
  const money = useMoney();
  const [screen,  setScreen]  = useState("scan");
  const [menuCat, setMenuCat] = useState(null);
  const [table,   setTable]   = useState(null);
  const [cart,    setCart]    = useState({});
  const [user,    setUser]    = useState(null);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [useReward,   setUseReward]   = useState(false);
  const [redeemCode,  setRedeemCode]  = useState(null);
  const [newCoupon,   setNewCoupon]   = useState(null);

  const itemsById     = useMemo(() => Object.fromEntries(menu.map((i) => [i.id, i])), [menu]);
  const record        = user ? customers[user] : null;
  const stamps        = record ? record.stamps : 0;
  const myCoupons     = (record && Array.isArray(record.coupons)) ? record.coupons : [];
  const activeCoupons = myCoupons.filter((c) => !c.used);
  const hasReward     = activeCoupons.length > 0;

  const cartList  = Object.entries(cart).map(([id, v]) => (itemsById[id] ? { ...itemsById[id], ...v } : null)).filter(Boolean);
  const cartCount = cartList.reduce((s, i) => s + i.qty, 0);
  const rewardItem = useReward && hasReward ? cartList.filter((i) => REWARD_ITEMS.includes(i.id)).sort((a, b) => a.price - b.price)[0] : null;
  const subtotal  = cartList.reduce((s, i) => s + i.price * i.qty, 0);
  const discount  = rewardItem ? rewardItem.price : 0;
  const total     = Math.max(0, subtotal - discount);

  useEffect(() => {
    if (useReward && hasReward && !redeemCode) setRedeemCode(activeCoupons[0].code);
    if (!useReward && redeemCode) setRedeemCode(null);
  }, [useReward, hasReward]); // eslint-disable-line

  const add     = (id) => { setCart((c) => ({ ...c, [id]: { qty: (c[id]?.qty || 0) + 1, note: c[id]?.note || "" } })); flash(t("t_added", { name: itemsById[id]?.name })); };
  const dec     = (id) => setCart((c) => { const q = (c[id]?.qty || 0) - 1; if (q <= 0) { const n = { ...c }; delete n[id]; return n; } return { ...c, [id]: { ...c[id], qty: q } }; });
  const setNote = (id, note) => setCart((c) => ({ ...c, [id]: { ...c[id], note } }));

  // Session filter: 8 dakika önceden ödenmişleri gizle
  const SESSION_MS     = 8 * 60 * 1000;
  const allTableOrders = orders.filter((o) => o.table === table);
  const sessionFresh   = (o) => !o.paid || (o.paidAt && (Date.now() - new Date(o.paidAt).getTime()) < SESSION_MS);
  const tableOrders    = allTableOrders.filter(sessionFresh);
  const tablePayments  = (payments && payments[table]) || [];

  const orderPaidValue = (o) => {
    if (o.paidUnits && Object.keys(o.paidUnits).length)
      return o.items.reduce((s, it, i) => s + it.price * Math.min(it.qty, o.paidUnits[i] || 0), 0);
    return o.paid ? o.total : 0;
  };
  const tableGrand    = tableOrders.reduce((s, o) => s + o.total, 0);
  const paidViaItems  = tableOrders.reduce((s, o) => s + orderPaidValue(o), 0);
  const paidViaPartial = tablePayments.filter((p) => p.kind !== "items").reduce((s, p) => s + (p.amount || 0), 0);
  const tableDue      = Math.max(0, tableGrand - paidViaItems - paidViaPartial);
  const myUnpaid      = tableOrders.filter((o) => !o.paid && user && o.customerEmail === user).reduce((s, o) => s + o.total, 0);

  const placeOrder = (orderNote) => {
    const id = "#" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const order = {
      id, table,
      items: cartList.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, note: i.note || "" })),
      orderNote: orderNote || "", customerEmail: user || null, customerName: record ? record.name : null,
      rewardUsed: !!rewardItem, couponCode: rewardItem ? (redeemCode || null) : null,
      status: "new", paid: false, paidAt: null, billRequested: false,
      createdAt: new Date().toISOString(), subtotal, discount, total,
    };
    setOrders((o) => [order, ...o]);
    let mintedCoupon = null;
    if (user) {
      setCustomers((cs) => {
        const r = cs[user] || { email: user, name: record?.name || "", orders: 0, stamps: 0, totalSpent: 0, joinedAt: new Date().toISOString(), coupons: [] };
        const coupons = Array.isArray(r.coupons) ? [...r.coupons] : [];
        if (rewardItem && redeemCode) {
          const idx = coupons.findIndex((c) => c.code === redeemCode && !c.used);
          if (idx >= 0) coupons[idx] = { ...coupons[idx], used: true, usedAt: new Date().toISOString() };
        }
        let newStamps = r.stamps + 1;
        if (newStamps >= REWARD_THRESHOLD) {
          newStamps -= REWARD_THRESHOLD;
          const code = "HB-" + Math.random().toString(36).slice(2, 6).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();
          mintedCoupon = { code, reward: "donut", issuedAt: new Date().toISOString(), used: false, usedAt: null };
          coupons.push(mintedCoupon);
        }
        return { ...cs, [user]: { ...r, orders: r.orders + 1, stamps: newStamps, totalSpent: r.totalSpent + total, coupons } };
      });
    }
    setLastOrderId(id); setCart({}); setUseReward(false); setRedeemCode(null);
    if (mintedCoupon) { setNewCoupon(mintedCoupon); setScreen("reward"); } else setScreen("placed");
  };

  const requestBill = () => {
    setOrders((os) => os.map((o) => (o.table === table && !o.paid ? { ...o, billRequested: true } : o)));
    flash(t("t_server_notified", { n: table }));
  };

  const reorder = (order) => {
    let added = 0;
    order.items.forEach((it) => {
      const m = itemsById[it.id];
      if (m && m.available) { setCart((c) => ({ ...c, [it.id]: { qty: (c[it.id]?.qty || 0) + it.qty, note: c[it.id]?.note || "" } })); added++; }
    });
    if (added) { flash(t("t_to_basket")); setScreen("cart"); } else flash(t("t_unavailable"));
  };

  // Ref tabanlı ödeme (stale state sorunu yok)
  const recordPayment = ({ amount = 0, tip = 0, coversOrderIds = null, paidUnits = null }) => {
    const freshOrders  = ordersRef.current;
    const freshPm      = paymentsRef.current;
    const to           = freshOrders.filter((o) => o.table === table);
    const list         = (freshPm && freshPm[table]) || [];
    const opv          = (o) => (o.paidUnits && Object.keys(o.paidUnits).length) ? o.items.reduce((s, it, i) => s + it.price * Math.min(it.qty, o.paidUnits[i] || 0), 0) : (o.paid ? o.total : 0);
    const grand        = to.reduce((s, o) => s + o.total, 0);
    const paidItems    = to.reduce((s, o) => s + opv(o), 0);
    const paidPartial  = list.filter((p) => p.kind !== "items").reduce((s, p) => s + (p.amount || 0), 0);
    const dueNow100    = Math.round(Math.max(0, grand - paidItems - paidPartial) * 100);

    let pay100 = 0;
    if (coversOrderIds?.length)                   pay100 = to.filter((o) => coversOrderIds.includes(o.id) && !o.paid).reduce((s, o) => s + Math.round(o.total * 100), 0);
    else if (paidUnits && Object.keys(paidUnits).length) to.forEach((o) => { const sel = paidUnits[o.id]; if (sel) Object.entries(sel).forEach(([idx, cnt]) => { const it = o.items[idx]; if (it) pay100 += Math.round(it.price * 100) * cnt; }); });
    else                                           pay100 = Math.round((amount || 0) * 100);

    const coversAll = pay100 >= dueNow100 - 1;

    if (coversAll) {
      setOrders((os) => os.map((o) => (o.table === table && !o.paid ? { ...o, paid: true, paidAt: new Date().toISOString(), billRequested: false, paidUnits: {} } : o)));
      const priorTip = list.reduce((s, p) => s + (p.tip || 0), 0) + (tip || 0);
      setPayments((pm) => ({ ...pm, [table]: priorTip > 0 ? [{ amount: 0, tip: priorTip, who: user || null, at: new Date().toISOString(), kind: "settled" }] : [] }));
    } else if (paidUnits && Object.keys(paidUnits).length) {
      setOrders((os) => os.map((o) => {
        const sel = paidUnits[o.id]; if (!sel) return o;
        const pu = { ...(o.paidUnits || {}) };
        Object.entries(sel).forEach(([idx, cnt]) => { pu[idx] = (pu[idx] || 0) + cnt; });
        const allPaid = o.items.every((it, i) => (pu[i] || 0) >= it.qty);
        return { ...o, paidUnits: pu, paid: allPaid ? true : o.paid, paidAt: allPaid ? new Date().toISOString() : o.paidAt, billRequested: allPaid ? false : o.billRequested };
      }));
      if ((tip || 0) > 0) setPayments((pm) => { const l = (pm && pm[table]) || []; return { ...pm, [table]: [...l, { amount: 0, tip: tip || 0, who: user || null, at: new Date().toISOString(), kind: "tip" }] }; });
    } else if (coversOrderIds?.length) {
      setOrders((os) => os.map((o) => (coversOrderIds.includes(o.id) ? { ...o, paid: true, paidAt: new Date().toISOString(), billRequested: false } : o)));
      if ((tip || 0) > 0) setPayments((pm) => { const l = (pm && pm[table]) || []; return { ...pm, [table]: [...l, { amount: 0, tip: tip || 0, who: user || null, at: new Date().toISOString(), kind: "tip" }] }; });
    } else {
      setPayments((pm) => { const l = (pm && pm[table]) || []; return { ...pm, [table]: [...l, { amount: amount || 0, tip: tip || 0, who: user || null, at: new Date().toISOString(), kind: "partial" }] }; });
    }
    flash(t("payment_sent_d", { amt: money((amount || 0) + (tip || 0)), n: table }));
  };

  const signIn = (email, name) => {
    const key = email.trim().toLowerCase();
    setCustomers((cs) => cs[key] ? cs : { ...cs, [key]: { email: key, name: name || key.split("@")[0], orders: 0, stamps: 0, totalSpent: 0, joinedAt: new Date().toISOString(), coupons: [] } });
    setUser(key); flash(t("t_signed_in")); setScreen("home");
  };

  return (
    <div className="eb-stage">
      <div className="eb-phone">
        <div className="eb-phone-bar"><i /></div>
        {screen === "scan"    && <ScanScreen onDetect={(tb) => { setTable(tb); setScreen("home"); }} />}
        {screen === "home"    && <HomeScreen table={table} user={user} record={record} stamps={stamps} hasReward={hasReward} couponCount={activeCoupons.length} menu={menu} slides={slides} tableOrders={tableOrders} tableDue={tableDue} go={setScreen} goToCat={(c) => { setMenuCat(c); setScreen("menu"); }} rescan={() => setScreen("scan")} onBill={() => setScreen("bill")} cartCount={cartCount} />}
        {screen === "menu"    && <MenuScreen menu={menu} cart={cart} add={add} dec={dec} cartCount={cartCount} total={subtotal} back={() => setScreen("home")} toCart={() => setScreen("cart")} place={placeOrder} jumpCat={menuCat} clearJump={() => setMenuCat(null)} />}
        {screen === "cart"    && <CartScreen cartList={cartList} add={add} dec={dec} setNote={setNote} subtotal={subtotal} total={total} discount={discount} rewardItem={rewardItem} hasReward={hasReward} couponCount={activeCoupons.length} useReward={useReward} setUseReward={setUseReward} user={user} table={table} back={() => setScreen("menu")} place={placeOrder} toAuth={() => setScreen("auth")} />}
        {screen === "bill"    && <BillScreen table={table} orders={tableOrders} due={tableDue} requestBill={requestBill} back={() => setScreen("home")} toMenu={() => setScreen("menu")} toPay={() => setScreen("pay")} />}
        {screen === "pay"     && <PayScreen table={table} due={tableDue} myUnpaid={myUnpaid} unpaidOrders={tableOrders.filter((o) => !o.paid)} user={user} recordPayment={recordPayment} back={() => setScreen("bill")} done={() => setScreen("bill")} />}
        {screen === "placed"  && <PlacedScreen order={orders.find((o) => o.id === lastOrderId)} table={table} user={user} stamps={stamps} hasReward={hasReward} backToMenu={() => setScreen("menu")} toAccount={() => setScreen("account")} toAuth={() => setScreen("auth")} toBill={() => setScreen("bill")} />}
        {screen === "reward"  && <RewardScreen coupon={newCoupon} backToMenu={() => { setNewCoupon(null); setScreen("menu"); }} toAccount={() => { setNewCoupon(null); setScreen("account"); }} toBill={() => { setNewCoupon(null); setScreen("bill"); }} />}
        {screen === "auth"    && <AuthScreen onSignIn={signIn} back={() => setScreen(cartCount ? "cart" : "home")} />}
        {screen === "account" && <AccountScreen user={user} record={record} stamps={stamps} hasReward={hasReward} coupons={myCoupons} orders={orders.filter((o) => o.customerEmail === user)} reorder={reorder} back={() => setScreen("home")} signOut={() => { setUser(null); setScreen("home"); }} toAuth={() => setScreen("auth")} />}
      </div>
    </div>
  );
}

// ── ScanScreen ──────────────────────────────────────────────────────────────
function ScanScreen({ onDetect }) {
  const { t } = useT();
  const [detected, setDetected] = useState(null);
  const detect = (n) => { setDetected(n); setTimeout(() => onDetect(n), 700); };
  return (
    <div className="eb-screen eb-scan">
      <div className="eb-scan-top"><LangPicker /></div>
      <p style={{ fontWeight: 600, fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>{t("scan_title")}</p>
      <div className={`eb-cam ${detected ? "found" : ""}`}>
        {detected ? (
          <div className="eb-detected" style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 40 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginTop: 8 }}>{t("scan_found")}</div>
            <div style={{ fontSize: 13, opacity: .8 }}>{t("table_n", { n: detected })}</div>
          </div>
        ) : (
          <div className="frame"><div className="c1" /><div className="c2" /><div className="c3" /><div className="c4" /><div className="laser" /></div>
        )}
      </div>
      <p style={{ color: "var(--ink-soft)", fontSize: 13, maxWidth: 280, margin: "12px auto" }}>{t("scan_blurb")}</p>
      <div className="eb-demobox">
        <div className="h">🎛 {t("demo_control")}</div>
        <p>{t("demo_blurb")}</p>
        <div className="eb-stickers">
          {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((n) => (
            <button key={n} className={`eb-sticker ${detected === n ? "on" : ""}`} onClick={() => detect(n)}>{n}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Carousel ────────────────────────────────────────────────────────────────
function Carousel({ slides }) {
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);
  const items = slides.length ? slides : DEFAULT_SLIDES;
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const handler = () => { const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== idx) setIdx(i); };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [idx]);
  return (
    <div className="eb-carousel" style={{ position: "relative" }}>
      <div className="eb-track" ref={ref}>
        {items.map((s) => (
          <div key={s.id} className="eb-slide">
            {s.img ? <img src={s.img} alt={s.cap || ""} loading="eager" /> : <div className="fb" style={{ background: s.grad || SLIDE_GRADS[0] }}>{s.emoji}</div>}
            <div className="scrim" /><div className="cap">{s.cap}</div>
          </div>
        ))}
      </div>
      <div className="eb-dots">{items.map((s, i) => <i key={s.id} className={i === idx ? "on" : ""} />)}</div>
      <div className="eb-overhero">
        <div className="eb-logo"><span className="eb-monogram">H<i>&</i>B</span></div>
        <LangPicker dark />
      </div>
    </div>
  );
}

// ── HomeScreen ──────────────────────────────────────────────────────────────
function HomeScreen({ table, user, record, stamps, hasReward, couponCount, menu, slides, tableOrders, tableDue, go, goToCat, rescan, onBill, cartCount }) {
  const { t } = useT();
  const money = useMoney();
  const activeOrders = tableOrders.filter((o) => o.status !== "served" && !o.paid);
  const cats = useMemo(() => CATS.filter((c) => menu.some((m) => m.cat === c.key && m.available)), [menu]);
  return (
    <div className="eb-screen">
      <Carousel slides={slides} />
      <div className="eb-namecard eb-pad">
        <h1 className="eb-serif">{t("whats_on")}</h1>
        <p>{t("tagline")}</p>
        {table && <div style={{ marginTop: 8, fontSize: 13, color: "var(--ink-soft)" }}>
          {t("table_n", { n: table })} · <button className="eb-link" style={{ fontSize: 13 }} onClick={rescan}>{t("not_your_table")}</button>
        </div>}
      </div>
      {cartCount > 0 && (
        <div className="eb-pad" style={{ marginTop: 4 }}>
          <button className="eb-btn honey" onClick={() => go("cart")} style={{ marginBottom: 8 }}>{t("view_basket")} · {cartCount} {cartCount === 1 ? t("item") : t("items")}</button>
        </div>
      )}
      {/* Stamp card */}
      {user ? (
        <div className="eb-pad" style={{ marginTop: 10 }}>
          <div className="eb-stampcard">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div><strong>{t("bean_club")}</strong> <span style={{ color: "var(--ink-soft)", fontSize: 13 }}>· {record?.name}</span></div>
              <button className="eb-link" style={{ fontSize: 13 }} onClick={() => go("account")}>{t("account")}</button>
            </div>
            <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: "4px 0 0" }}>{t("stamps_progress", { n: stamps, max: REWARD_THRESHOLD })}</p>
            <div className="eb-stamps">
              {Array.from({ length: REWARD_THRESHOLD }, (_, i) => <div key={i} className={`eb-stamp ${i < stamps ? "on" : ""}`}>⭐</div>)}
            </div>
            {hasReward && (
              <div className="eb-reward-banner" style={{ marginTop: 12 }}>
                <span style={{ fontSize: 28 }}>🎁</span>
                <div><strong>{t("reward_ready_t")}</strong><br /><span style={{ fontSize: 12, opacity: .9 }}>{t("reward_ready_b")}</span></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="eb-pad" style={{ marginTop: 10 }}>
          <div className="eb-stampcard">
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>{t("join_banner")}</div>
            <button className="eb-btn ghost" onClick={() => go("auth")} style={{ fontSize: 14 }}>☕ {t("join_free")}</button>
          </div>
        </div>
      )}
      {/* Category grid */}
      <div className="eb-pad" style={{ marginTop: 16 }}>
        <h2 className="eb-serif" style={{ fontSize: 22, marginBottom: 10 }}>{t("menu")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
          {cats.map((c) => {
            const img = CAT_IMG[c.key]; const tint = CAT_TINT[c.key] || "#eee";
            const title = t("cat_" + c.key); const sub = t("cat_" + c.key + "_b");
            return (
              <button key={c.key} className="eb-catcard" onClick={() => goToCat(c.key)}>
                <div className="eb-catcard-img" style={{ background: tint }}>
                  {img ? <SmartImg src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} fallback={<span style={{ fontSize: 48 }}>{CAT_EMOJI[c.key]}</span>} /> : <span style={{ fontSize: 48 }}>{CAT_EMOJI[c.key]}</span>}
                </div>
                <div className="eb-catcard-title">{title}</div>
                <div className="eb-catcard-sub">{sub}</div>
              </button>
            );
          })}
        </div>
      </div>
      {/* Table bill snippet */}
      {tableOrders.length > 0 && (
        <div className="eb-pad" style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{tableDue > 0 ? t("on_your_table", { amt: money(tableDue) }) : t("all_settled")}</span>
            <button className="eb-link" style={{ fontSize: 13 }} onClick={onBill}>{t("bill_title", { n: table })}</button>
          </div>
          {activeOrders.length > 0 && <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{activeOrders.length} {t("orders_word")} {t("in_kitchen")}</div>}
          <button className="eb-btn" style={{ marginTop: 10 }} onClick={onBill}>{t("pay_title")}</button>
        </div>
      )}
      <div style={{ height: 40 }} />
    </div>
  );
}

// ── MenuScreen ───────────────────────────────────────────────────────────────
function MenuScreen({ menu, cart, add, dec, cartCount, total, back, toCart, place, jumpCat, clearJump }) {
  const { t, lang } = useT();
  const money = useMoney();
  const [activeCat, setActiveCat] = useState(null);
  const available = menu.filter((i) => i.available !== false || i.available === undefined);
  const cats = CATS.filter((c) => menu.some((m) => m.cat === c.key));
  const first = cats[0]?.key;
  const cur = activeCat || first;

  useEffect(() => {
    if (jumpCat) { setActiveCat(jumpCat); clearJump && clearJump(); }
  }, [jumpCat]); // eslint-disable-line

  const shown = menu.filter((i) => i.cat === cur);
  const allergenLabel = (aList) => ALLERGENS.filter((a) => aList?.includes(a.id)).map((a) => lang === "tr" ? a.tr : a.en);

  return (
    <div className="eb-screen">
      <div style={{ position: "sticky", top: 0, background: "var(--paper)", zIndex: 10, borderBottom: "1px solid var(--line-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px 0" }}>
          <button onClick={back} style={{ fontSize: 22 }}>←</button>
          <h1 style={{ fontSize: 22, fontWeight: 600, flex: 1 }}>{t("menu")}</h1>
          {cartCount > 0 && <button className="eb-chip" onClick={toCart}>🛒 {cartCount}</button>}
        </div>
        <div className="eb-cats">
          {cats.map((c) => <button key={c.key} className={`eb-cat-pill ${cur === c.key ? "on" : ""}`} onClick={() => setActiveCat(c.key)}>{CAT_EMOJI[c.key]} {t("cat_" + c.key)}</button>)}
        </div>
      </div>
      <div className="eb-cat-head"><h2 className="eb-serif">{t("cat_" + cur)}</h2><span>{t("cat_" + cur + "_b")}</span></div>
      {shown.map((item) => {
        const qty = cart[item.id]?.qty || 0;
        const aLabels = allergenLabel(item.allergens);
        return (
          <div key={item.id} className={`eb-item ${item.available === false ? "out" : ""}`}>
            <div className="eb-thumb" style={{ background: CAT_TINT[item.cat] }}>
              {item.image ? <SmartImg src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} fallback={<span>{item.emoji}</span>} /> : <span>{item.emoji}</span>}
            </div>
            <div className="eb-item-body">
              <h3>{item.name}</h3>
              {item.desc && <p>{item.desc}</p>}
              {aLabels.length > 0 && (
                <div className="eb-allergens">
                  {aLabels.map((label, i) => {
                    const a = ALLERGENS.find((al) => (lang === "tr" ? al.tr : al.en) === label);
                    return <span key={i} className="eb-allergen-badge">{a?.emoji} {label}</span>;
                  })}
                </div>
              )}
              <div className="price">{money(item.price)}</div>
              {item.available === false && <div className="eb-soldout">{t("sold_out")}</div>}
            </div>
            {item.available !== false && (
              qty ? (
                <div className="eb-qty">
                  <button onClick={() => dec(item.id)}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => add(item.id)}>+</button>
                </div>
              ) : <button className="eb-add" onClick={() => add(item.id)}>+</button>
            )}
          </div>
        );
      })}
      {cartCount > 0 && (
        <div className="eb-bar">
          <button className="eb-btn honey" onClick={toCart}>{t("view_basket")} · {money(total)}</button>
        </div>
      )}
    </div>
  );
}

// ── CartScreen ───────────────────────────────────────────────────────────────
function CartScreen({ cartList, add, dec, setNote, subtotal, total, discount, rewardItem, hasReward, couponCount, useReward, setUseReward, user, table, back, place, toAuth }) {
  const { t } = useT();
  const money = useMoney();
  const [orderNote, setOrderNote] = useState("");
  if (!cartList.length) return (
    <div className="eb-screen">
      <div className="eb-pad" style={{ paddingTop: 30 }}>
        <button onClick={back} style={{ fontSize: 22, marginBottom: 20 }}>←</button>
        <div className="eb-empty"><div className="em">🛒</div><h3>{t("empty_basket_t")}</h3><p>{t("empty_basket_b")}</p></div>
        <button className="eb-btn" style={{ marginTop: 24 }} onClick={back}>{t("browse_menu")}</button>
      </div>
    </div>
  );
  return (
    <div className="eb-screen">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px" }}>
        <button onClick={back} style={{ fontSize: 22 }}>←</button>
        <h1 style={{ fontSize: 22, fontWeight: 600, flex: 1 }}>{t("your_basket")}</h1>
      </div>
      {table && <div style={{ padding: "0 22px 10px", fontSize: 13, color: "var(--ink-soft)" }}>📍 {t("delivering_to", { n: table })}</div>}
      <div className="eb-pad">
        {cartList.map((item) => (
          <div key={item.id} className="eb-cline">
            <div className="eb-thumb" style={{ width: 52, height: 52, background: CAT_TINT[item.cat] }}><span>{item.emoji}</span></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{money(item.price)}</div>
              <div style={{ marginTop: 6 }}>
                <div className="eb-qty" style={{ display: "inline-flex" }}>
                  <button onClick={() => dec(item.id)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => add(item.id)}>+</button>
                </div>
              </div>
              <input className="eb-note-in" placeholder={t("note_for_item", { name: item.name })} value={item.note || ""} onChange={(e) => setNote(item.id, e.target.value)} style={{ marginTop: 8 }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{money(item.price * item.qty)}</div>
          </div>
        ))}
        <textarea className="eb-note-in" placeholder={t("order_note_ph")} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} rows={2} style={{ marginTop: 4, width: "100%" }} />
        {(hasReward || couponCount > 0) && (
          <div style={{ marginTop: 14, background: "var(--line-2)", borderRadius: 13, padding: "12px 14px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={useReward} onChange={() => setUseReward(!useReward)} style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>🎁 {t("use_reward")}</span>
            </label>
            {useReward && rewardItem && <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "6px 0 0 28px" }}>{t("reward_free_item", { name: rewardItem.name })}</p>}
            {useReward && !rewardItem && <p style={{ fontSize: 12.5, color: "var(--berry)", margin: "6px 0 0 28px" }}>{t("reward_add_item")}</p>}
          </div>
        )}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--ink-soft)" }}><span>{t("subtotal")}</span><span>{money(subtotal)}</span></div>
          {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--berry)" }}><span>🎁 {t("club_reward")}</span><span>−{money(discount)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17, marginTop: 6, paddingTop: 10, borderTop: "1px solid var(--line-2)" }}><span>{t("total")}</span><span>{money(total)}</span></div>
        </div>
        {!user && <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "12px 0 0", textAlign: "center" }}>{t("guest_1")} <button className="eb-link" onClick={toAuth}>{t("sign_in")}</button> {t("guest_2")}</p>}
        <button className="eb-btn" style={{ marginTop: 18 }} onClick={() => place(orderNote)}>{t("send_order")}</button>
      </div>
    </div>
  );
}

// ── BillScreen ───────────────────────────────────────────────────────────────
function BillScreen({ table, orders, due, requestBill, back, toMenu, toPay }) {
  const { t } = useT();
  const money = useMoney();
  const allPaid = due <= 0 && orders.length > 0;
  const billRequested = orders.some((o) => o.billRequested);
  return (
    <div className="eb-screen">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px" }}>
        <button onClick={back} style={{ fontSize: 22 }}>←</button>
        <h1 style={{ fontSize: 22, fontWeight: 600, flex: 1 }}>{t("bill_title", { n: table })}</h1>
      </div>
      {orders.length === 0 ? (
        <div className="eb-pad"><div className="eb-empty"><div className="em">🧾</div><h3>{t("no_orders_yet")}</h3><p>{t("bill_builds")}</p></div></div>
      ) : (
        <div className="eb-pad">
          {orders.map((o) => (
            <div key={o.id} style={{ marginBottom: 14, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{o.id}</span>
                <span className={`eb-pp ${o.paid ? "paid" : "unpaid"}`}>{o.paid ? t("paid") : t("unpaid")}</span>
              </div>
              {o.items.map((it, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "2px 0", color: o.paid ? "var(--ink-soft)" : "var(--ink)" }}>
                  <span><span style={{ color: "var(--berry)", fontWeight: 700, marginRight: 6 }}>{it.qty}×</span>{it.name}</span>
                  <span>{money(it.price * it.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px dashed var(--line)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
                <span>{t("order_total")}</span><span>{money(o.total)}</span>
              </div>
            </div>
          ))}
          <div style={{ background: "var(--pine)", color: "var(--pine-ink)", borderRadius: 14, padding: "14px 16px", marginTop: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, opacity: .8 }}><span>{t("total_ordered")}</span><span>{money(orders.reduce((s, o) => s + o.total, 0))}</span></div>
            {due > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18, marginTop: 6 }}><span>{t("amount_due")}</span><span>{money(due)}</span></div>}
            {allPaid && <div style={{ fontWeight: 700, fontSize: 16, textAlign: "center", marginTop: 4 }}>✅ {t("all_settled_thanks")}</div>}
          </div>
          {!allPaid && (
            <button className="eb-btn honey" style={{ marginTop: 14 }} onClick={toPay}>{t("pay_title")}</button>
          )}
          {!allPaid && !billRequested && (
            <button className="eb-btn ghost" style={{ marginTop: 10 }} onClick={requestBill}>{t("ask_bill")}</button>
          )}
          {billRequested && (
            <div style={{ marginTop: 12, textAlign: "center", fontSize: 13.5, color: "var(--ink-soft)" }}>🔔 {t("server_notified")} — {t("someone_over", { n: table })}</div>
          )}
          <button className="eb-btn ghost" style={{ marginTop: 10 }} onClick={toMenu}>{t("view_menu")}</button>
        </div>
      )}
    </div>
  );
}

// ── PayScreen ────────────────────────────────────────────────────────────────
function PayScreen({ table, due, myUnpaid, unpaidOrders, user, recordPayment, back, done }) {
  const { t } = useT();
  const money = useMoney();
  const [stage,    setStage]    = useState("choose");
  const [split,    setSplit]    = useState(null);
  const [people,   setPeople]   = useState(2);
  const [custom,   setCustom]   = useState("");
  const [tip,      setTip]      = useState(0);
  const [tipCustom,setTipCustom]= useState("");
  const [selOrderIds, setSelOrderIds] = useState([]);
  const [selUnits, setSelUnits]      = useState({});
  const [sent, setSent] = useState(false);

  if (due <= 0 && !sent) return (
    <div className="eb-screen eb-pad" style={{ paddingTop: 30 }}>
      <button onClick={back} style={{ fontSize: 22, marginBottom: 20 }}>←</button>
      <div className="eb-empty"><div className="em">✅</div><h3>{t("nothing_to_pay")}</h3></div>
      <button className="eb-btn" style={{ marginTop: 20 }} onClick={done}>{t("view_bill")}</button>
    </div>
  );

  if (sent) return (
    <div className="eb-screen eb-pad" style={{ paddingTop: 40, textAlign: "center" }}>
      <div style={{ fontSize: 64 }}>💳</div>
      <h2 className="eb-serif" style={{ fontSize: 26, margin: "16px 0 8px" }}>{t("payment_sent")}</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>{t("pay_at_register_note")}</p>
      <button className="eb-btn" style={{ marginTop: 28 }} onClick={done}>{t("view_bill")}</button>
    </div>
  );

  const tipOptions = [0, 0.10, 0.15, 0.20, "custom"];
  const baseForTip = split === "even" ? (due / people) : split === "custom" ? (parseFloat(custom) || 0) : split === "mine" ? myUnpaid : split === "items" ? (selOrderIds.reduce((s, id) => { const o = unpaidOrders.find((x) => x.id === id); return s + (o ? o.total : 0); }, 0)) : split === "pick-items" ? (Object.entries(selUnits).reduce((s, [oid, umap]) => { const o = unpaidOrders.find((x) => x.id === oid); if (!o) return s; return s + Object.entries(umap).reduce((ss, [idx, cnt]) => { const it = o.items[idx]; return ss + (it ? it.price * cnt : 0); }, 0); }, 0)) : due;
  const tipAmt = tip === "custom" ? (parseFloat(tipCustom) || 0) : typeof tip === "number" ? Math.round(baseForTip * tip * 100) / 100 : 0;
  const toPay  = baseForTip + tipAmt;

  const sendPayment = () => {
    if (split === "items")      recordPayment({ amount: baseForTip, tip: tipAmt, coversOrderIds: selOrderIds });
    else if (split === "pick-items") recordPayment({ amount: baseForTip, tip: tipAmt, paidUnits: selUnits });
    else                        recordPayment({ amount: baseForTip, tip: tipAmt });
    setSent(true);
  };

  const SPLITS = [
    { key: "whole",      label: t("split_whole"),      desc: t("split_whole_d"),      amt: due        },
    { key: "mine",       label: t("split_mine"),       desc: t("split_mine_d"),       amt: myUnpaid, hidden: !user || myUnpaid <= 0 },
    { key: "even",       label: t("split_even"),       desc: t("split_even_d"),       amt: null       },
    { key: "custom",     label: t("split_custom"),     desc: t("split_custom_d"),     amt: null       },
    { key: "items",      label: t("split_items"),      desc: t("split_items_d"),      amt: null       },
    { key: "pick-items", label: "🧾 Pick-a-line",      desc: t("split_items_d"),      amt: null       },
  ].filter((s) => !s.hidden);

  if (stage === "choose") return (
    <div className="eb-screen">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px" }}>
        <button onClick={back} style={{ fontSize: 22 }}>←</button>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>{t("pay_title")}</h1>
      </div>
      <div className="eb-pad">
        <p style={{ color: "var(--ink-soft)", fontSize: 14, marginBottom: 14 }}>{t("choose_split")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SPLITS.map((s) => (
            <button key={s.key} className="eb-billrow" onClick={() => { setSplit(s.key); setStage(s.key === "even" ? "even" : s.key === "custom" ? "amount" : s.key === "items" ? "items" : s.key === "pick-items" ? "pickitems" : "tip"); }}>
              <div style={{ textAlign: "start" }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{s.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>{s.desc}</div>
              </div>
              {s.amt != null && <span style={{ fontWeight: 700, fontSize: 15 }}>{money(s.amt)}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (stage === "even") return (
    <div className="eb-screen eb-pad" style={{ paddingTop: 24 }}>
      <button onClick={() => setStage("choose")} style={{ fontSize: 22, marginBottom: 20 }}>←</button>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>{t("split_even")}</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "6px 0 20px" }}>{t("how_many_people")}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
        <button onClick={() => setPeople((p) => Math.max(2, p - 1))} style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--line-2)", fontSize: 22 }}>−</button>
        <span style={{ fontSize: 32, fontWeight: 700 }}>{people}</span>
        <button onClick={() => setPeople((p) => p + 1)} style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--line-2)", fontSize: 22 }}>+</button>
      </div>
      <div style={{ background: "var(--line-2)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{t("per_person")}</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{money(due / people)}</div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>{t("your_share")}</div>
      </div>
      <button className="eb-btn" onClick={() => setStage("tip")}>{t("continue_btn")}</button>
    </div>
  );

  if (stage === "amount") return (
    <div className="eb-screen eb-pad" style={{ paddingTop: 24 }}>
      <button onClick={() => setStage("choose")} style={{ fontSize: 22, marginBottom: 20 }}>←</button>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>{t("split_custom")}</h2>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "4px 0 16px" }}>{t("of_remaining", { amt: money(due) })}</p>
      <input className="eb-input" type="number" placeholder="0.00" value={custom} onChange={(e) => setCustom(e.target.value)} style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginBottom: 20 }} />
      <button className="eb-btn" disabled={!custom || parseFloat(custom) <= 0} onClick={() => setStage("tip")}>{t("continue_btn")}</button>
    </div>
  );

  if (stage === "items") return (
    <div className="eb-screen">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px" }}>
        <button onClick={() => setStage("choose")} style={{ fontSize: 22 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{t("pick_items_t")}</h1>
      </div>
      <div className="eb-pad">
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>{t("pick_items_b")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {unpaidOrders.map((o) => (
            <button key={o.id} className={`eb-pickrow ${selOrderIds.includes(o.id) ? "on" : ""}`} onClick={() => setSelOrderIds((ids) => ids.includes(o.id) ? ids.filter((x) => x !== o.id) : [...ids, o.id])}>
              <div className={`eb-pickbox ${selOrderIds.includes(o.id) ? "on" : ""}`}>{selOrderIds.includes(o.id) ? "✓" : ""}</div>
              <div style={{ flex: 1, textAlign: "start" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{o.id}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{o.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}</div>
              </div>
              <span style={{ fontWeight: 700 }}>{money(o.total)}</span>
            </button>
          ))}
        </div>
        {selOrderIds.length > 0 && <div style={{ marginTop: 14, fontWeight: 600, fontSize: 15 }}>{t("selected_total")}: {money(selOrderIds.reduce((s, id) => { const o = unpaidOrders.find((x) => x.id === id); return s + (o ? o.total : 0); }, 0))}</div>}
        <button className="eb-btn" style={{ marginTop: 18 }} disabled={!selOrderIds.length} onClick={() => setStage("tip")}>{selOrderIds.length ? `${t("pay_selected")} · ${money(selOrderIds.reduce((s, id) => { const o = unpaidOrders.find((x) => x.id === id); return s + (o ? o.total : 0); }, 0))}` : t("nothing_selected")}</button>
      </div>
    </div>
  );

  if (stage === "pickitems") return (
    <div className="eb-screen">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px" }}>
        <button onClick={() => setStage("choose")} style={{ fontSize: 22 }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{t("pick_items_t")}</h1>
      </div>
      <div className="eb-pad">
        {unpaidOrders.map((o) => (
          <div key={o.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: "var(--ink-soft)" }}>{o.id}</div>
            {o.items.map((it, idx) => {
              const sel = selUnits[o.id]?.[idx] || 0;
              const avail = it.qty - (o.paidUnits?.[idx] || 0);
              if (avail <= 0) return null;
              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, padding: "10px 0", borderBottom: "1px solid var(--line-2)" }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{it.name}</div><div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{money(it.price)} × {avail} available</div></div>
                  <div className="eb-qty" style={{ display: "inline-flex" }}>
                    <button onClick={() => setSelUnits((su) => { const cur = su[o.id]?.[idx] || 0; if (cur <= 0) return su; return { ...su, [o.id]: { ...(su[o.id] || {}), [idx]: cur - 1 } }; })}>−</button>
                    <span>{sel}</span>
                    <button onClick={() => setSelUnits((su) => { const cur = su[o.id]?.[idx] || 0; if (cur >= avail) return su; return { ...su, [o.id]: { ...(su[o.id] || {}), [idx]: cur + 1 } }; })}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <button className="eb-btn" style={{ marginTop: 10 }} disabled={baseForTip <= 0} onClick={() => setStage("tip")}>{baseForTip > 0 ? `${t("pay_selected")} · ${money(baseForTip)}` : t("nothing_selected")}</button>
      </div>
    </div>
  );

  if (stage === "tip") return (
    <div className="eb-screen eb-pad" style={{ paddingTop: 24 }}>
      <button onClick={() => setStage("choose")} style={{ fontSize: 22, marginBottom: 20 }}>←</button>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>{t("add_tip")}</h2>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>{t("paying_amount")} {money(baseForTip)}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {tipOptions.map((o) => (
          <button key={o} onClick={() => setTip(o)} style={{ padding: "10px 16px", borderRadius: 12, border: `2px solid ${tip === o ? "var(--pine)" : "var(--line)"}`, background: tip === o ? "var(--pine)" : "var(--paper)", color: tip === o ? "var(--pine-ink)" : "var(--ink)", fontWeight: 600, fontSize: 14 }}>
            {o === "custom" ? t("tip_custom") : o === 0 ? t("tip_none") : `${Math.round(o * 100)}%`}
          </button>
        ))}
      </div>
      {tip === "custom" && <input className="eb-input" type="number" placeholder="0.00" value={tipCustom} onChange={(e) => setTipCustom(e.target.value)} style={{ marginBottom: 16 }} />}
      <div style={{ background: "var(--line-2)", borderRadius: 14, padding: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}><span>{t("subtotal_label")}</span><span>{money(baseForTip)}</span></div>
        {tipAmt > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6, color: "var(--pine)" }}><span>{t("tip_label")}</span><span>{money(tipAmt)}</span></div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18, paddingTop: 8, borderTop: "1px solid var(--line)" }}><span>{t("to_pay")}</span><span>{money(toPay)}</span></div>
      </div>
      <button className="eb-btn" onClick={() => setStage("confirm")}>{t("continue_btn")}</button>
    </div>
  );

  return (
    <div className="eb-screen eb-pad" style={{ paddingTop: 24 }}>
      <button onClick={() => setStage("tip")} style={{ fontSize: 22, marginBottom: 20 }}>←</button>
      <h2 style={{ fontSize: 22, fontWeight: 600 }}>{t("confirm_payment")}</h2>
      <div style={{ background: "var(--pine)", color: "var(--pine-ink)", borderRadius: 18, padding: 24, margin: "20px 0", textAlign: "center" }}>
        <div style={{ fontSize: 13, opacity: .8 }}>{t("to_pay")}</div>
        <div style={{ fontSize: 42, fontWeight: 700, margin: "8px 0" }}>{money(toPay)}</div>
        <div style={{ fontSize: 13, opacity: .8 }}>Table {table}</div>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", textAlign: "center", marginBottom: 20 }}>{t("pay_at_register_note")}</p>
      <button className="eb-btn honey" onClick={sendPayment}>{t("pay_now", { amt: money(toPay) })}</button>
    </div>
  );
}

// ── PlacedScreen ─────────────────────────────────────────────────────────────
function PlacedScreen({ order, table, user, stamps, hasReward, backToMenu, toAccount, toAuth, toBill }) {
  const { t } = useT();
  const money = useMoney();
  if (!order) return null;
  const steps = ["new", "preparing", "served"];
  const stepIdx = steps.indexOf(order.status);
  const stepLabels = [t("step_received"), t("step_preparing"), t("step_served")];
  const stepPills = [t("pill_new"), t("pill_preparing"), t("pill_served")];
  return (
    <div className="eb-screen eb-pad" style={{ paddingTop: 30 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <h2 className="eb-serif" style={{ fontSize: 28, margin: "12px 0 6px" }}>{t("order_sent")}</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>{t("getting_ready", { n: table })}</p>
        <span className="eb-chip" style={{ marginTop: 8 }}>{order.id}</span>
      </div>
      <div className="eb-steps">
        {steps.map((s, i) => (
          <div key={s} className={`eb-step ${i < stepIdx ? "done" : i === stepIdx ? "active" : ""}`}>
            <div className="dot">{i < stepIdx ? "✓" : i + 1}</div>
            <small>{stepLabels[i]}</small>
          </div>
        ))}
      </div>
      <div style={{ background: "var(--line-2)", borderRadius: 14, padding: 14, marginBottom: 18 }}>
        {order.items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "3px 0" }}>
            <span><span style={{ color: "var(--berry)", fontWeight: 700, marginRight: 6 }}>{it.qty}×</span>{it.name}</span>
            <span>{money(it.price * it.qty)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
          <span>{t("total")}</span><span>{money(order.total)}</span>
        </div>
      </div>
      {user ? (
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: 14, marginBottom: 16, textAlign: "center" }}>
          {hasReward ? (
            <><div style={{ fontSize: 14, fontWeight: 600 }}>🎁 {t("reward_unlocked")}</div><button className="eb-link" onClick={toAccount} style={{ fontSize: 13, marginTop: 6 }}>{t("view_account")}</button></>
          ) : (
            <><div style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>⭐ {t("stamp_earned")}</div><div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>{t("more_until", { n: REWARD_THRESHOLD - stamps })}</div></>
          )}
        </div>
      ) : (
        <div style={{ background: "var(--line-2)", borderRadius: 14, padding: 14, marginBottom: 16, textAlign: "center" }}>
          <div style={{ fontSize: 13.5 }}>{t("missed_stamp_t")}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 10px" }}>{t("missed_stamp_b")}</div>
          <button className="eb-btn" style={{ fontSize: 14 }} onClick={toAuth}>{t("join_club")}</button>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="eb-btn" onClick={backToMenu}>{t("order_more")}</button>
        <button className="eb-btn ghost" onClick={toBill}>{t("view_bill")}</button>
      </div>
    </div>
  );
}

// ── RewardScreen ──────────────────────────────────────────────────────────────
function RewardScreen({ coupon, backToMenu, toAccount, toBill }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const COLORS = ["#F2B8A2","#F6D96A","#B5EAD7","#FFB7C5","#C7CEEA","#FFDAC1"];
  const copy = () => { try { navigator.clipboard.writeText(coupon?.code || ""); } catch {} setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="eb-screen eb-pad eb-reward-screen" style={{ paddingTop: 36 }}>
      <div className="eb-confetti" aria-hidden>
        {Array.from({ length: 28 }, (_, i) => (
          <i key={i} style={{ left: `${Math.random() * 100}%`, background: COLORS[i % COLORS.length], width: `${8 + Math.random() * 8}px`, height: `${12 + Math.random() * 10}px`, borderRadius: Math.random() > 0.5 ? "50%" : "2px", animationDuration: `${1.2 + Math.random() * 1.8}s`, animationDelay: `${Math.random() * 0.8}s` }} />
        ))}
      </div>
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <div className="eb-reward-emoji">🎁</div>
        <h2 className="eb-serif" style={{ fontSize: 28, margin: "16px 0 6px" }}>{t("congrats_t")}</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, marginBottom: 20 }}>{t("congrats_b")}</p>
      </div>
      {coupon && (
        <div className="eb-coupon">
          <div className="eb-coupon-top">
            <div style={{ fontSize: 36 }}>🍩</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{t("free_donut")}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{t("coupon_sub")}</div>
            </div>
          </div>
          <div className="eb-coupon-perf" />
          <div className="eb-coupon-code">
            <span>{coupon.code}</span>
            <button className="eb-copybtn" onClick={copy}>{copied ? t("copied") : t("copy")}</button>
          </div>
        </div>
      )}
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center", margin: "16px 0 24px", lineHeight: 1.5 }}>{t("coupon_how")}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 2 }}>
        <button className="eb-btn" onClick={toAccount}>{t("see_my_coupons")}</button>
        <button className="eb-btn ghost" onClick={backToMenu}>{t("keep_ordering")}</button>
        <button className="eb-btn ghost" onClick={toBill}>{t("view_bill")}</button>
      </div>
    </div>
  );
}

// ── AuthScreen ────────────────────────────────────────────────────────────────
function AuthScreen({ onSignIn, back }) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const go = () => { if (!email.trim()) return; onSignIn(email, name); };
  return (
    <div className="eb-screen eb-pad" style={{ paddingTop: 30 }}>
      <button onClick={back} style={{ fontSize: 22, marginBottom: 20 }}>←</button>
      <h2 className="eb-serif" style={{ fontSize: 26, marginBottom: 6 }}>{t("bean_club")}</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 22 }}>{t("join_banner")}</p>
      <div style={{ marginBottom: 14 }}>
        <label className="eb-label">{t("your_name")}</label>
        <input className="eb-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="eb-label">{t("email")}</label>
        <input className="eb-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 18 }}>{t("email_consent")}</p>
      <button className="eb-btn" disabled={!email.trim()} onClick={go}>{t("create_account")}</button>
      <p style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center", marginTop: 14 }}>{t("already_member")}</p>
    </div>
  );
}

// ── AccountScreen ─────────────────────────────────────────────────────────────
function AccountScreen({ user, record, stamps, hasReward, coupons, orders, reorder, back, signOut, toAuth }) {
  const { t } = useT();
  const money = useMoney();
  if (!user || !record) return (
    <div className="eb-screen eb-pad" style={{ paddingTop: 30 }}>
      <button onClick={back} style={{ fontSize: 22, marginBottom: 20 }}>←</button>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>👤</div>
        <h3 style={{ margin: "12px 0 6px" }}>{t("not_signed_in")}</h3>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 20 }}>{t("join_to_track")}</p>
        <button className="eb-btn" onClick={toAuth}>{t("join_free")}</button>
      </div>
    </div>
  );
  const active = coupons.filter((c) => !c.used);
  return (
    <div className="eb-screen eb-pad" style={{ paddingTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <button onClick={back} style={{ fontSize: 22, marginRight: 12 }}>←</button>
        <h2 style={{ fontSize: 22, fontWeight: 600 }}>{t("account")}</h2>
      </div>
      <div style={{ background: "var(--pine)", color: "var(--pine-ink)", borderRadius: 18, padding: 20, marginBottom: 18, textAlign: "center" }}>
        <div style={{ fontSize: 36 }}>☕</div>
        <div style={{ fontWeight: 700, fontSize: 20, marginTop: 8 }}>{record.name}</div>
        <div style={{ fontSize: 13, opacity: .8 }}>{user}</div>
        <div style={{ marginTop: 12, fontSize: 13 }}>{t("orders_count", { n: record.orders })} · {money(record.totalSpent)} {t("total")}</div>
      </div>
      <div className="eb-stampcard" style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 600 }}>{t("bean_club")} · {stamps} / {REWARD_THRESHOLD} {t("col_stamps").toLowerCase()}</div>
        <div className="eb-stamps">{Array.from({ length: REWARD_THRESHOLD }, (_, i) => <div key={i} className={`eb-stamp ${i < stamps ? "on" : ""}`}>⭐</div>)}</div>
        {hasReward && <p style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: "var(--pine)" }}>🎁 {t("reward_ready_short")}</p>}
      </div>
      {coupons.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{t("my_coupons")}</h3>
          {coupons.map((c, i) => (
            <div key={i} className={`eb-coupon-row ${c.used ? "used" : ""}`}>
              <div style={{ fontSize: 28 }}>🍩</div>
              <div style={{ flex: 1 }}>
                <div className="eb-mono" style={{ fontSize: 16, fontWeight: 600 }}>{c.code}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{c.used ? t("coupon_used_on", { d: new Date(c.usedAt || c.issuedAt).toLocaleDateString() }) : t("active")}</div>
              </div>
              <span className={`eb-pp ${c.used ? "paid" : "unpaid"}`}>{c.used ? t("used") : t("active")}</span>
            </div>
          ))}
        </div>
      )}
      {orders.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{t("order_history")}</h3>
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 13, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{o.id} · Table {o.table}</span>
                <span className={`eb-pp ${o.paid ? "paid" : "unpaid"}`}>{o.paid ? t("paid") : t("unpaid")}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{o.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontWeight: 700 }}>{money(o.total)}</span>
                <button className="eb-link" style={{ fontSize: 12.5 }} onClick={() => reorder(o)}>{t("reorder")}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button className="eb-btn ghost" onClick={signOut}>{t("sign_out")}</button>
    </div>
  );
}

// ── StaffLogin ────────────────────────────────────────────────────────────────
function StaffLogin({ onSuccess, onBack }) {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState(false);
  const doLogin = () => {
    if (email.trim().toLowerCase() === STAFF_EMAIL.toLowerCase() && pass === STAFF_PASSWORD) { setErr(false); onSuccess(); }
    else { setErr(true); }
  };
  return (
    <div className="eb-login">
      <div className="eb-login-card">
        <div className="lock">🔐</div>
        <h1>{t("staff_login_title")}</h1>
        <p className="sub">{t("staff_login_sub")}</p>
        {err && <div className="err">{t("staff_wrong")}</div>}
        <div style={{ marginBottom: 12 }}>
          <label className="eb-label">{t("email")}</label>
          <input className="eb-input" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label className="eb-label">{t("staff_password")}</label>
          <input className="eb-input" type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
        </div>
        <button className="eb-btn" onClick={doLogin}>{t("staff_signin")}</button>
        <button onClick={onBack} style={{ width: "100%", marginTop: 12, fontSize: 13, color: "var(--ink-soft)", textAlign: "center" }}>{t("staff_back_customer")}</button>
      </div>
    </div>
  );
}

// ── AdminApp (sesli bildirim + yeni sipariş banner) ──────────────────────────
function AdminApp({ orders, setOrders, customers, setCustomers, menu, setMenu, slides, setSlides, payments, setPayments, flash, resetDemo, onSignOut }) {
  const { t } = useT();
  const money = useMoney();
  const [tab, setTab]     = useState("orders");
  const [soundOn, setSoundOn] = useState(true);
  const [newBanner, setNewBanner] = useState(false);
  const prevCount = useRef(orders.filter((o) => o.status === "new").length);

  // Sesli bildirim + banner
  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const freqs = [523, 659, 784, 1047];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = f; osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.35);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
      });
    } catch {}
  }

  useEffect(() => {
    const newCount = orders.filter((o) => o.status === "new").length;
    if (newCount > prevCount.current) {
      if (soundOn) playChime();
      setNewBanner(true);
      setTimeout(() => setNewBanner(false), 3500);
    }
    prevCount.current = newCount;
  }, [orders, soundOn]); // eslint-disable-line

  const tables = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (!map[o.table]) map[o.table] = [];
      map[o.table].push(o);
    });
    return map;
  }, [orders]);

  const updateOrderStatus = (id, status) => {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    flash(t("t_order_status", { id, status }));
  };
  const markPaid = (table, paid) => {
    setOrders((os) => os.map((o) => (o.table === table && !o.paid === !paid ? { ...o, paid, paidAt: paid ? new Date().toISOString() : null, billRequested: false } : o)));
    flash(paid ? t("t_table_paid", { n: table }) : t("t_table_reopened", { n: table }));
  };
  const doRedeem = (code) => {
    let found = false;
    setCustomers((cs) => {
      const updated = { ...cs };
      Object.keys(updated).forEach((email) => {
        const r = updated[email];
        if (!r.coupons) return;
        const idx = r.coupons.findIndex((c) => c.code === code && !c.used);
        if (idx >= 0) {
          found = true;
          const coupons = [...r.coupons];
          coupons[idx] = { ...coupons[idx], used: true, usedAt: new Date().toISOString() };
          updated[email] = { ...r, coupons };
        }
      });
      return updated;
    });
    flash(found ? t("redeem_ok") : t("redeem_bad"));
  };

  const TABS = ["orders","tables","menu","gallery","brand","stats","customers"];
  const tabLabel = (k) => t("nav_" + k);

  return (
    <div className="eb-admin">
      {newBanner && <div className="eb-neworder">🔔 {t("new_order_in")}</div>}
      <nav className="eb-anav">
        <div className="brand"><b>☕</b><span className="eb-monogram sm">H<i>&</i>B</span></div>
        {TABS.map((k) => <button key={k} className={`eb-atab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{tabLabel(k)}</button>)}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setSoundOn((s) => !s)} style={{ color: soundOn ? "var(--honey)" : "#888", fontSize: 20, padding: "0 8px" }} title={soundOn ? t("sound_on") : t("sound_off")}>{soundOn ? "🔔" : "🔕"}</button>
          <button className="eb-atab" onClick={resetDemo}>{t("reset_demo")}</button>
          <button className="eb-atab" onClick={onSignOut}>{t("staff_signout")}</button>
        </div>
      </nav>
      <div className="eb-awrap">
        {tab === "orders"    && <AdminOrders orders={orders} updateOrderStatus={updateOrderStatus} flash={flash} />}
        {tab === "tables"    && <AdminTables tables={tables} orders={orders} payments={payments} markPaid={markPaid} flash={flash} />}
        {tab === "menu"      && <AdminMenu menu={menu} setMenu={setMenu} flash={flash} />}
        {tab === "gallery"   && <AdminGallery slides={slides} setSlides={setSlides} flash={flash} />}
        {tab === "brand"     && <AdminBrand flash={flash} doRedeem={doRedeem} />}
        {tab === "stats"     && <AdminStats orders={orders} customers={customers} payments={payments} />}
        {tab === "customers" && <AdminCustomers customers={customers} flash={flash} />}
      </div>
    </div>
  );
}

// ── AdminOrders ──────────────────────────────────────────────────────────────
function AdminOrders({ orders, updateOrderStatus, flash }) {
  const { t } = useT();
  const money = useMoney();
  const [filter, setFilter] = useState("active");
  const filters = [
    { k: "active",    label: t("f_active")    },
    { k: "new",       label: t("f_new")       },
    { k: "preparing", label: t("f_preparing") },
    { k: "served",    label: t("f_served")    },
    { k: "all",       label: t("f_all")       },
  ];
  const filtered = orders.filter((o) => {
    if (filter === "all")    return true;
    if (filter === "active") return o.status !== "served" && !o.paid;
    return o.status === filter;
  });
  const newCount = orders.filter((o) => o.status === "new").length;
  const t2 = useT().t;
  return (
    <>
      <div className="eb-ahead">
        <div><h1>{t("live_orders")}{newCount > 0 && <span className="eb-chip" style={{ marginLeft: 12, fontSize: 13 }}>{t("n_new", { n: newCount })}</span>}</h1><p>{t("live_orders_sub")}</p></div>
      </div>
      <div className="eb-filters">
        {filters.map((f) => <button key={f.k} className={`eb-fpill ${filter === f.k ? "on" : ""}`} onClick={() => setFilter(f.k)}>{f.label}</button>)}
      </div>
      {filtered.length === 0 ? (
        <div className="eb-empty"><div className="em">📋</div><h3>{t("no_orders_admin_t")}</h3><p>{t("no_orders_admin_b")}</p></div>
      ) : (
        <div className="eb-tickets">
          {filtered.map((o) => (
            <div key={o.id} className="eb-ticket">
              <div className="eb-ticket-top">
                <div className="eb-tnum"><b>{o.id}</b> · Table <b>{o.table}</b></div>
                <div className="eb-tt">
                  <span className={`eb-status ${o.status}`}>{t("pill_" + o.status)}</span>
                  {o.paid && <span className="eb-pp paid" style={{ marginLeft: 4 }}>{t("paid")}</span>}
                </div>
              </div>
              <div className="eb-ticket-body">
                {o.customerName && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 8 }}>👤 {o.customerName}{o.rewardUsed && <span style={{ marginLeft: 6 }} className="eb-pill-mini">🎁 {t("reward_tag")}</span>}</div>}
                {o.items.map((it, i) => (
                  <div key={i} className="eb-trow">
                    <span><span className="q">{it.qty}×</span>{it.name}</span>
                    <span>{money(it.price * it.qty)}</span>
                  </div>
                ))}
                {o.items.some((it) => it.note) && o.items.filter((it) => it.note).map((it, i) => <div key={i} className="eb-tnote">💬 {it.name}: {it.note}</div>)}
                {o.orderNote && <div className="eb-tnote">📝 {o.orderNote}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontWeight: 700 }}>
                  <span>{t("total")}</span><span>{money(o.total)}</span>
                </div>
              </div>
              <div className="eb-ticket-foot">
                {o.status === "new"       && <button className="eb-tbtn primary"  onClick={() => updateOrderStatus(o.id, "preparing")}>{t("start_preparing")}</button>}
                {o.status === "preparing" && <button className="eb-tbtn done"     onClick={() => updateOrderStatus(o.id, "served")}>{t("served_btn")}</button>}
                {o.status === "served"    && <button className="eb-tbtn muted"    onClick={() => updateOrderStatus(o.id, "new")}>{t("reopen")}</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── AdminTables ───────────────────────────────────────────────────────────────
function AdminTables({ tables, orders, payments, markPaid, flash }) {
  const { t } = useT();
  const money = useMoney();
  const entries = Object.entries(tables).map(([table, tOrders]) => {
    const n = parseInt(table);
    const pm = (payments && payments[n]) || [];
    const paidItems  = tOrders.reduce((s, o) => s + (o.paidUnits && Object.keys(o.paidUnits).length ? o.items.reduce((ss, it, i) => ss + it.price * Math.min(it.qty, o.paidUnits[i] || 0), 0) : o.paid ? o.total : 0), 0);
    const paidPartial = pm.filter((p) => p.kind !== "items").reduce((s, p) => s + (p.amount || 0), 0);
    const grand      = tOrders.reduce((s, o) => s + o.total, 0);
    const due        = Math.max(0, grand - paidItems - paidPartial);
    const allPaid    = due <= 0 && tOrders.length > 0;
    const called     = tOrders.some((o) => o.billRequested);
    return { table: n, orders: tOrders, grand, due, allPaid, called };
  }).sort((a, b) => b.due - a.due);

  if (!entries.length) return (
    <>
      <div className="eb-ahead"><div><h1>{t("tables")}</h1><p>{t("tables_sub")}</p></div></div>
      <div className="eb-empty"><div className="em">🪑</div><h3>{t("no_tables_t")}</h3><p>{t("no_tables_b")}</p></div>
    </>
  );

  return (
    <>
      <div className="eb-ahead"><div><h1>{t("tables")}</h1><p>{t("tables_sub")}</p></div></div>
      <div className="eb-floor">
        {entries.map(({ table, orders: tOrders, grand, due, allPaid, called }) => (
          <div key={table} className={`eb-tablecard ${!allPaid && due > 0 ? "owing" : ""} ${called ? "called" : ""}`}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="eb-table-badge">{table}</span><span style={{ fontSize: 14, fontWeight: 600 }}>{t("table_n", { n: table })}</span></div>
              <span className={`eb-pp ${allPaid ? "paid" : "unpaid"}`}>{allPaid ? t("settled") : money(due) + " " + t("owing")}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>{tOrders.length} {tOrders.length === 1 ? t("order_word") : t("orders_word")} · {money(grand)} {t("total")}</div>
            {called && <div className="eb-called">🔔 {t("bill_requested_alert")}</div>}
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              {allPaid ? (
                <button className="eb-tbtn muted" onClick={() => markPaid(table, false)}>{t("reopen_bill")}</button>
              ) : (
                <button className="eb-tbtn done" onClick={() => markPaid(table, true)}>{t("mark_paid_due", { due: money(due) })}</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── ItemEditor ────────────────────────────────────────────────────────────────
function ItemEditor({ item, onSave, onCancel, flash }) {
  const { t, lang } = useT();
  const [name,      setName]      = useState(item?.name || "");
  const [cat,       setCat]       = useState(item?.cat  || CATS[0].key);
  const [price,     setPrice]     = useState(item?.price || "");
  const [emoji,     setEmoji]     = useState(item?.emoji || "☕");
  const [desc,      setDesc]      = useState(item?.desc  || "");
  const [ingr,      setIngr]      = useState(item?.ingredients || "");
  const [allergens, setAllergens] = useState(item?.allergens || []);
  const [avail,     setAvail]     = useState(item?.available !== false);
  const [imageUrl,  setImageUrl]  = useState(item?.image || "");
  const [uploading, setUploading] = useState(false);

  const toggleAllergen = (id) => setAllergens((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);

  const uploadFile = async (file) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => { setImageUrl(ev.target.result); setUploading(false); flash(t("t_photo_added")); };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!name.trim() || !price) return;
    onSave({ ...item, id: item?.id || name.trim().toLowerCase().replace(/\s+/g, "_") + "_" + Date.now(), name, cat, price: parseFloat(price), emoji, desc, ingredients: ingr, allergens, available: avail, image: imageUrl });
  };

  return (
    <div className="eb-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="eb-modal" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <h3>{item?.id ? t("edit_item_title") : t("add_item_title")}</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("menu_editor_sub")}</p>
        <div className="eb-sep" />

        {/* Fotoğraf */}
        <div className="eb-uploader" style={{ marginBottom: 16 }}>
          <div className="eb-preview">{imageUrl ? <img src={imageUrl} alt="" /> : <span>{emoji}</span>}</div>
          <div style={{ flex: 1 }}>
            <label className="eb-label">{t("upload_photo")}</label>
            <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0])} style={{ fontSize: 12, color: "var(--ink-soft)" }} />
            {imageUrl && <button className="eb-link" style={{ display: "block", fontSize: 12, marginTop: 6 }} onClick={() => { setImageUrl(""); flash(t("t_photo_removed")); }}>{t("remove_photo")}</button>}
            <div style={{ marginTop: 8 }}>
              <label className="eb-label">{t("paste_url")}</label>
              <input className="eb-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" style={{ fontSize: 13 }} />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 12, marginBottom: 12 }}>
          <div><label className="eb-label">{t("name")}</label><input className="eb-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="eb-label">{t("emoji")}</label><input className="eb-input" value={emoji} onChange={(e) => setEmoji(e.target.value)} style={{ textAlign: "center", fontSize: 22 }} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label className="eb-label">{t("category")}</label>
            <select className="eb-input" value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATS.map((c) => <option key={c.key} value={c.key}>{t("cat_" + c.key)}</option>)}
            </select>
          </div>
          <div><label className="eb-label">{t("price")} (₺)</label><input className="eb-input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        </div>

        <div style={{ marginBottom: 12 }}><label className="eb-label">{t("short_desc")}</label><input className="eb-input" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div style={{ marginBottom: 12 }}><label className="eb-label">{t("ingredients")}</label><input className="eb-input" value={ingr} onChange={(e) => setIngr(e.target.value)} /></div>

        {/* Alerjen seçici */}
        <div style={{ marginBottom: 16 }}>
          <label className="eb-label">{t("allergens_label")}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {ALLERGENS.map((a) => (
              <button key={a.id} onClick={() => toggleAllergen(a.id)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: `2px solid ${allergens.includes(a.id) ? "var(--honey)" : "var(--line)"}`, background: allergens.includes(a.id) ? "rgba(214,158,74,.15)" : "var(--paper)", fontSize: 12.5, cursor: "pointer" }}>
                {a.emoji} {lang === "tr" ? a.tr : a.en}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button className={`eb-toggle ${avail ? "on" : ""}`} onClick={() => setAvail((v) => !v)}><i /></button>
          <span style={{ fontSize: 14 }}>{avail ? t("available_order") : t("marked_sold_out")}</span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="eb-btn" onClick={save}>{item?.id ? t("save_changes") : t("add_to_menu")}</button>
          <button className="eb-btn ghost" onClick={onCancel}>{t("cancel")}</button>
        </div>
      </div>
    </div>
  );
}

// ── AdminMenu ─────────────────────────────────────────────────────────────────
function AdminMenu({ menu, setMenu, flash }) {
  const { t } = useT();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding]   = useState(false);

  const saveItem = (item) => {
    setMenu((m) => editing?.id ? m.map((x) => x.id === item.id ? item : x) : [item, ...m]);
    setEditing(null); setAdding(false);
    flash(t("t_changes_saved"));
  };
  const remove = (id) => { setMenu((m) => m.filter((x) => x.id !== id)); flash(t("t_item_removed")); };
  const toggleAvail = (id) => setMenu((m) => m.map((x) => x.id === id ? { ...x, available: !x.available } : x));

  return (
    <>
      <div className="eb-ahead">
        <div><h1>{t("nav_menu")}</h1><p>{t("menu_admin_sub")}</p></div>
        <button className="eb-btn" style={{ width: "auto" }} onClick={() => setAdding(true)}>+ {t("add_item")}</button>
      </div>
      {CATS.map((c) => {
        const items = menu.filter((i) => i.cat === c.key);
        if (!items.length) return null;
        return (
          <div key={c.key} className="eb-medit-cat">
            <h2>{CAT_EMOJI[c.key]} {t("cat_" + c.key)} <small>{t("items_count", { n: items.length })}</small></h2>
            {items.map((item) => (
              <div key={item.id} className={`eb-mrow ${item.available === false ? "out" : ""}`}>
                <div className="eb-thumb" style={{ width: 52, height: 52, background: CAT_TINT[item.cat] }}>
                  {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{item.emoji}</span>}
                </div>
                <div className="info">
                  <b>{item.name}</b>
                  <div className="ing">{item.ingredients}</div>
                  {item.allergens?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3 }}>
                      {item.allergens.map((a) => { const al = ALLERGENS.find((x) => x.id === a); return al ? <span key={a} style={{ fontSize: 10, background: "rgba(255,200,0,.15)", padding: "1px 5px", borderRadius: 4 }}>{al.emoji}</span> : null; })}
                    </div>
                  )}
                </div>
                <span className="pr">₺{item.price}</span>
                <button className={`eb-toggle ${item.available !== false ? "on" : ""}`} onClick={() => toggleAvail(item.id)}><i /></button>
                <button className="eb-iconbtn" onClick={() => setEditing(item)}>✏️</button>
                <button className="eb-iconbtn" onClick={() => remove(item.id)}>🗑️</button>
              </div>
            ))}
          </div>
        );
      })}
      {(adding || editing) && <ItemEditor item={editing || null} onSave={saveItem} onCancel={() => { setEditing(null); setAdding(false); }} flash={flash} />}
    </>
  );
}

// ── SlideEditor ───────────────────────────────────────────────────────────────
function SlideEditor({ slide, onSave, onCancel }) {
  const { t } = useT();
  const [img,  setImg]  = useState(slide?.img  || "");
  const [cap,  setCap]  = useState(slide?.cap  || "");
  const [grad, setGrad] = useState(slide?.grad || SLIDE_GRADS[0]);
  const [emo,  setEmo]  = useState(slide?.emoji || "☕");

  const uploadFile = (file) => { const r = new FileReader(); r.onload = (e) => setImg(e.target.result); r.readAsDataURL(file); };
  const save = () => onSave({ ...slide, id: slide?.id || "s" + Date.now(), img, cap, grad, emoji: emo });

  return (
    <div className="eb-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="eb-modal">
        <h3>{slide?.id ? t("edit_photo_title") : t("add_photo_title")}</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>{t("gallery_editor_sub")}</p>
        <div className="eb-sep" />
        <div style={{ marginBottom: 14 }}>
          <label className="eb-label">{t("upload_photo")}</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0])} />
          <div style={{ marginTop: 8 }}>
            <label className="eb-label">{t("paste_url")}</label>
            <input className="eb-input" value={img} onChange={(e) => setImg(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="eb-label">{t("caption")}</label>
          <input className="eb-input" value={cap} onChange={(e) => setCap(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 12, marginBottom: 16 }}>
          <div><label className="eb-label">{t("emoji")}</label><input className="eb-input" value={emo} onChange={(e) => setEmo(e.target.value)} style={{ textAlign: "center", fontSize: 22 }} /></div>
          <div>
            <label className="eb-label">{t("fallback_colour")}</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SLIDE_GRADS.map((g, i) => <button key={i} onClick={() => setGrad(g)} style={{ width: 30, height: 30, borderRadius: 9, background: g, border: grad === g ? "3px solid var(--ink)" : "2px solid transparent" }} />)}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 16 }}>{t("fallback_hint")}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="eb-btn" onClick={save}>{slide?.id ? t("save_changes") : t("add_photo")}</button>
          <button className="eb-btn ghost" onClick={onCancel}>{t("cancel")}</button>
        </div>
      </div>
    </div>
  );
}

// ── AdminGallery ──────────────────────────────────────────────────────────────
function AdminGallery({ slides, setSlides, flash }) {
  const { t } = useT();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding]   = useState(false);

  const save = (s) => {
    setSlides((sl) => editing?.id ? sl.map((x) => x.id === s.id ? s : x) : [...sl, s]);
    setEditing(null); setAdding(false);
    flash(editing?.id ? t("t_photo_updated") : t("t_photo_added"));
  };
  const remove = (id) => { setSlides((sl) => sl.filter((s) => s.id !== id)); flash(t("t_photo_removed")); };
  const move = (i, dir) => setSlides((sl) => { const n = [...sl]; const [x] = n.splice(i, 1); n.splice(i + dir, 0, x); return n; });

  return (
    <>
      <div className="eb-ahead">
        <div><h1>{t("gallery")}</h1><p>{t("gallery_sub")}</p></div>
        <button className="eb-btn" style={{ width: "auto" }} onClick={() => setAdding(true)}>+ {t("add_photo")}</button>
      </div>
      {slides.length === 0 ? (
        <div className="eb-empty"><div className="em">🖼️</div><h3>{t("no_photos_t")}</h3><p>{t("no_photos_b")}</p></div>
      ) : (
        <div className="eb-gallery">
          {slides.map((s, i) => (
            <div key={s.id} className="eb-grow">
              <div className="eb-gthumb">{s.img ? <img src={s.img} alt="" /> : <div style={{ width: "100%", height: "100%", background: s.grad || SLIDE_GRADS[0], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{s.emoji}</div>}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.cap || <em style={{ color: "var(--ink-soft)" }}>{t("no_caption")}</em>}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3 }}>{s.img ? t("uploaded_photo") : t("gradient_fallback")}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="eb-iconbtn" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button className="eb-iconbtn" disabled={i === slides.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button className="eb-iconbtn" onClick={() => setEditing(s)}>✏️</button>
                <button className="eb-iconbtn" onClick={() => remove(s.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(adding || editing) && <SlideEditor slide={editing || null} onSave={save} onCancel={() => { setEditing(null); setAdding(false); }} />}
    </>
  );
}

// ── AdminBrand ────────────────────────────────────────────────────────────────
function AdminBrand({ flash, doRedeem }) {
  const { t } = useT();
  const { themeId, setThemeId } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const [redeemCode, setRedeemCode] = useState("");

  const applyTheme = (id) => {
    setThemeId(id);
    saveJSON(K_THEME, id);
    flash(t("theme_applied", { name: THEMES.find((th) => th.id === id)?.label }));
  };
  const applyCurrency = (code) => {
    setCurrency(code);
    saveJSON(K_CURRENCY, code);
    flash(t("currency_label") + ": " + CURRENCIES[code]?.symbol + " " + CURRENCIES[code]?.name);
  };

  return (
    <>
      <div className="eb-ahead"><div><h1>{t("brand_title")}</h1><p>{t("brand_sub")}</p></div></div>

      {/* Tema seçici */}
      <div className="eb-theme-grid" style={{ marginBottom: 32 }}>
        {THEMES.map((th) => (
          <button key={th.id} className={`eb-themecard ${themeId === th.id ? "on" : ""}`} onClick={() => applyTheme(th.id)}>
            <div className="eb-theme-swatches">{th.swatch.map((c, i) => <i key={i} style={{ background: c }} />)}</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{th.label}</div>
            {themeId === th.id && <div style={{ fontSize: 12, color: "var(--pine)", marginTop: 4, fontWeight: 600 }}>✓ {t("current_theme")}</div>}
          </button>
        ))}
      </div>

      {/* Para birimi seçici */}
      <div className="eb-panel" style={{ marginBottom: 24 }}>
        <h3>{t("currency_label")}</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries(CURRENCIES).map(([code, c]) => (
            <button key={code} onClick={() => applyCurrency(code)} style={{ padding: "10px 16px", borderRadius: 12, border: `2px solid ${currency === code ? "var(--pine)" : "var(--line)"}`, background: currency === code ? "var(--pine)" : "var(--paper)", color: currency === code ? "var(--pine-ink)" : "var(--ink)", fontWeight: 600, fontSize: 15, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 20 }}>{c.symbol}</span>
              <span style={{ fontSize: 11, opacity: .8 }}>{code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Kupon kullan */}
      <div className="eb-panel">
        <h3>🎁 {t("redeem_coupon")}</h3>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input className="eb-input" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value.toUpperCase())} placeholder={t("redeem_ph")} style={{ fontFamily: "var(--mono,'DM Mono',monospace)", letterSpacing: 1 }} />
          <button className="eb-btn" style={{ width: "auto", padding: "0 20px" }} disabled={!redeemCode.trim()} onClick={() => { doRedeem(redeemCode.trim()); setRedeemCode(""); }}>{t("redeem_btn")}</button>
        </div>
      </div>
    </>
  );
}

// ── AdminStats ────────────────────────────────────────────────────────────────
function AdminStats({ orders, customers, payments }) {
  const { t } = useT();
  const money = useMoney();
  const paid        = orders.filter((o) => o.paid);
  const revenue     = paid.reduce((s, o) => s + o.total, 0);
  const outstanding = orders.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);
  const tips        = Object.values(payments || {}).flat().reduce((s, p) => s + (p.tip || 0), 0);
  const avg         = paid.length ? revenue / paid.length : 0;
  const memberCount = Object.keys(customers).length;
  const multi       = Object.values(customers).filter((c) => c.orders > 1).length;

  const hourCounts  = Array(24).fill(0);
  orders.forEach((o) => { try { hourCounts[new Date(o.createdAt).getHours()]++; } catch {} });
  const peakHour    = hourCounts.indexOf(Math.max(...hourCounts));

  const itemFreq = {};
  orders.forEach((o) => o.items.forEach((it) => { itemFreq[it.name] = (itemFreq[it.name] || 0) + it.qty; }));
  const bestSellers = Object.entries(itemFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const tableFreq = {};
  orders.forEach((o) => { tableFreq[o.table] = (tableFreq[o.table] || 0) + 1; });
  const busiest = Object.entries(tableFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (!orders.length) return (
    <>
      <div className="eb-ahead"><div><h1>{t("statistics")}</h1><p>{t("stats_sub")}</p></div></div>
      <div className="eb-empty"><div className="em">📊</div><h3>{t("no_data_t")}</h3><p>{t("no_data_b")}</p></div>
    </>
  );

  return (
    <>
      <div className="eb-ahead"><div><h1>{t("statistics")}</h1><p>{t("stats_sub")}</p></div></div>
      <div className="eb-stats-grid">
        <div className="eb-stat"><div className="k">{t("revenue")}</div><div className="v serif">{money(revenue)}</div></div>
        <div className="eb-stat"><div className="k">{t("outstanding")}</div><div className="v serif">{money(outstanding)}</div></div>
        <div className="eb-stat"><div className="k">{t("orders_stat")}</div><div className="v">{orders.length}</div></div>
        <div className="eb-stat"><div className="k">{t("avg_order")}</div><div className="v serif">{money(avg)}</div></div>
        <div className="eb-stat"><div className="k">{t("members")}</div><div className="v">{memberCount}</div></div>
        <div className="eb-stat"><div className="k">{t("tips_collected")}</div><div className="v serif">{money(tips)}</div></div>
        <div className="eb-stat"><div className="k">{t("repeat_guests")}</div><div className="v">{multi}</div></div>
        <div className="eb-stat"><div className="k">{t("peak_hour")}</div><div className="v">{peakHour}:00</div></div>
      </div>
      <div className="eb-two">
        <div className="eb-panel">
          <h3>{t("best_sellers")}</h3>
          {bestSellers.map(([name, cnt]) => (
            <div key={name} className="eb-bar-row">
              <div className="nm" style={{ fontSize: 13 }}>{name}</div>
              <div className="eb-bar-track"><div className="eb-bar-fill" style={{ width: `${(cnt / (bestSellers[0]?.[1] || 1)) * 100}%` }} /></div>
              <div className="vl">{cnt}</div>
            </div>
          ))}
        </div>
        <div className="eb-panel">
          <h3>{t("busiest_tables")}</h3>
          {busiest.map(([table, cnt]) => (
            <div key={table} className="eb-bar-row">
              <div className="nm" style={{ fontSize: 13 }}>Table {table}</div>
              <div className="eb-bar-track"><div className="eb-bar-fill" style={{ width: `${(cnt / (busiest[0]?.[1] || 1)) * 100}%` }} /></div>
              <div className="vl">{cnt}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── AdminCustomers ────────────────────────────────────────────────────────────
function AdminCustomers({ customers, flash }) {
  const { t } = useT();
  const money = useMoney();
  const [compose, setCompose] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const list = Object.values(customers).sort((a, b) => b.totalSpent - a.totalSpent);

  const sendPromo = () => {
    flash(t("t_promo_queued", { n: list.length }));
    setCompose(false); setSubject(""); setMessage("");
  };

  return (
    <>
      <div className="eb-ahead">
        <div><h1>{t("customers")}</h1><p>{t("customers_sub")}</p></div>
        {list.length > 0 && <button className="eb-btn" style={{ width: "auto" }} onClick={() => setCompose(true)}>✉️ {t("email_all")}</button>}
      </div>
      {list.length === 0 ? (
        <div className="eb-empty"><div className="em">👥</div><h3>{t("no_members_t")}</h3><p>{t("no_members_b")}</p></div>
      ) : (
        <div className="eb-panel" style={{ overflowX: "auto" }}>
          <table className="eb-ctable">
            <thead>
              <tr>
                <th>{t("col_name")}</th><th>{t("col_email")}</th><th>{t("col_orders")}</th>
                <th>{t("col_stamps")}</th><th>{t("col_spent")}</th><th>{t("col_joined")}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.email}>
                  <td style={{ fontWeight: 600 }}>{c.name || "—"}</td>
                  <td>{c.email}</td>
                  <td>{c.orders}</td>
                  <td>{"⭐".repeat(Math.min(c.stamps, 5))}{c.stamps === 0 ? "—" : ""}</td>
                  <td style={{ fontWeight: 600 }}>{money(c.totalSpent)}</td>
                  <td style={{ color: "var(--ink-soft)", fontSize: 12.5 }}>{c.joinedAt ? new Date(c.joinedAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {compose && (
        <div className="eb-overlay" onClick={(e) => e.target === e.currentTarget && setCompose(false)}>
          <div className="eb-modal">
            <h3>✉️ {t("compose_promo")}</h3>
            <div className="eb-sep" />
            <div style={{ marginBottom: 10 }}>
              <label className="eb-label">{t("to_label")}</label>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t("all_members_n", { n: list.length })}</div>
            </div>
            <div style={{ marginBottom: 10 }}><label className="eb-label">{t("subject")}</label><input className="eb-input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div style={{ marginBottom: 16 }}><label className="eb-label">{t("message")}</label><textarea className="eb-input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
            <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 16 }}>{t("promo_demo_note")}</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="eb-btn" onClick={sendPromo}>{t("send_promo")}</button>
              <button className="eb-btn ghost" onClick={() => setCompose(false)}>{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
