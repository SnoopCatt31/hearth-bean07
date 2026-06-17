import { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";

/* =========================================================================
   Hearth & Bean — QR table-ordering prototype (v3, multilingual)
   Languages: English, Türkçe, Русский, Deutsch, العربية (with RTL)
   ========================================================================= */

const CURRENCY = "₺";
const money = (n) => `${CURRENCY}${Number(n).toFixed(2)}`;
const REWARD_THRESHOLD = 5;
const REWARD_ITEMS = ["filter", "donut"];
const TABLE_COUNT = 12;

/* Café staff login. Change these to your own before going live.
   NOTE: this is a front-end gate — good enough to keep customers out of the
   admin panel, but not bank-grade security. Real protection needs a backend. */
const STAFF_EMAIL = "admin@hearthbean.co";
const STAFF_PASSWORD = "cafe1234";

const CATS = [{ key: "hot" }, { key: "cold" }, { key: "shots" }, { key: "fruit" }, { key: "shakes" }, { key: "dessert" }];
const CAT_TINT = { hot: "#efe0c6", cold: "#d8e6e2", shots: "#e7dccd", fruit: "#f0e0d6", shakes: "#ecdfe8", dessert: "#f1e4cf" };

const DEFAULT_MENU = [
  { id: "filter", cat: "hot", name: "Filter Coffee", desc: "Single-origin, slow drip", ingredients: "Single-origin beans, filtered water", price: 45, emoji: "☕", image: "", available: true },
  { id: "flatwhite", cat: "hot", name: "Flat White", desc: "Double ristretto, silk milk", ingredients: "Espresso, steamed milk", price: 70, emoji: "🥛", image: "", available: true },
  { id: "cappuccino", cat: "hot", name: "Cappuccino", desc: "Equal parts, cocoa dusted", ingredients: "Espresso, milk, foam, cocoa", price: 68, emoji: "☕", image: "", available: true },
  { id: "latte", cat: "hot", name: "Café Latte", desc: "Smooth, comforting, classic", ingredients: "Espresso, steamed milk", price: 72, emoji: "☕", image: "", available: true },
  { id: "mocha", cat: "hot", name: "Hearth Mocha", desc: "Dark chocolate + espresso", ingredients: "Espresso, dark chocolate, milk", price: 80, emoji: "🍫", image: "", available: true },
  { id: "icedlatte", cat: "cold", name: "Iced Latte", desc: "Chilled, mellow, easy", ingredients: "Espresso, cold milk, ice", price: 75, emoji: "🧋", image: "", available: true },
  { id: "coldbrew", cat: "cold", name: "Cold Brew", desc: "18-hour steep, bold", ingredients: "Cold-steeped coffee, ice", price: 78, emoji: "🥤", image: "", available: true },
  { id: "icedmocha", cat: "cold", name: "Iced Mocha", desc: "Chocolate cold brew", ingredients: "Cold brew, chocolate, milk, ice", price: 85, emoji: "🧊", image: "", available: true },
  { id: "affogato", cat: "cold", name: "Affogato", desc: "Espresso over vanilla gelato", ingredients: "Espresso, vanilla gelato", price: 90, emoji: "🍨", image: "", available: true },
  { id: "espresso", cat: "shots", name: "Espresso", desc: "One honest shot", ingredients: "Single espresso", price: 40, emoji: "☕", image: "", available: true },
  { id: "double", cat: "shots", name: "Double Espresso", desc: "Twice the resolve", ingredients: "Double espresso", price: 55, emoji: "☕", image: "", available: true },
  { id: "cortado", cat: "shots", name: "Cortado", desc: "Cut with warm milk", ingredients: "Espresso, warm milk", price: 58, emoji: "🥛", image: "", available: true },
  { id: "macchiato", cat: "shots", name: "Macchiato", desc: "Espresso, a spot of foam", ingredients: "Espresso, milk foam", price: 50, emoji: "☕", image: "", available: true },
  { id: "orangemint", cat: "fruit", name: "Orange & Mint", desc: "Fresh-pressed, bright", ingredients: "Orange, mint, ice", price: 65, emoji: "🍊", image: "", available: true },
  { id: "berrylem", cat: "fruit", name: "Berry Lemonade", desc: "Mixed berries, house lemonade", ingredients: "Mixed berries, lemon, soda", price: 70, emoji: "🫐", image: "", available: true },
  { id: "watermelon", cat: "fruit", name: "Watermelon Cooler", desc: "Just melon and ice", ingredients: "Watermelon, ice", price: 68, emoji: "🍉", image: "", available: true },
  { id: "applefizz", cat: "fruit", name: "Green Apple Fizz", desc: "Tart apple, sparkling", ingredients: "Green apple, sparkling water", price: 66, emoji: "🍏", image: "", available: true },
  { id: "vanilla", cat: "shakes", name: "Vanilla Bean Shake", desc: "Real vanilla, real cream", ingredients: "Vanilla ice cream, milk", price: 88, emoji: "🥤", image: "", available: true },
  { id: "choc", cat: "shakes", name: "Chocolate Shake", desc: "Double cocoa", ingredients: "Chocolate ice cream, cocoa, milk", price: 90, emoji: "🍫", image: "", available: true },
  { id: "caramel", cat: "shakes", name: "Salted Caramel Shake", desc: "Sweet meets salt", ingredients: "Caramel, sea salt, ice cream, milk", price: 95, emoji: "🍮", image: "", available: true },
  { id: "strawberry", cat: "shakes", name: "Strawberry Shake", desc: "Fresh strawberries", ingredients: "Strawberries, ice cream, milk", price: 90, emoji: "🍓", image: "", available: true },
  { id: "donut", cat: "dessert", name: "Glazed Donut", desc: "Still warm if you're lucky", ingredients: "Flour, sugar glaze, butter (gluten)", price: 35, emoji: "🍩", image: "", available: true },
  { id: "cheesecake", cat: "dessert", name: "Cheesecake Slice", desc: "New York style", ingredients: "Cream cheese, biscuit base, cream", price: 75, emoji: "🍰", image: "", available: true },
  { id: "brownie", cat: "dessert", name: "Fudge Brownie", desc: "Gooey middle", ingredients: "Dark chocolate, butter, walnuts", price: 60, emoji: "🟫", image: "", available: true },
  { id: "cinnamon", cat: "dessert", name: "Cinnamon Roll", desc: "Cream cheese frosting", ingredients: "Flour, cinnamon, cream cheese (gluten)", price: 65, emoji: "🥐", image: "", available: true },
  { id: "carrot", cat: "dessert", name: "Carrot Cake", desc: "Walnuts, warm spice", ingredients: "Carrot, walnuts, spice, cream cheese", price: 70, emoji: "🥕", image: "", available: true },
];

const SLIDE_GRADS = [
  "linear-gradient(150deg,#3b5142,#26352b)", "linear-gradient(150deg,#6b4a2b,#3a2a18)",
  "linear-gradient(150deg,#b9526a,#7a3142)", "linear-gradient(150deg,#c5703b,#8a4a26)",
  "linear-gradient(150deg,#2F4A3A,#1d2e23)", "linear-gradient(150deg,#4a6b5a,#2f4a3a)",
];
const DEFAULT_SLIDES = [
  { id: "s1", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=70", emoji: "🪟", grad: SLIDE_GRADS[0], cap: "The corner by the window" },
  { id: "s2", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=70", emoji: "☕", grad: SLIDE_GRADS[1], cap: "Latte art on every cup" },
  { id: "s3", img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=70", emoji: "🍩", grad: SLIDE_GRADS[2], cap: "Baked fresh each morning" },
  { id: "s4", img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=70", emoji: "🍉", grad: SLIDE_GRADS[3], cap: "Fruit pressed to order" },
  { id: "s5", img: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=70", emoji: "🌿", grad: SLIDE_GRADS[4], cap: "Plants, light, good company" },
];

const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  { code: "ru", label: "Русский", flag: "🇷🇺", dir: "ltr" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
];

/* Theme presets — different look-and-feel options for different cafés.
   "jazal" is built directly from the uploaded brand board (#F37721 / #FFE8D1 / #005246,
   arch-and-pill signage shapes). The others are original directions for variety. */
const THEMES = [
  {
    id: "hearth", label: "Hearth Classic", swatch: ["#2F4A3A", "#D99A2B", "#9C3B52"], shape: "rounded",
    vars: { bg: "#FBF6EC", paper: "#FFFDF8", ink: "#23332A", "ink-soft": "#5b6b60", pine: "#2F4A3A", "pine-2": "#3E5C49", "pine-ink": "#f3efe3", honey: "#D99A2B", "honey-2": "#E8B042", "honey-ink": "#3a2c0c", berry: "#9C3B52", "berry-soft": "#c98397", line: "#E7DAC2", "line-2": "#efe6d3", shadow: "0 1px 2px rgba(35,51,42,.05),0 8px 30px rgba(35,51,42,.07)", "shadow-lg": "0 20px 60px rgba(35,51,42,.18)", font: "'Fraunces',Georgia,serif", "bg-pattern": "none" },
  },
  {
    id: "jazal", label: "Jazal Sunrise", swatch: ["#005246", "#F37721", "#FFE8D1"], shape: "arch",
    vars: { bg: "#FFF3E1", paper: "#FFFBF3", ink: "#1F3A33", "ink-soft": "#5b7b70", pine: "#005246", "pine-2": "#0B6657", "pine-ink": "#FCEFDD", honey: "#F37721", "honey-2": "#FF8A3D", "honey-ink": "#3A1B05", berry: "#C2511B", "berry-soft": "#E59A6E", line: "#F0D9B8", "line-2": "#F8ECDA", shadow: "0 1px 2px rgba(31,58,51,.06),0 8px 30px rgba(31,58,51,.09)", "shadow-lg": "0 20px 60px rgba(31,58,51,.22)", font: "'Fraunces',Georgia,serif", "bg-pattern": "none" },
  },
  {
    id: "midnight", label: "Midnight Roast", swatch: ["#0E3D32", "#E2691F", "#C98A2E"], shape: "sharp",
    vars: { bg: "#1B1410", paper: "#241A14", ink: "#F3E7D8", "ink-soft": "#B7A593", pine: "#0E3D32", "pine-2": "#155244", "pine-ink": "#EFE6D8", honey: "#E2691F", "honey-2": "#F0823A", "honey-ink": "#1B1410", berry: "#C98A2E", "berry-soft": "#7A5A28", line: "#3A2C22", "line-2": "#2E2219", shadow: "0 1px 2px rgba(0,0,0,.3),0 8px 30px rgba(0,0,0,.4)", "shadow-lg": "0 20px 60px rgba(0,0,0,.55)", font: "'Fraunces',Georgia,serif", "bg-pattern": "none" },
  },
  {
    id: "garden", label: "Garden Terracotta", swatch: ["#5C7A63", "#D97B4F", "#B5697A"], shape: "rounded",
    vars: { bg: "#F6EFE4", paper: "#FFFBF3", ink: "#3A3026", "ink-soft": "#8A7C68", pine: "#5C7A63", "pine-2": "#6F8F76", "pine-ink": "#F6F2E9", honey: "#D97B4F", "honey-2": "#E89368", "honey-ink": "#3A1C0E", berry: "#B5697A", "berry-soft": "#D6A3AE", line: "#E8DCC8", "line-2": "#F0E8D9", shadow: "0 1px 2px rgba(58,48,38,.05),0 8px 30px rgba(58,48,38,.07)", "shadow-lg": "0 20px 60px rgba(58,48,38,.18)", font: "'Fraunces',Georgia,serif", "bg-pattern": "none" },
  },
  {
    id: "mercado", label: "Mercado Rojo", swatch: ["#B21D25", "#F1E7D2", "#2B2118"], shape: "sharp",
    vars: { bg: "#F1E7D2", paper: "#FBF6EC", ink: "#2B2118", "ink-soft": "#7a6a57", pine: "#B21D25", "pine-2": "#C73540", "pine-ink": "#FBF6EC", honey: "#D98B2B", "honey-2": "#E6A347", "honey-ink": "#2B2118", berry: "#7A1620", "berry-soft": "#C97D83", line: "#E3D2B0", "line-2": "#ECE0C5", shadow: "0 1px 2px rgba(43,33,24,.06),0 8px 30px rgba(43,33,24,.08)", "shadow-lg": "0 20px 60px rgba(43,33,24,.22)", font: "'Bitter',Georgia,serif", "bg-pattern": "repeating-linear-gradient(0deg,rgba(178,29,37,.09) 0px,rgba(178,29,37,.09) 1px,transparent 1px,transparent 26px),repeating-linear-gradient(90deg,rgba(178,29,37,.09) 0px,rgba(178,29,37,.09) 1px,transparent 1px,transparent 26px)" },
  },
  {
    id: "cobalt", label: "Cobalt Pop", swatch: ["#1B1FA8", "#F4EDE2", "#FF6A3D"], shape: "sharp",
    vars: { bg: "#EDE6D6", paper: "#F8F3E8", ink: "#14156B", "ink-soft": "#5557A0", pine: "#1B1FA8", "pine-2": "#2A2FC7", "pine-ink": "#F4EDE2", honey: "#FF6A3D", "honey-2": "#FF8657", "honey-ink": "#1A0900", berry: "#5B5FE0", "berry-soft": "#A6A8F0", line: "#DDD2B8", "line-2": "#EAE1CB", shadow: "0 1px 2px rgba(20,21,107,.06),0 8px 30px rgba(20,21,107,.09)", "shadow-lg": "0 20px 60px rgba(20,21,107,.24)", font: "'Anton',sans-serif", "bg-pattern": "none" },
  },
  {
    id: "tangerine", label: "Tangerine Pop", swatch: ["#4A2412", "#E2521B", "#FBF6EC"], shape: "pill",
    vars: { bg: "#FBF6EC", paper: "#FFFDF6", ink: "#2B2118", "ink-soft": "#8a7a63", pine: "#4A2412", "pine-2": "#5C2F18", "pine-ink": "#FBF6EC", honey: "#E2521B", "honey-2": "#EE6B3B", "honey-ink": "#2B1206", berry: "#B23A12", "berry-soft": "#E2906B", line: "#EDE0C8", "line-2": "#F5EEDC", shadow: "0 1px 2px rgba(43,33,24,.05),0 8px 30px rgba(43,33,24,.07)", "shadow-lg": "0 20px 60px rgba(43,33,24,.18)", font: "'Lilita One',cursive", "bg-pattern": "none" },
  },
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
    menu: "Menu", sold_out: "Sold out", view_basket: "View basket", items: "items", item: "item",
    your_basket: "Your basket", empty_basket_t: "Nothing here yet", empty_basket_b: "Add something tasty from the menu.",
    browse_menu: "Browse the menu", delivering_to: "Delivering to Table {n}",
    note_for_item: "Note for {name} — e.g. oat milk, no sugar", order_note_label: "Note for the whole order",
    order_note_ph: "Anything else? Allergies, timing, a birthday candle…",
    use_reward: "Use your free reward", reward_applied: "Reward applied", reward_free_item: "{name} is on us", reward_add_item: "Add a filter coffee or donut to redeem",
    subtotal: "Subtotal", club_reward: "Bean Club reward", total: "Total",
    guest_1: "Ordering as a guest.", guest_2: "to earn a stamp on this order.", send_order: "Send order to kitchen",
    order_sent: "Order sent!", getting_ready: "We're getting it ready for Table {n}.", order_id: "Order {id}",
    step_received: "Received", step_preparing: "Preparing", step_served: "Served",
    status_updates: "Status updates here as the kitchen works. (Switch to Café Admin below to move it along.)",
    reward_unlocked: "Reward unlocked! 🎁", stamp_earned: "+1 stamp earned ⭐", view_account: "View my account",
    missed_stamp_t: "Missed a stamp", missed_stamp_b: "Members get a free filter coffee or donut every 5 orders.",
    join_club: "Join the Bean Club", order_more: "Order something else", view_bill: "View my table bill",
    join_banner: "A stamp with every order. Five stamps = a free filter coffee or donut.",
    your_name: "Your name", email: "Email", email_consent: "We'll only email you about rewards and the occasional treat. No spam.",
    create_account: "Create my account", already_member: "Already a member? Just enter your email above.",
    account: "Account", not_signed_in: "Not signed in", join_to_track: "Join to track orders and collect rewards.",
    orders_count: "{n} orders", order_history: "Order history", no_orders_hist: "No orders yet — your past orders will live here.",
    reorder: "Reorder", sign_out: "Sign out",
    reward_ready_short: "🎁 A free filter coffee or donut is ready — redeem it in your basket.",
    more_until: "{n} more order(s) until your free treat.",
    bill_title: "Table {n} bill", no_orders_yet: "No orders yet", bill_builds: "Your bill builds up as you order.",
    reward_word: "Reward", order_total: "Order total", total_ordered: "Total ordered", already_paid: "Already paid",
    amount_due: "Amount due", settled: "Settled", pay_at_counter: "Pay at the counter or with your server",
    ask_bill: "Ask for the bill", server_notified: "Server notified", someone_over: "Someone will be over shortly to settle Table {n}.",
    ask_bill_hint: "Tapping this lets staff know you're ready to pay. They'll mark the table paid once you've settled up.",
    all_settled_thanks: "All settled — thank you!",
    t_added: "{name} added", t_signed_in: "Signed in — you'll earn stamps now", t_to_basket: "Added to your basket",
    t_unavailable: "Those items aren't available right now", t_server_notified: "Your server has been notified — bill coming to Table {n}",
    t_table_paid: "Table {n} marked paid", t_table_reopened: "Table {n} bill reopened", t_order_status: "Order {id} → {status}",
    t_item_removed: "Item removed", t_changes_saved: "Changes saved", t_photo_removed: "Photo removed",
    t_photo_added: "Photo added", t_photo_updated: "Photo updated", t_reset: "Demo data, menu & gallery reset",
    t_promo_queued: "Promo queued to {n} customer(s) (demo)",
    nav_orders: "Orders", nav_tables: "Tables", nav_menu: "Menu", nav_gallery: "Gallery", nav_brand: "Brand", nav_stats: "Statistics", nav_customers: "Customers",
    brand_title: "Brand & theme", brand_sub: "Pick a look for your café — colors and shapes update everywhere instantly.", theme_applied: "{name} theme applied", current_theme: "Current",
    staff_login_title: "Staff login", staff_login_sub: "This area is for café staff only.", staff_password: "Password", staff_signin: "Sign in", staff_wrong: "Wrong email or password", staff_signout: "Sign out", staff_back_customer: "← Back to customer view",
    staff_counter: "Staff · Counter", reset_demo: "Reset demo",
    live_orders: "Live orders", live_orders_sub: "Tickets arrive the moment a guest sends them. Tap to move an order along.",
    n_new: "{n} new", f_active: "Active", f_new: "New", f_preparing: "Preparing", f_served: "Served", f_all: "All",
    no_orders_admin_t: "No orders here yet", no_orders_admin_b: "Switch to the Customer view below, place an order, and it lands here instantly.",
    guest: "Guest", reward_tag: "reward", mark_paid: "Mark paid", mark_unpaid: "Mark unpaid",
    start_preparing: "Start preparing", mark_served: "Mark as served", reopen: "Reopen", served_btn: "Served",
    tables: "Tables", tables_sub: "Each occupied table and its bill. Owing tables come first.", tables_sub2: "See which tables have paid and which still owe.",
    no_tables_t: "No active tables", no_tables_b: "Once guests order, each occupied table shows up here with its running bill.",
    n_owing: "{n} owing · {total}", all_tables_settled: "All tables settled", owing: "Owing",
    bill_requested_alert: "🔔 Bill requested — guest is ready to pay", orders_word: "orders", order_word: "order",
    in_kitchen: "in kitchen", paid_in_full: "{total} paid in full", of_total: "of {total} total", reopen_bill: "Reopen bill", mark_paid_due: "Mark paid · {due}",
    menu_admin_sub: "Add items, set prices and ingredients, upload photos, or mark something sold out. Changes show to guests instantly.",
    add_item: "Add item", items_count: "{n} item(s)", empty_cat: "Nothing in this category yet.",
    add_item_title: "Add item", edit_item_title: "Edit item", menu_editor_sub: "What guests see on the menu.",
    upload_photo: "Upload photo", remove_photo: "Remove photo", paste_url: "Or paste an image URL",
    name: "Name", category: "Category", price: "Price", emoji: "Emoji", short_desc: "Short description",
    ingredients: "Ingredients", available_order: "Available to order", marked_sold_out: "Marked sold out", add_to_menu: "Add to menu",
    cancel: "Cancel", save_changes: "Save changes",
    gallery: "Gallery", gallery_sub: "The swiping photos guests see when they land. Reorder them, swap pictures, or change the captions.",
    add_photo: "Add photo", no_photos_t: "No photos yet", no_photos_b: "Add a few shots of your space and best plates — they're the first thing guests see.",
    no_caption: "No caption", uploaded_photo: "Uploaded photo", gradient_fallback: "Gradient + emoji fallback",
    add_photo_title: "Add photo", edit_photo_title: "Edit photo", gallery_editor_sub: "Shows full-width at the top of the guest home page.",
    caption: "Caption", fallback_colour: "Fallback colour", fallback_hint: "The emoji and colour show only if a photo fails to load — a graceful backup.",
    statistics: "Statistics", stats_sub: "A read on the day so far.", stats_sub2: "Numbers fill in as orders come through.",
    no_data_t: "No data yet", no_data_b: "Place a few orders from the customer view to see your stats come alive.",
    revenue: "Revenue", outstanding: "Outstanding", orders_stat: "Orders", avg_order: "Avg. order", members: "Members",
    repeat_guests: "Repeat guests", peak_hour: "Peak hour", best_sellers: "Best sellers", busiest_tables: "Busiest tables", orders_by_hour: "Orders by hour",
    customers: "Customers", customers_sub: "Your Bean Club members and their history. Email them about promotions and holidays.", customers_sub2: "Members who sign up while ordering show up here.",
    no_members_t: "No members yet", no_members_b: "When a guest joins the Bean Club from the customer view, you'll see them — with their email — right here.",
    email_all: "Email all members", col_name: "Name", col_email: "Email", col_orders: "Orders", col_stamps: "Stamps", col_spent: "Spent", col_joined: "Joined",
    email_btn: "Email", compose_promo: "Compose promo", to_label: "To:", all_members_n: "All members ({n})",
    subject: "Subject", message: "Message", send_promo: "Send promo", promo_demo_note: "Demo only — no real emails are sent. Connect an email provider to go live.",
    cat_hot: "Hot Coffees", cat_hot_b: "Pulled this morning, poured all day",
    cat_cold: "Cold Coffees", cat_cold_b: "Over ice, never bitter",
    cat_shots: "Espresso Shots", cat_shots_b: "Small, serious, fast",
    cat_fruit: "Fresh Fruit Drinks", cat_fruit_b: "Pressed to order",
    cat_shakes: "Shakes", cat_shakes_b: "Thick, cold, generous",
    cat_dessert: "Desserts", cat_dessert_b: "Baked in-house daily",
    ago_s: "{n}s ago", ago_m: "{n}m ago", ago_h: "{n}h ago",
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
    menu: "Menü", sold_out: "Tükendi", view_basket: "Sepeti gör", items: "ürün", item: "ürün",
    your_basket: "Sepetin", empty_basket_t: "Henüz boş", empty_basket_b: "Menüden lezzetli bir şey ekle.",
    browse_menu: "Menüye göz at", delivering_to: "Masa {n}'e getirilecek",
    note_for_item: "{name} için not — ör. yulaf sütü, şekersiz", order_note_label: "Tüm sipariş için not",
    order_note_ph: "Başka bir şey? Alerjiler, zamanlama, doğum günü mumu…",
    use_reward: "Ücretsiz ödülünü kullan", reward_applied: "Ödül uygulandı", reward_free_item: "{name} bizden", reward_add_item: "Kullanmak için filtre kahve veya donut ekle",
    subtotal: "Ara toplam", club_reward: "Bean Club ödülü", total: "Toplam",
    guest_1: "Misafir olarak sipariş veriyorsun.", guest_2: "bu siparişte damga kazanmak için.", send_order: "Siparişi mutfağa gönder",
    order_sent: "Sipariş gönderildi!", getting_ready: "Masa {n} için hazırlıyoruz.", order_id: "Sipariş {id}",
    step_received: "Alındı", step_preparing: "Hazırlanıyor", step_served: "Servis edildi",
    status_updates: "Durum mutfak çalıştıkça burada güncellenir. (İlerletmek için aşağıdan Kafe Yönetimi'ne geç.)",
    reward_unlocked: "Ödül açıldı! 🎁", stamp_earned: "+1 damga kazanıldı ⭐", view_account: "Hesabımı gör",
    missed_stamp_t: "Damga kaçtı", missed_stamp_b: "Üyeler her 5 siparişte ücretsiz filtre kahve veya donut alır.",
    join_club: "Bean Club'a katıl", order_more: "Başka bir şey sipariş et", view_bill: "Masa hesabımı gör",
    join_banner: "Her siparişte bir damga. Beş damga = ücretsiz filtre kahve veya donut.",
    your_name: "Adın", email: "E-posta", email_consent: "Sadece ödüller ve ara sıra ikramlar için e-posta atarız. Spam yok.",
    create_account: "Hesabımı oluştur", already_member: "Zaten üye misin? Yukarıya e-postanı gir.",
    account: "Hesap", not_signed_in: "Giriş yapılmadı", join_to_track: "Siparişleri takip etmek ve ödül toplamak için katıl.",
    orders_count: "{n} sipariş", order_history: "Sipariş geçmişi", no_orders_hist: "Henüz sipariş yok — geçmiş siparişlerin burada görünecek.",
    reorder: "Tekrar sipariş et", sign_out: "Çıkış yap",
    reward_ready_short: "🎁 Ücretsiz filtre kahve veya donut hazır — sepetinde kullan.",
    more_until: "Ücretsiz ikramına {n} sipariş kaldı.",
    bill_title: "Masa {n} hesabı", no_orders_yet: "Henüz sipariş yok", bill_builds: "Sipariş verdikçe hesabın oluşur.",
    reward_word: "Ödül", order_total: "Sipariş toplamı", total_ordered: "Toplam sipariş", already_paid: "Ödenen",
    amount_due: "Ödenecek tutar", settled: "Ödendi", pay_at_counter: "Kasada veya garsonla öde",
    ask_bill: "Hesabı iste", server_notified: "Garson bilgilendirildi", someone_over: "Masa {n} için birazdan birisi gelecek.",
    ask_bill_hint: "Buna dokunmak personele ödemeye hazır olduğunu bildirir. Ödeme sonrası masayı ödendi işaretlerler.",
    all_settled_thanks: "Hepsi ödendi — teşekkürler!",
    t_added: "{name} eklendi", t_signed_in: "Giriş yapıldı — artık damga kazanacaksın", t_to_basket: "Sepete eklendi",
    t_unavailable: "Bu ürünler şu an mevcut değil", t_server_notified: "Garson bilgilendirildi — hesap Masa {n}'e geliyor",
    t_table_paid: "Masa {n} ödendi olarak işaretlendi", t_table_reopened: "Masa {n} hesabı yeniden açıldı", t_order_status: "Sipariş {id} → {status}",
    t_item_removed: "Ürün kaldırıldı", t_changes_saved: "Değişiklikler kaydedildi", t_photo_removed: "Fotoğraf kaldırıldı",
    t_photo_added: "Fotoğraf eklendi", t_photo_updated: "Fotoğraf güncellendi", t_reset: "Demo verisi, menü ve galeri sıfırlandı",
    t_promo_queued: "Promosyon {n} müşteriye sıraya alındı (demo)",
    nav_orders: "Siparişler", nav_tables: "Masalar", nav_menu: "Menü", nav_gallery: "Galeri", nav_brand: "Marka", nav_stats: "İstatistik", nav_customers: "Müşteriler",
    brand_title: "Marka ve tema", brand_sub: "Kafen için bir görünüm seç — renkler ve şekiller her yerde anında güncellenir.", theme_applied: "{name} teması uygulandı", current_theme: "Geçerli",
    staff_login_title: "Personel girişi", staff_login_sub: "Bu alan yalnızca kafe personeli içindir.", staff_password: "Şifre", staff_signin: "Giriş yap", staff_wrong: "Hatalı e-posta veya şifre", staff_signout: "Çıkış yap", staff_back_customer: "← Müşteri görünümüne dön",
    staff_counter: "Personel · Kasa", reset_demo: "Demoyu sıfırla",
    live_orders: "Canlı siparişler", live_orders_sub: "Misafir gönderir göndermez fişler buraya düşer. İlerletmek için dokun.",
    n_new: "{n} yeni", f_active: "Aktif", f_new: "Yeni", f_preparing: "Hazırlanıyor", f_served: "Servis edildi", f_all: "Tümü",
    no_orders_admin_t: "Henüz sipariş yok", no_orders_admin_b: "Aşağıdan Müşteri görünümüne geç, sipariş ver ve anında burada belirsin.",
    guest: "Misafir", reward_tag: "ödül", mark_paid: "Ödendi işaretle", mark_unpaid: "Ödenmedi işaretle",
    start_preparing: "Hazırlamaya başla", mark_served: "Servis edildi işaretle", reopen: "Yeniden aç", served_btn: "Servis edildi",
    tables: "Masalar", tables_sub: "Her dolu masa ve hesabı. Borçlu masalar önce gelir.", tables_sub2: "Hangi masaların ödediğini, hangilerinin borçlu olduğunu gör.",
    no_tables_t: "Aktif masa yok", no_tables_b: "Misafirler sipariş verince her dolu masa hesabıyla burada görünür.",
    n_owing: "{n} borçlu · {total}", all_tables_settled: "Tüm masalar ödendi", owing: "Borçlu",
    bill_requested_alert: "🔔 Hesap istendi — misafir ödemeye hazır", orders_word: "sipariş", order_word: "sipariş",
    in_kitchen: "mutfakta", paid_in_full: "{total} tamamen ödendi", of_total: "/ {total} toplam", reopen_bill: "Hesabı yeniden aç", mark_paid_due: "Ödendi işaretle · {due}",
    menu_admin_sub: "Ürün ekle, fiyat ve içerik belirle, fotoğraf yükle veya tükendi işaretle. Değişiklikler anında misafirlere yansır.",
    add_item: "Ürün ekle", items_count: "{n} ürün", empty_cat: "Bu kategoride henüz bir şey yok.",
    add_item_title: "Ürün ekle", edit_item_title: "Ürünü düzenle", menu_editor_sub: "Misafirlerin menüde gördüğü.",
    upload_photo: "Fotoğraf yükle", remove_photo: "Fotoğrafı kaldır", paste_url: "Ya da bir görsel bağlantısı yapıştır",
    name: "Ad", category: "Kategori", price: "Fiyat", emoji: "Emoji", short_desc: "Kısa açıklama",
    ingredients: "İçindekiler", available_order: "Siparişe açık", marked_sold_out: "Tükendi olarak işaretli", add_to_menu: "Menüye ekle",
    cancel: "İptal", save_changes: "Değişiklikleri kaydet",
    gallery: "Galeri", gallery_sub: "Misafirlerin girişte gördüğü kayan fotoğraflar. Sırala, değiştir veya alt yazıları düzenle.",
    add_photo: "Fotoğraf ekle", no_photos_t: "Henüz fotoğraf yok", no_photos_b: "Mekanından ve en güzel tabaklarından birkaç kare ekle — misafirlerin gördüğü ilk şey.",
    no_caption: "Alt yazı yok", uploaded_photo: "Yüklenen fotoğraf", gradient_fallback: "Degrade + emoji yedeği",
    add_photo_title: "Fotoğraf ekle", edit_photo_title: "Fotoğrafı düzenle", gallery_editor_sub: "Misafir ana sayfasının en üstünde tam genişlikte görünür.",
    caption: "Alt yazı", fallback_colour: "Yedek renk", fallback_hint: "Emoji ve renk yalnızca fotoğraf yüklenmezse görünür — zarif bir yedek.",
    statistics: "İstatistik", stats_sub: "Günün şu ana kadarki özeti.", stats_sub2: "Siparişler geldikçe sayılar dolar.",
    no_data_t: "Henüz veri yok", no_data_b: "İstatistiklerin canlanması için müşteri görünümünden birkaç sipariş ver.",
    revenue: "Ciro", outstanding: "Bekleyen", orders_stat: "Sipariş", avg_order: "Ort. sipariş", members: "Üyeler",
    repeat_guests: "Tekrar gelen", peak_hour: "Yoğun saat", best_sellers: "En çok satanlar", busiest_tables: "En yoğun masalar", orders_by_hour: "Saate göre siparişler",
    customers: "Müşteriler", customers_sub: "Bean Club üyelerin ve geçmişleri. Promosyon ve bayram e-postaları gönder.", customers_sub2: "Sipariş verirken kaydolan üyeler burada görünür.",
    no_members_t: "Henüz üye yok", no_members_b: "Bir misafir müşteri görünümünden Bean Club'a katılınca onları — e-postasıyla — burada görürsün.",
    email_all: "Tüm üyelere e-posta", col_name: "Ad", col_email: "E-posta", col_orders: "Sipariş", col_stamps: "Damga", col_spent: "Harcama", col_joined: "Katıldı",
    email_btn: "E-posta", compose_promo: "Promosyon yaz", to_label: "Kime:", all_members_n: "Tüm üyeler ({n})",
    subject: "Konu", message: "Mesaj", send_promo: "Promosyonu gönder", promo_demo_note: "Sadece demo — gerçek e-posta gönderilmez. Yayına almak için bir e-posta sağlayıcısı bağla.",
    cat_hot: "Sıcak Kahveler", cat_hot_b: "Sabah demlendi, gün boyu servis",
    cat_cold: "Soğuk Kahveler", cat_cold_b: "Buzlu, asla acı değil",
    cat_shots: "Espresso Shotları", cat_shots_b: "Küçük, ciddi, hızlı",
    cat_fruit: "Taze Meyve İçecekleri", cat_fruit_b: "Siparişe göre sıkılır",
    cat_shakes: "Milkshake", cat_shakes_b: "Koyu, soğuk, bol",
    cat_dessert: "Tatlılar", cat_dessert_b: "Her gün yerinde pişer",
    ago_s: "{n}sn önce", ago_m: "{n}dk önce", ago_h: "{n}sa önce",
  },
  ru: {
    tagline: "Присаживайтесь — заказывайте со своего места, мы принесём.",
    sign_in: "Войти", hi_name: "Привет, {name}",
    scan_reading: "Считываем код стола…", scan_found: "Стол найден", scan_title: "Определяем ваш стол",
    scan_blurb: "У каждого стола свой уникальный QR — мы точно знаем, куда нести заказ. Номер стола вводить не нужно.",
    demo_control: "Демо-режим", demo_blurb: "В реальности это решает наклейка на столе. Нажмите, чтобы сымитировать другой стол:",
    table_n: "Стол {n}", not_your_table: "не ваш стол?",
    bill_open: "Счёт открыт", all_settled: "Всё оплачено", on_your_table: "{amt} на вашем столе", nothing_owing: "Спасибо — задолженности нет",
    unpaid: "Не оплачено", paid: "Оплачено",
    reward_ready_t: "Награда готова!", reward_ready_b: "Бесплатный фильтр-кофе или пончик уже ждёт в корзине.",
    bean_club: "Bean Club", stamps_progress: "{n}/{max} штампов — 5 дают бесплатный фильтр-кофе или пончик",
    signin_to_collect: "Войдите, чтобы получать штамп за каждый заказ", join_free: "Вступить в Bean Club — бесплатно",
    view_menu: "Открыть меню", in_basket: "{n} в корзине", whats_on: "Что сегодня",
    menu: "Меню", sold_out: "Закончилось", view_basket: "Корзина", items: "поз.", item: "поз.",
    your_basket: "Ваша корзина", empty_basket_t: "Пока пусто", empty_basket_b: "Добавьте что-нибудь вкусное из меню.",
    browse_menu: "Открыть меню", delivering_to: "Доставим на стол {n}",
    note_for_item: "Заметка к «{name}» — напр. овсяное молоко, без сахара", order_note_label: "Заметка ко всему заказу",
    order_note_ph: "Что-то ещё? Аллергии, время, праздничная свеча…",
    use_reward: "Использовать награду", reward_applied: "Награда применена", reward_free_item: "{name} за наш счёт", reward_add_item: "Добавьте фильтр-кофе или пончик, чтобы списать",
    subtotal: "Подытог", club_reward: "Награда Bean Club", total: "Итого",
    guest_1: "Заказ как гость.", guest_2: "чтобы получить штамп за этот заказ.", send_order: "Отправить на кухню",
    order_sent: "Заказ отправлен!", getting_ready: "Готовим для стола {n}.", order_id: "Заказ {id}",
    step_received: "Принят", step_preparing: "Готовится", step_served: "Подан",
    status_updates: "Статус обновляется по ходу работы кухни. (Переключитесь на «Админ кафе» внизу, чтобы продвинуть заказ.)",
    reward_unlocked: "Награда открыта! 🎁", stamp_earned: "+1 штамп ⭐", view_account: "Мой аккаунт",
    missed_stamp_t: "Штамп упущен", missed_stamp_b: "Участники получают бесплатный фильтр-кофе или пончик каждые 5 заказов.",
    join_club: "Вступить в Bean Club", order_more: "Заказать ещё", view_bill: "Счёт моего стола",
    join_banner: "Штамп за каждый заказ. Пять штампов = бесплатный фильтр-кофе или пончик.",
    your_name: "Ваше имя", email: "Эл. почта", email_consent: "Пишем только о наградах и редких угощениях. Без спама.",
    create_account: "Создать аккаунт", already_member: "Уже участник? Просто введите почту выше.",
    account: "Аккаунт", not_signed_in: "Вы не вошли", join_to_track: "Войдите, чтобы отслеживать заказы и копить награды.",
    orders_count: "{n} заказов", order_history: "История заказов", no_orders_hist: "Заказов пока нет — здесь появятся прошлые заказы.",
    reorder: "Повторить", sign_out: "Выйти",
    reward_ready_short: "🎁 Бесплатный фильтр-кофе или пончик готов — спишите в корзине.",
    more_until: "Ещё {n} заказ(ов) до бесплатного угощения.",
    bill_title: "Счёт стола {n}", no_orders_yet: "Заказов пока нет", bill_builds: "Счёт растёт по мере заказов.",
    reward_word: "Награда", order_total: "Сумма заказа", total_ordered: "Всего заказано", already_paid: "Уже оплачено",
    amount_due: "К оплате", settled: "Оплачено", pay_at_counter: "Оплата на кассе или у официанта",
    ask_bill: "Попросить счёт", server_notified: "Официант уведомлён", someone_over: "К столу {n} скоро подойдут.",
    ask_bill_hint: "Так персонал узнает, что вы готовы платить. Они отметят стол оплаченным после расчёта.",
    all_settled_thanks: "Всё оплачено — спасибо!",
    t_added: "{name} добавлено", t_signed_in: "Вы вошли — теперь копятся штампы", t_to_basket: "Добавлено в корзину",
    t_unavailable: "Этих позиций сейчас нет", t_server_notified: "Официант уведомлён — счёт несут на стол {n}",
    t_table_paid: "Стол {n} отмечен оплаченным", t_table_reopened: "Счёт стола {n} открыт заново", t_order_status: "Заказ {id} → {status}",
    t_item_removed: "Позиция удалена", t_changes_saved: "Изменения сохранены", t_photo_removed: "Фото удалено",
    t_photo_added: "Фото добавлено", t_photo_updated: "Фото обновлено", t_reset: "Демо-данные, меню и галерея сброшены",
    t_promo_queued: "Промо поставлено в очередь для {n} клиент(ов) (демо)",
    nav_orders: "Заказы", nav_tables: "Столы", nav_menu: "Меню", nav_gallery: "Галерея", nav_brand: "Бренд", nav_stats: "Статистика", nav_customers: "Клиенты",
    brand_title: "Бренд и тема", brand_sub: "Выберите стиль для своего кафе — цвета и формы обновятся везде мгновенно.", theme_applied: "Тема «{name}» применена", current_theme: "Текущая",
    staff_login_title: "Вход для персонала", staff_login_sub: "Этот раздел только для сотрудников кафе.", staff_password: "Пароль", staff_signin: "Войти", staff_wrong: "Неверная почта или пароль", staff_signout: "Выйти", staff_back_customer: "← Назад к виду клиента",
    staff_counter: "Персонал · Касса", reset_demo: "Сбросить демо",
    live_orders: "Текущие заказы", live_orders_sub: "Чеки появляются сразу после отправки гостем. Нажмите, чтобы продвинуть заказ.",
    n_new: "{n} новых", f_active: "Активные", f_new: "Новые", f_preparing: "Готовятся", f_served: "Поданы", f_all: "Все",
    no_orders_admin_t: "Заказов пока нет", no_orders_admin_b: "Переключитесь на вид «Клиент» внизу, оформите заказ — и он мгновенно появится здесь.",
    guest: "Гость", reward_tag: "награда", mark_paid: "Отметить оплаченным", mark_unpaid: "Отметить неоплаченным",
    start_preparing: "Начать готовить", mark_served: "Отметить поданным", reopen: "Открыть снова", served_btn: "Подан",
    tables: "Столы", tables_sub: "Каждый занятый стол и его счёт. Должники — первыми.", tables_sub2: "Видно, какие столы оплатили, а какие ещё должны.",
    no_tables_t: "Нет активных столов", no_tables_b: "Как только гости закажут, каждый занятый стол появится здесь со своим счётом.",
    n_owing: "{n} с долгом · {total}", all_tables_settled: "Все столы оплачены", owing: "Долг",
    bill_requested_alert: "🔔 Запрошен счёт — гость готов платить", orders_word: "заказов", order_word: "заказ",
    in_kitchen: "на кухне", paid_in_full: "{total} оплачено полностью", of_total: "из {total}", reopen_bill: "Открыть счёт", mark_paid_due: "Оплачено · {due}",
    menu_admin_sub: "Добавляйте позиции, задавайте цены и состав, загружайте фото или отмечайте «закончилось». Изменения сразу видны гостям.",
    add_item: "Добавить позицию", items_count: "{n} поз.", empty_cat: "В этой категории пока пусто.",
    add_item_title: "Добавить позицию", edit_item_title: "Изменить позицию", menu_editor_sub: "То, что гости видят в меню.",
    upload_photo: "Загрузить фото", remove_photo: "Удалить фото", paste_url: "Или вставьте ссылку на изображение",
    name: "Название", category: "Категория", price: "Цена", emoji: "Эмодзи", short_desc: "Краткое описание",
    ingredients: "Состав", available_order: "Доступно для заказа", marked_sold_out: "Отмечено «закончилось»", add_to_menu: "Добавить в меню",
    cancel: "Отмена", save_changes: "Сохранить",
    gallery: "Галерея", gallery_sub: "Листающиеся фото, которые гости видят при входе. Переставляйте, меняйте и редактируйте подписи.",
    add_photo: "Добавить фото", no_photos_t: "Фото пока нет", no_photos_b: "Добавьте пару кадров заведения и лучших блюд — это первое, что видят гости.",
    no_caption: "Без подписи", uploaded_photo: "Загруженное фото", gradient_fallback: "Градиент + эмодзи (запасной)",
    add_photo_title: "Добавить фото", edit_photo_title: "Изменить фото", gallery_editor_sub: "Показывается во всю ширину вверху главной страницы гостя.",
    caption: "Подпись", fallback_colour: "Запасной цвет", fallback_hint: "Эмодзи и цвет показываются, только если фото не загрузилось — аккуратный запасной вариант.",
    statistics: "Статистика", stats_sub: "Срез по дню.", stats_sub2: "Цифры заполняются по мере заказов.",
    no_data_t: "Данных пока нет", no_data_b: "Оформите несколько заказов из вида клиента, чтобы статистика ожила.",
    revenue: "Выручка", outstanding: "К оплате", orders_stat: "Заказы", avg_order: "Средний чек", members: "Участники",
    repeat_guests: "Повторные гости", peak_hour: "Пиковый час", best_sellers: "Хиты продаж", busiest_tables: "Самые активные столы", orders_by_hour: "Заказы по часам",
    customers: "Клиенты", customers_sub: "Участники Bean Club и их история. Пишите им о промо и праздниках.", customers_sub2: "Участники, зарегистрировавшиеся при заказе, появятся здесь.",
    no_members_t: "Участников пока нет", no_members_b: "Когда гость вступит в Bean Club из вида клиента, вы увидите его — с почтой — здесь.",
    email_all: "Письмо всем участникам", col_name: "Имя", col_email: "Почта", col_orders: "Заказы", col_stamps: "Штампы", col_spent: "Потрачено", col_joined: "Регистрация",
    email_btn: "Письмо", compose_promo: "Составить промо", to_label: "Кому:", all_members_n: "Все участники ({n})",
    subject: "Тема", message: "Сообщение", send_promo: "Отправить промо", promo_demo_note: "Только демо — реальные письма не отправляются. Подключите почтовый сервис для запуска.",
    cat_hot: "Горячий кофе", cat_hot_b: "Заварен утром, подаём весь день",
    cat_cold: "Холодный кофе", cat_cold_b: "Со льдом, без горечи",
    cat_shots: "Эспрессо", cat_shots_b: "Маленько, серьёзно, быстро",
    cat_fruit: "Свежие фруктовые напитки", cat_fruit_b: "Отжимаем под заказ",
    cat_shakes: "Шейки", cat_shakes_b: "Густо, холодно, щедро",
    cat_dessert: "Десерты", cat_dessert_b: "Печём у себя каждый день",
    ago_s: "{n} с назад", ago_m: "{n} мин назад", ago_h: "{n} ч назад",
  },
  de: {
    tagline: "Setz dich — bestell vom Platz aus, wir bringen's.",
    sign_in: "Anmelden", hi_name: "Hallo, {name}",
    scan_reading: "Tischcode wird gelesen…", scan_found: "Tisch gefunden", scan_title: "Dein Tisch wird erkannt",
    scan_blurb: "Jeder Tisch hat seinen eigenen QR-Code — so wissen wir genau, wohin deine Bestellung kommt. Keine Tischnummer nötig.",
    demo_control: "Demo-Steuerung", demo_blurb: "In echt entscheidet der Aufkleber am Tisch. Tippe, um einen anderen Tisch zu simulieren:",
    table_n: "Tisch {n}", not_your_table: "nicht dein Tisch?",
    bill_open: "Rechnung offen", all_settled: "Alles bezahlt", on_your_table: "{amt} auf deinem Tisch", nothing_owing: "Danke — nichts offen",
    unpaid: "Offen", paid: "Bezahlt",
    reward_ready_t: "Deine Belohnung ist bereit!", reward_ready_b: "Ein gratis Filterkaffee oder Donut wartet im Korb.",
    bean_club: "Bean Club", stamps_progress: "{n}/{max} Stempel — 5 bringen einen gratis Filterkaffee oder Donut",
    signin_to_collect: "Melde dich an, um bei jeder Bestellung einen Stempel zu sammeln", join_free: "Dem Bean Club beitreten — gratis",
    view_menu: "Speisekarte ansehen", in_basket: "{n} im Korb", whats_on: "Heute im Angebot",
    menu: "Speisekarte", sold_out: "Ausverkauft", view_basket: "Korb ansehen", items: "Artikel", item: "Artikel",
    your_basket: "Dein Korb", empty_basket_t: "Noch leer", empty_basket_b: "Füge etwas Leckeres aus der Karte hinzu.",
    browse_menu: "Karte durchstöbern", delivering_to: "Lieferung an Tisch {n}",
    note_for_item: "Notiz für {name} — z. B. Hafermilch, ohne Zucker", order_note_label: "Notiz für die ganze Bestellung",
    order_note_ph: "Noch etwas? Allergien, Timing, eine Geburtstagskerze…",
    use_reward: "Gratis-Belohnung einlösen", reward_applied: "Belohnung angewendet", reward_free_item: "{name} geht auf uns", reward_add_item: "Filterkaffee oder Donut hinzufügen zum Einlösen",
    subtotal: "Zwischensumme", club_reward: "Bean-Club-Belohnung", total: "Summe",
    guest_1: "Bestellung als Gast.", guest_2: "um einen Stempel für diese Bestellung zu erhalten.", send_order: "An die Küche senden",
    order_sent: "Bestellung gesendet!", getting_ready: "Wir bereiten sie für Tisch {n} vor.", order_id: "Bestellung {id}",
    step_received: "Erhalten", step_preparing: "In Zubereitung", step_served: "Serviert",
    status_updates: "Der Status aktualisiert sich hier, während die Küche arbeitet. (Unten zu Café-Admin wechseln, um weiterzuschalten.)",
    reward_unlocked: "Belohnung freigeschaltet! 🎁", stamp_earned: "+1 Stempel ⭐", view_account: "Mein Konto ansehen",
    missed_stamp_t: "Stempel verpasst", missed_stamp_b: "Mitglieder erhalten alle 5 Bestellungen einen gratis Filterkaffee oder Donut.",
    join_club: "Dem Bean Club beitreten", order_more: "Etwas anderes bestellen", view_bill: "Tischrechnung ansehen",
    join_banner: "Ein Stempel pro Bestellung. Fünf Stempel = gratis Filterkaffee oder Donut.",
    your_name: "Dein Name", email: "E-Mail", email_consent: "Wir mailen dir nur zu Belohnungen und gelegentlichen Leckereien. Kein Spam.",
    create_account: "Konto erstellen", already_member: "Schon Mitglied? Gib einfach oben deine E-Mail ein.",
    account: "Konto", not_signed_in: "Nicht angemeldet", join_to_track: "Tritt bei, um Bestellungen zu verfolgen und Belohnungen zu sammeln.",
    orders_count: "{n} Bestellungen", order_history: "Bestellverlauf", no_orders_hist: "Noch keine Bestellungen — frühere erscheinen hier.",
    reorder: "Erneut bestellen", sign_out: "Abmelden",
    reward_ready_short: "🎁 Gratis Filterkaffee oder Donut bereit — im Korb einlösen.",
    more_until: "Noch {n} Bestellung(en) bis zur gratis Leckerei.",
    bill_title: "Rechnung Tisch {n}", no_orders_yet: "Noch keine Bestellungen", bill_builds: "Deine Rechnung wächst mit jeder Bestellung.",
    reward_word: "Belohnung", order_total: "Bestellsumme", total_ordered: "Gesamt bestellt", already_paid: "Bereits bezahlt",
    amount_due: "Offener Betrag", settled: "Bezahlt", pay_at_counter: "Zahlung an der Theke oder beim Kellner",
    ask_bill: "Rechnung anfordern", server_notified: "Kellner benachrichtigt", someone_over: "Es kommt gleich jemand zu Tisch {n}.",
    ask_bill_hint: "Damit weiß das Personal, dass du zahlen möchtest. Der Tisch wird nach dem Bezahlen als bezahlt markiert.",
    all_settled_thanks: "Alles bezahlt — danke!",
    t_added: "{name} hinzugefügt", t_signed_in: "Angemeldet — du sammelst jetzt Stempel", t_to_basket: "Zum Korb hinzugefügt",
    t_unavailable: "Diese Artikel sind gerade nicht verfügbar", t_server_notified: "Kellner benachrichtigt — Rechnung kommt zu Tisch {n}",
    t_table_paid: "Tisch {n} als bezahlt markiert", t_table_reopened: "Rechnung Tisch {n} wieder geöffnet", t_order_status: "Bestellung {id} → {status}",
    t_item_removed: "Artikel entfernt", t_changes_saved: "Änderungen gespeichert", t_photo_removed: "Foto entfernt",
    t_photo_added: "Foto hinzugefügt", t_photo_updated: "Foto aktualisiert", t_reset: "Demodaten, Karte & Galerie zurückgesetzt",
    t_promo_queued: "Promo für {n} Kund(en) eingereiht (Demo)",
    nav_orders: "Bestellungen", nav_tables: "Tische", nav_menu: "Karte", nav_gallery: "Galerie", nav_brand: "Marke", nav_stats: "Statistik", nav_customers: "Kunden",
    brand_title: "Marke & Theme", brand_sub: "Wähle einen Look für dein Café — Farben und Formen aktualisieren sich überall sofort.", theme_applied: "Theme „{name}“ angewendet", current_theme: "Aktuell",
    staff_login_title: "Mitarbeiter-Login", staff_login_sub: "Dieser Bereich ist nur für Café-Personal.", staff_password: "Passwort", staff_signin: "Anmelden", staff_wrong: "Falsche E-Mail oder Passwort", staff_signout: "Abmelden", staff_back_customer: "← Zurück zur Kundenansicht",
    staff_counter: "Personal · Theke", reset_demo: "Demo zurücksetzen",
    live_orders: "Live-Bestellungen", live_orders_sub: "Bons erscheinen, sobald ein Gast sendet. Tippe, um eine Bestellung weiterzuschalten.",
    n_new: "{n} neu", f_active: "Aktiv", f_new: "Neu", f_preparing: "In Zubereitung", f_served: "Serviert", f_all: "Alle",
    no_orders_admin_t: "Noch keine Bestellungen", no_orders_admin_b: "Unten zur Kundenansicht wechseln, bestellen — und es erscheint sofort hier.",
    guest: "Gast", reward_tag: "Belohnung", mark_paid: "Als bezahlt", mark_unpaid: "Als offen",
    start_preparing: "Zubereitung starten", mark_served: "Als serviert", reopen: "Wieder öffnen", served_btn: "Serviert",
    tables: "Tische", tables_sub: "Jeder besetzte Tisch und seine Rechnung. Offene zuerst.", tables_sub2: "Sieh, welche Tische bezahlt haben und welche noch offen sind.",
    no_tables_t: "Keine aktiven Tische", no_tables_b: "Sobald Gäste bestellen, erscheint jeder besetzte Tisch hier mit laufender Rechnung.",
    n_owing: "{n} offen · {total}", all_tables_settled: "Alle Tische bezahlt", owing: "Offen",
    bill_requested_alert: "🔔 Rechnung angefordert — Gast möchte zahlen", orders_word: "Bestellungen", order_word: "Bestellung",
    in_kitchen: "in der Küche", paid_in_full: "{total} voll bezahlt", of_total: "von {total}", reopen_bill: "Rechnung öffnen", mark_paid_due: "Bezahlt · {due}",
    menu_admin_sub: "Artikel hinzufügen, Preise und Zutaten setzen, Fotos hochladen oder ausverkauft markieren. Änderungen sind sofort für Gäste sichtbar.",
    add_item: "Artikel hinzufügen", items_count: "{n} Artikel", empty_cat: "In dieser Kategorie noch nichts.",
    add_item_title: "Artikel hinzufügen", edit_item_title: "Artikel bearbeiten", menu_editor_sub: "Was Gäste auf der Karte sehen.",
    upload_photo: "Foto hochladen", remove_photo: "Foto entfernen", paste_url: "Oder Bild-URL einfügen",
    name: "Name", category: "Kategorie", price: "Preis", emoji: "Emoji", short_desc: "Kurzbeschreibung",
    ingredients: "Zutaten", available_order: "Bestellbar", marked_sold_out: "Als ausverkauft markiert", add_to_menu: "Zur Karte hinzufügen",
    cancel: "Abbrechen", save_changes: "Änderungen speichern",
    gallery: "Galerie", gallery_sub: "Die Wischfotos, die Gäste beim Ankommen sehen. Sortieren, austauschen oder Bildunterschriften ändern.",
    add_photo: "Foto hinzufügen", no_photos_t: "Noch keine Fotos", no_photos_b: "Füge ein paar Aufnahmen deines Lokals und der besten Teller hinzu — das Erste, was Gäste sehen.",
    no_caption: "Keine Bildunterschrift", uploaded_photo: "Hochgeladenes Foto", gradient_fallback: "Verlauf + Emoji (Ersatz)",
    add_photo_title: "Foto hinzufügen", edit_photo_title: "Foto bearbeiten", gallery_editor_sub: "Wird ganz oben auf der Gast-Startseite in voller Breite gezeigt.",
    caption: "Bildunterschrift", fallback_colour: "Ersatzfarbe", fallback_hint: "Emoji und Farbe erscheinen nur, wenn ein Foto nicht lädt — ein eleganter Ersatz.",
    statistics: "Statistik", stats_sub: "Ein Blick auf den bisherigen Tag.", stats_sub2: "Die Zahlen füllen sich mit eingehenden Bestellungen.",
    no_data_t: "Noch keine Daten", no_data_b: "Gib ein paar Bestellungen aus der Kundenansicht auf, damit die Statistik lebendig wird.",
    revenue: "Umsatz", outstanding: "Offen", orders_stat: "Bestellungen", avg_order: "Ø Bestellung", members: "Mitglieder",
    repeat_guests: "Stammgäste", peak_hour: "Stoßzeit", best_sellers: "Bestseller", busiest_tables: "Aktivste Tische", orders_by_hour: "Bestellungen nach Stunde",
    customers: "Kunden", customers_sub: "Deine Bean-Club-Mitglieder und ihr Verlauf. Maile ihnen zu Promos und Feiertagen.", customers_sub2: "Mitglieder, die beim Bestellen beitreten, erscheinen hier.",
    no_members_t: "Noch keine Mitglieder", no_members_b: "Wenn ein Gast aus der Kundenansicht dem Bean Club beitritt, siehst du ihn — mit E-Mail — genau hier.",
    email_all: "E-Mail an alle Mitglieder", col_name: "Name", col_email: "E-Mail", col_orders: "Bestellungen", col_stamps: "Stempel", col_spent: "Ausgegeben", col_joined: "Beigetreten",
    email_btn: "E-Mail", compose_promo: "Promo verfassen", to_label: "An:", all_members_n: "Alle Mitglieder ({n})",
    subject: "Betreff", message: "Nachricht", send_promo: "Promo senden", promo_demo_note: "Nur Demo — es werden keine echten E-Mails gesendet. Für den Livebetrieb einen E-Mail-Anbieter verbinden.",
    cat_hot: "Heiße Kaffees", cat_hot_b: "Heute früh gebrüht, den ganzen Tag",
    cat_cold: "Kalte Kaffees", cat_cold_b: "Auf Eis, nie bitter",
    cat_shots: "Espresso-Shots", cat_shots_b: "Klein, ernst, schnell",
    cat_fruit: "Frische Fruchtgetränke", cat_fruit_b: "Frisch gepresst auf Bestellung",
    cat_shakes: "Shakes", cat_shakes_b: "Dick, kalt, großzügig",
    cat_dessert: "Desserts", cat_dessert_b: "Täglich hausgemacht",
    ago_s: "vor {n} Sek.", ago_m: "vor {n} Min.", ago_h: "vor {n} Std.",
  },
  ar: {
    tagline: "اسحب كرسيًا — اطلب من مكانك وسنحضره إليك.",
    sign_in: "تسجيل الدخول", hi_name: "مرحبًا، {name}",
    scan_reading: "جارٍ قراءة رمز الطاولة…", scan_found: "تم العثور على الطاولة", scan_title: "جارٍ تحديد طاولتك",
    scan_blurb: "كل طاولة لها رمز QR فريد، لذا نعرف بالضبط أين نحضر طلبك — لا حاجة لإدخال رقم الطاولة.",
    demo_control: "وضع العرض", demo_blurb: "في الواقع يحدد ذلك الملصق على الطاولة. اضغط لمحاكاة مسح طاولة مختلفة:",
    table_n: "طاولة {n}", not_your_table: "ليست طاولتك؟",
    bill_open: "الفاتورة مفتوحة", all_settled: "تم الدفع بالكامل", on_your_table: "{amt} على طاولتك", nothing_owing: "شكرًا — لا يوجد مستحق",
    unpaid: "غير مدفوع", paid: "مدفوع",
    reward_ready_t: "مكافأتك جاهزة!", reward_ready_b: "قهوة فلتر أو دونات مجانية بانتظارك في السلة.",
    bean_club: "نادي Bean", stamps_progress: "{n}/{max} ختم — 5 أختام تمنحك قهوة فلتر أو دونات مجانية",
    signin_to_collect: "سجّل الدخول لتجمع ختمًا مع كل طلب", join_free: "انضم إلى نادي Bean — مجانًا",
    view_menu: "عرض القائمة", in_basket: "{n} في السلة", whats_on: "عروض اليوم",
    menu: "القائمة", sold_out: "نفد", view_basket: "عرض السلة", items: "عناصر", item: "عنصر",
    your_basket: "سلتك", empty_basket_t: "لا شيء بعد", empty_basket_b: "أضف شيئًا لذيذًا من القائمة.",
    browse_menu: "تصفح القائمة", delivering_to: "التوصيل إلى الطاولة {n}",
    note_for_item: "ملاحظة لـ {name} — مثلًا حليب شوفان، بدون سكر", order_note_label: "ملاحظة للطلب بالكامل",
    order_note_ph: "أي شيء آخر؟ حساسية، توقيت، شمعة عيد ميلاد…",
    use_reward: "استخدم مكافأتك المجانية", reward_applied: "تم تطبيق المكافأة", reward_free_item: "{name} على حسابنا", reward_add_item: "أضف قهوة فلتر أو دونات للاستبدال",
    subtotal: "المجموع الفرعي", club_reward: "مكافأة نادي Bean", total: "الإجمالي",
    guest_1: "الطلب كضيف.", guest_2: "لكسب ختم على هذا الطلب.", send_order: "أرسل الطلب إلى المطبخ",
    order_sent: "تم إرسال الطلب!", getting_ready: "نحضّره للطاولة {n}.", order_id: "طلب {id}",
    step_received: "تم الاستلام", step_preparing: "قيد التحضير", step_served: "تم التقديم",
    status_updates: "يتم تحديث الحالة هنا أثناء عمل المطبخ. (انتقل إلى إدارة المقهى بالأسفل لتحريك الطلب.)",
    reward_unlocked: "تم فتح المكافأة! 🎁", stamp_earned: "+1 ختم ⭐", view_account: "عرض حسابي",
    missed_stamp_t: "فاتك ختم", missed_stamp_b: "يحصل الأعضاء على قهوة فلتر أو دونات مجانية كل 5 طلبات.",
    join_club: "انضم إلى نادي Bean", order_more: "اطلب شيئًا آخر", view_bill: "عرض فاتورة طاولتي",
    join_banner: "ختم مع كل طلب. خمسة أختام = قهوة فلتر أو دونات مجانية.",
    your_name: "اسمك", email: "البريد الإلكتروني", email_consent: "نراسلك فقط بخصوص المكافآت وبعض المفاجآت أحيانًا. بدون إزعاج.",
    create_account: "إنشاء حسابي", already_member: "عضو بالفعل؟ فقط أدخل بريدك أعلاه.",
    account: "الحساب", not_signed_in: "لم تسجّل الدخول", join_to_track: "انضم لتتبع الطلبات وجمع المكافآت.",
    orders_count: "{n} طلبات", order_history: "سجل الطلبات", no_orders_hist: "لا طلبات بعد — ستظهر طلباتك السابقة هنا.",
    reorder: "أعد الطلب", sign_out: "تسجيل الخروج",
    reward_ready_short: "🎁 قهوة فلتر أو دونات مجانية جاهزة — استبدلها في السلة.",
    more_until: "بقي {n} طلب/طلبات حتى مكافأتك المجانية.",
    bill_title: "فاتورة الطاولة {n}", no_orders_yet: "لا طلبات بعد", bill_builds: "تتراكم فاتورتك مع كل طلب.",
    reward_word: "مكافأة", order_total: "إجمالي الطلب", total_ordered: "إجمالي ما طُلب", already_paid: "المدفوع",
    amount_due: "المبلغ المستحق", settled: "مدفوع", pay_at_counter: "الدفع عند الكاشير أو مع النادل",
    ask_bill: "اطلب الفاتورة", server_notified: "تم إبلاغ النادل", someone_over: "سيأتي أحدهم قريبًا إلى الطاولة {n}.",
    ask_bill_hint: "هذا يُعلم الموظفين أنك جاهز للدفع. سيحدّدون الطاولة كمدفوعة بعد السداد.",
    all_settled_thanks: "تم الدفع بالكامل — شكرًا!",
    t_added: "تمت إضافة {name}", t_signed_in: "تم تسجيل الدخول — ستجمع أختامًا الآن", t_to_basket: "أُضيف إلى سلتك",
    t_unavailable: "هذه العناصر غير متوفرة حاليًا", t_server_notified: "تم إبلاغ النادل — الفاتورة في طريقها للطاولة {n}",
    t_table_paid: "تم تحديد الطاولة {n} كمدفوعة", t_table_reopened: "أُعيد فتح فاتورة الطاولة {n}", t_order_status: "طلب {id} ← {status}",
    t_item_removed: "تمت إزالة العنصر", t_changes_saved: "تم حفظ التغييرات", t_photo_removed: "تمت إزالة الصورة",
    t_photo_added: "تمت إضافة الصورة", t_photo_updated: "تم تحديث الصورة", t_reset: "تمت إعادة ضبط بيانات العرض والقائمة والمعرض",
    t_promo_queued: "تم وضع العرض في قائمة الإرسال لـ {n} عميل (عرض)",
    nav_orders: "الطلبات", nav_tables: "الطاولات", nav_menu: "القائمة", nav_gallery: "المعرض", nav_brand: "الهوية", nav_stats: "الإحصاءات", nav_customers: "العملاء",
    brand_title: "الهوية والتصميم", brand_sub: "اختر مظهرًا لمقهاك — تتحدّث الألوان والأشكال في كل مكان فورًا.", theme_applied: "تم تطبيق تصميم {name}", current_theme: "الحالي",
    staff_login_title: "دخول الموظفين", staff_login_sub: "هذه المنطقة لموظفي المقهى فقط.", staff_password: "كلمة المرور", staff_signin: "تسجيل الدخول", staff_wrong: "البريد أو كلمة المرور غير صحيحة", staff_signout: "تسجيل الخروج", staff_back_customer: "← العودة إلى عرض العميل",
    staff_counter: "الموظفون · الكاشير", reset_demo: "إعادة ضبط العرض",
    live_orders: "الطلبات المباشرة", live_orders_sub: "تصل الفواتير لحظة إرسال الضيف. اضغط لتحريك الطلب.",
    n_new: "{n} جديدة", f_active: "نشطة", f_new: "جديدة", f_preparing: "قيد التحضير", f_served: "مُقدّمة", f_all: "الكل",
    no_orders_admin_t: "لا طلبات هنا بعد", no_orders_admin_b: "انتقل إلى عرض العميل بالأسفل، اطلب، وسيظهر هنا فورًا.",
    guest: "ضيف", reward_tag: "مكافأة", mark_paid: "تحديد كمدفوع", mark_unpaid: "تحديد كغير مدفوع",
    start_preparing: "ابدأ التحضير", mark_served: "تحديد كمُقدّم", reopen: "إعادة فتح", served_btn: "مُقدّم",
    tables: "الطاولات", tables_sub: "كل طاولة مشغولة وفاتورتها. الطاولات المدينة أولًا.", tables_sub2: "اطّلع على الطاولات التي دفعت والتي لا تزال مدينة.",
    no_tables_t: "لا طاولات نشطة", no_tables_b: "بمجرد أن يطلب الضيوف، تظهر كل طاولة مشغولة هنا مع فاتورتها الجارية.",
    n_owing: "{n} مدينة · {total}", all_tables_settled: "كل الطاولات مدفوعة", owing: "مدينة",
    bill_requested_alert: "🔔 طُلبت الفاتورة — الضيف جاهز للدفع", orders_word: "طلبات", order_word: "طلب",
    in_kitchen: "في المطبخ", paid_in_full: "{total} مدفوعة بالكامل", of_total: "من {total}", reopen_bill: "إعادة فتح الفاتورة", mark_paid_due: "تحديد كمدفوع · {due}",
    menu_admin_sub: "أضف عناصر، حدّد الأسعار والمكونات، ارفع الصور أو علّم نفاد الصنف. تظهر التغييرات للضيوف فورًا.",
    add_item: "إضافة عنصر", items_count: "{n} عنصر", empty_cat: "لا شيء في هذه الفئة بعد.",
    add_item_title: "إضافة عنصر", edit_item_title: "تعديل العنصر", menu_editor_sub: "ما يراه الضيوف في القائمة.",
    upload_photo: "رفع صورة", remove_photo: "إزالة الصورة", paste_url: "أو ألصق رابط صورة",
    name: "الاسم", category: "الفئة", price: "السعر", emoji: "إيموجي", short_desc: "وصف مختصر",
    ingredients: "المكونات", available_order: "متاح للطلب", marked_sold_out: "معلّم كنافد", add_to_menu: "أضف إلى القائمة",
    cancel: "إلغاء", save_changes: "حفظ التغييرات",
    gallery: "المعرض", gallery_sub: "الصور المتحركة التي يراها الضيوف عند الدخول. أعد ترتيبها، بدّلها، أو غيّر التسميات.",
    add_photo: "إضافة صورة", no_photos_t: "لا صور بعد", no_photos_b: "أضف بعض اللقطات لمكانك وأطباقك الأفضل — أول ما يراه الضيوف.",
    no_caption: "بدون تسمية", uploaded_photo: "صورة مرفوعة", gradient_fallback: "تدرّج + إيموجي (بديل)",
    add_photo_title: "إضافة صورة", edit_photo_title: "تعديل الصورة", gallery_editor_sub: "تظهر بعرض كامل أعلى صفحة الضيف الرئيسية.",
    caption: "التسمية", fallback_colour: "اللون البديل", fallback_hint: "يظهر الإيموجي واللون فقط إذا تعذّر تحميل الصورة — بديل أنيق.",
    statistics: "الإحصاءات", stats_sub: "نظرة على اليوم حتى الآن.", stats_sub2: "تمتلئ الأرقام مع ورود الطلبات.",
    no_data_t: "لا بيانات بعد", no_data_b: "أنشئ بعض الطلبات من عرض العميل لتنبض إحصاءاتك بالحياة.",
    revenue: "الإيراد", outstanding: "المستحق", orders_stat: "الطلبات", avg_order: "متوسط الطلب", members: "الأعضاء",
    repeat_guests: "الزوار المتكررون", peak_hour: "ساعة الذروة", best_sellers: "الأكثر مبيعًا", busiest_tables: "أكثر الطاولات ازدحامًا", orders_by_hour: "الطلبات حسب الساعة",
    customers: "العملاء", customers_sub: "أعضاء نادي Bean وسجلهم. راسلهم بالعروض والأعياد.", customers_sub2: "يظهر هنا الأعضاء الذين يسجّلون أثناء الطلب.",
    no_members_t: "لا أعضاء بعد", no_members_b: "عندما ينضم ضيف إلى نادي Bean من عرض العميل، ستراه — مع بريده — هنا.",
    email_all: "راسل كل الأعضاء", col_name: "الاسم", col_email: "البريد", col_orders: "الطلبات", col_stamps: "الأختام", col_spent: "أنفق", col_joined: "انضم",
    email_btn: "بريد", compose_promo: "اكتب عرضًا", to_label: "إلى:", all_members_n: "كل الأعضاء ({n})",
    subject: "الموضوع", message: "الرسالة", send_promo: "أرسل العرض", promo_demo_note: "عرض فقط — لا تُرسل رسائل حقيقية. اربط مزوّد بريد للتفعيل.",
    cat_hot: "قهوة ساخنة", cat_hot_b: "محضّرة صباحًا، تُقدّم طوال اليوم",
    cat_cold: "قهوة باردة", cat_cold_b: "على الثلج، بلا مرارة",
    cat_shots: "جرعات إسبريسو", cat_shots_b: "صغيرة، جادة، سريعة",
    cat_fruit: "مشروبات فواكه طازجة", cat_fruit_b: "تُعصر عند الطلب",
    cat_shakes: "ميلك شيك", cat_shakes_b: "كثيف، بارد، سخي",
    cat_dessert: "حلويات", cat_dessert_b: "تُخبز يوميًا في المكان",
    ago_s: "قبل {n} ث", ago_m: "قبل {n} د", ago_h: "قبل {n} س",
  },
};

const LangCtx = createContext({ lang: "en", setLang: () => {}, dir: "ltr", t: (k) => k });
const useT = () => useContext(LangCtx);
const ThemeCtx = createContext({ themeId: "hearth", setThemeId: () => {} });
const useTheme = () => useContext(ThemeCtx);
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

const K_ORDERS = "hb:orders";
const K_CUSTOMERS = "hb:customers";
const K_MENU = "hb:menu:v2";
const K_SLIDES = "hb:slides";
const K_LANG = "hb:lang";
const K_THEME = "hb:theme";
const K_STAFF = "hb:staff_session";

/* ------------------------------------------------------------------ */
/*  STORAGE LAYER                                                      */
/*  Shared café data (orders, customers, menu, gallery) lives in a    */
/*  Supabase table called "app_state" — one row per key, value is     */
/*  JSON. This is what lets every phone and the admin screen see the  */
/*  same data and update live.                                        */
/*                                                                    */
/*  Per-device settings (language, theme, staff login) stay in the    */
/*  browser's own localStorage — they shouldn't be shared.            */
/* ------------------------------------------------------------------ */

// Supabase bağlantı bilgileri. supabase.com → projen → Settings → API
// sayfasından alacaksın ve buraya yapıştıracaksın.
const SUPABASE_URL = https://lmxgdsjiatkmwounikvk.supabase.co
";       // örn: https://abcdxyz.supabase.co
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteGdkc2ppYXRrbXdvdW5pa3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzMzNjQsImV4cCI6MjA5NzIwOTM2NH0.ENft4QX2JZ1rBf_yokbYvgzkyJrJ4VRMOoApvouSHt0";   // uzun "anon public" anahtarı

const SUPA_READY = !/BURAYA_/.test(SUPABASE_URL) && !/BURAYA_/.test(SUPABASE_ANON_KEY);
const SHARED_KEYS = [K_ORDERS, K_CUSTOMERS, K_MENU, K_SLIDES];
const LOCAL_KEYS = [K_LANG, K_THEME, K_STAFF];

function supaHeaders() {
  return { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY, "Content-Type": "application/json" };
}

// --- device-local (localStorage) for personal settings ---
function localLoad(key, fallback) {
  try { const v = window.localStorage.getItem(key); return v != null ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function localSave(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

async function loadJSON(key, fallback) {
  if (LOCAL_KEYS.includes(key)) return localLoad(key, fallback);
  if (!SUPA_READY) return localLoad(key, fallback); // Supabase yoksa geçici olarak yerelde
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
  } catch { /* offline — yereldeki kopya yine de UI'da duruyor */ }
}

// Canlı güncelleme: shared bir key değişince callback tetiklenir (Supabase Realtime).
function subscribeShared(onChange) {
  if (!SUPA_READY || typeof WebSocket === "undefined") return () => {};
  let ws, alive = true, pingTimer;
  const ref = "hb-" + Math.random().toString(36).slice(2, 8);
  try {
    ws = new WebSocket(`${SUPABASE_URL.replace("https://", "wss://")}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ topic: "realtime:public:app_state", event: "phx_join", payload: { config: { postgres_changes: [{ event: "*", schema: "public", table: "app_state" }] } }, ref }));
      pingTimer = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: "hb" })); }, 25000);
    };
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.event === "postgres_changes") {
          const rec = data.payload?.data?.record;
          if (rec && rec.id && SHARED_KEYS.includes(rec.id)) onChange(rec.id, rec.value);
        }
      } catch { /* ignore */ }
    };
  } catch { return () => {}; }
  return () => { alive = false; clearInterval(pingTimer); try { ws && ws.close(); } catch {} void alive; };
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
.eb-app *{box-sizing:border-box;}
.eb-app button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}
.eb-app input,.eb-app textarea,.eb-app select{font-family:inherit;}
.eb-serif{font-family:var(--font, 'Fraunces',Georgia,serif);font-optical-sizing:auto;}
.eb-app[dir="rtl"] .eb-serif{font-family:'Noto Sans Arabic','Fraunces',serif;font-weight:600;}
.eb-mono{font-family:'DM Mono',ui-monospace,monospace;}
.eb-lang{appearance:none;-webkit-appearance:none;border:1.5px solid var(--line);background:var(--paper);color:var(--ink);font-size:12.5px;font-weight:600;padding:7px 12px;border-radius:999px;cursor:pointer;outline:none;}
.eb-lang.dark{background:rgba(20,28,22,.55);color:#fff;border-color:rgba(255,255,255,.25);backdrop-filter:blur(4px);}
.eb-lang.dark option{color:#000;}
.eb-switch{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:90;display:flex;gap:4px;padding:5px;background:var(--pine);border-radius:999px;box-shadow:var(--shadow-lg);}
.eb-switch button{padding:8px 18px;border-radius:999px;font-weight:600;font-size:13px;color:#cfd8cf;transition:.18s;}
.eb-switch button.on{background:var(--honey);color:var(--honey-ink);}
.eb-stage{display:flex;justify-content:center;padding:34px 16px 110px;}
.eb-phone{width:100%;max-width:420px;background:var(--bg-pattern, none) var(--paper);border-radius:34px;box-shadow:var(--shadow-lg);overflow:hidden;position:relative;min-height:760px;border:1px solid var(--line);}
.eb-phone-bar{height:34px;display:flex;align-items:center;justify-content:center;}
.eb-phone-bar i{width:90px;height:6px;border-radius:99px;background:var(--line);display:block;}
.eb-screen{padding:0 0 24px;animation:fade .35s ease;}
@keyframes fade{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.eb-pad{padding:0 22px;}
.eb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--pine);color:var(--pine-ink);font-weight:600;font-size:15px;padding:14px 20px;border-radius:14px;transition:.16s;width:100%;}
.eb-btn:hover{background:var(--pine-2);}
.eb-btn:active{transform:translateY(1px);}
.eb-btn.honey{background:var(--honey);color:var(--honey-ink);}
.eb-btn.honey:hover{background:var(--honey-2);}
.eb-btn.ghost{background:transparent;color:var(--pine);border:1.5px solid var(--line);}
.eb-btn.ghost:hover{border-color:var(--pine);}
.eb-btn:disabled{cursor:not-allowed;}
.eb-chip{display:inline-flex;align-items:center;gap:6px;background:var(--pine);color:var(--pine-ink);font-size:12.5px;font-weight:600;padding:6px 12px;border-radius:999px;}
.eb-input{width:100%;padding:13px 14px;border-radius:12px;border:1.5px solid var(--line);background:var(--paper);font-size:15px;color:var(--ink);outline:none;transition:.15s;}
.eb-input:focus{border-color:var(--pine);box-shadow:0 0 0 3px rgba(47,74,58,.1);}
.eb-label{font-size:12px;font-weight:600;color:var(--ink-soft);letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px;display:block;}
.eb-scan{padding:30px 22px;text-align:center;}
.eb-scan-top{display:flex;justify-content:flex-end;margin-bottom:6px;}
.eb-cam{margin:14px auto;width:230px;height:230px;border-radius:24px;position:relative;background:linear-gradient(155deg,#26352b,#3b5142);overflow:hidden;display:flex;align-items:center;justify-content:center;}
.eb-cam .frame{position:absolute;inset:26px;border-radius:16px;}
.eb-cam .c1,.eb-cam .c2,.eb-cam .c3,.eb-cam .c4{position:absolute;width:34px;height:34px;}
.eb-cam .c1{top:0;left:0;border-top:3px solid var(--honey);border-left:3px solid var(--honey);border-top-left-radius:10px;}
.eb-cam .c2{top:0;right:0;border-top:3px solid var(--honey);border-right:3px solid var(--honey);border-top-right-radius:10px;}
.eb-cam .c3{bottom:0;left:0;border-bottom:3px solid var(--honey);border-left:3px solid var(--honey);border-bottom-left-radius:10px;}
.eb-cam .c4{bottom:0;right:0;border-bottom:3px solid var(--honey);border-right:3px solid var(--honey);border-bottom-right-radius:10px;}
.eb-cam .laser{position:absolute;left:26px;right:26px;height:2px;background:var(--honey-2);box-shadow:0 0 12px var(--honey);animation:scan 1.6s ease-in-out infinite;}
@keyframes scan{0%,100%{top:30px;}50%{top:196px;}}
.eb-cam.found{background:linear-gradient(155deg,#2f4a3a,#3E5C49);}
.eb-detected{animation:pop .4s cubic-bezier(.2,1.4,.5,1);}
@keyframes pop{0%{transform:scale(.5);opacity:0;}100%{transform:none;opacity:1;}}
.eb-demobox{margin-top:18px;border:1.5px dashed var(--line);border-radius:14px;padding:13px;text-align:start;background:#fbf7ee;}
.eb-demobox .h{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);display:flex;align-items:center;gap:6px;}
.eb-demobox p{font-size:11.5px;color:var(--ink-soft);margin:4px 0 10px;}
.eb-stickers{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;}
.eb-sticker{aspect-ratio:1;border-radius:9px;border:1.5px solid var(--line);background:var(--paper);font-weight:600;font-size:13px;transition:.14s;color:var(--ink);}
.eb-sticker.on{background:var(--pine);color:#fff;border-color:var(--pine);}
.eb-sticker:hover{border-color:var(--honey);}
.eb-carousel{position:relative;}
.eb-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;}
.eb-track::-webkit-scrollbar{display:none;}
.eb-slide{flex:0 0 100%;scroll-snap-align:center;height:248px;position:relative;display:flex;align-items:flex-end;overflow:hidden;}
.eb-slide img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.eb-slide .fb{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:78px;}
.eb-slide .scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(20,28,22,.72),rgba(20,28,22,.05) 55%);}
.eb-slide .cap{position:relative;color:#fff;padding:16px 20px;font-family:'Fraunces',serif;font-size:18px;font-weight:500;}
.eb-app[dir="rtl"] .eb-slide .cap{font-family:'Noto Sans Arabic',serif;}
.eb-dots{position:absolute;bottom:12px;inset-inline-end:16px;display:flex;gap:6px;z-index:3;}
.eb-dots i{width:7px;height:7px;border-radius:99px;background:rgba(255,255,255,.45);transition:.2s;}
.eb-dots i.on{background:#fff;width:18px;}
.eb-overhero{position:absolute;top:14px;inset-inline-start:16px;inset-inline-end:16px;display:flex;justify-content:space-between;align-items:flex-start;z-index:3;gap:8px;}
.eb-logo{width:48px;height:48px;border-radius:14px;background:var(--honey);display:flex;align-items:center;justify-content:center;font-size:25px;box-shadow:var(--shadow);}
.eb-namecard{padding:16px 22px 4px;}
.eb-namecard h1{font-size:29px;font-weight:600;line-height:1;}
.eb-namecard p{color:var(--ink-soft);font-size:13.5px;margin-top:5px;}
.eb-stampcard{background:var(--paper);border:1.5px solid var(--line);border-radius:18px;padding:16px;box-shadow:var(--shadow);}
.eb-stamps{display:flex;gap:8px;margin-top:12px;}
.eb-stamp{flex:1;aspect-ratio:1;border-radius:50%;border:2px dashed var(--berry-soft);display:flex;align-items:center;justify-content:center;font-size:17px;color:transparent;transition:.3s;}
.eb-stamp.on{border-style:solid;border-color:var(--berry);background:var(--berry);color:#fff;animation:stamp .4s cubic-bezier(.2,1.4,.5,1);}
@keyframes stamp{0%{transform:scale(.4) rotate(-18deg);opacity:0;}100%{transform:none;opacity:1;}}
.eb-reward-banner{background:linear-gradient(100deg,#9C3B52,#b9526a);color:#fff;border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:var(--shadow);}
.eb-billrow{display:flex;align-items:center;justify-content:space-between;width:100%;background:var(--paper);border:1.5px solid var(--line);border-radius:14px;padding:12px 14px;transition:.14s;}
.eb-billrow:hover{border-color:var(--honey);}
.eb-pp{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;}
.eb-pp.unpaid{background:#f6dfe4;color:#7a2336;}
.eb-pp.paid{background:#dfeede;color:#1f4f2f;}
.eb-cats{display:flex;gap:8px;overflow-x:auto;padding:14px 22px 6px;scrollbar-width:none;}
.eb-cats::-webkit-scrollbar{display:none;}
.eb-cat-pill{white-space:nowrap;padding:9px 15px;border-radius:999px;font-weight:600;font-size:13.5px;background:var(--line-2);color:var(--ink-soft);transition:.14s;}
.eb-cat-pill.on{background:var(--pine);color:var(--pine-ink);}
.eb-cat-head{padding:18px 22px 6px;}
.eb-cat-head h2{font-size:23px;font-weight:600;}
.eb-cat-head span{font-size:13px;color:var(--ink-soft);}
.eb-item{display:flex;gap:14px;align-items:center;padding:12px 22px;}
.eb-item.out{opacity:.5;}
.eb-thumb{width:62px;height:62px;border-radius:15px;flex:none;display:flex;align-items:center;justify-content:center;font-size:30px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.04);}
.eb-thumb img{width:100%;height:100%;object-fit:cover;}
.eb-item-body{flex:1;min-width:0;}
.eb-item-body h3{font-size:15.5px;font-weight:600;}
.eb-item-body p{font-size:12.5px;color:var(--ink-soft);margin-top:1px;}
.eb-ingredients{font-size:11px;color:var(--ink-soft);margin-top:3px;font-style:italic;}
.eb-item-body .price{font-size:14px;font-weight:700;color:var(--pine);margin-top:3px;}
.eb-soldout{font-size:11px;font-weight:700;color:var(--berry);text-transform:uppercase;letter-spacing:.04em;}
.eb-add{width:38px;height:38px;border-radius:11px;background:var(--honey);color:var(--honey-ink);font-size:22px;font-weight:600;flex:none;display:flex;align-items:center;justify-content:center;transition:.14s;}
.eb-add:hover{background:var(--honey-2);}
.eb-add:active{transform:scale(.9);}
.eb-qty{display:flex;align-items:center;gap:10px;background:var(--pine);border-radius:11px;padding:3px;flex:none;}
.eb-qty button{width:32px;height:32px;color:var(--pine-ink);font-size:20px;font-weight:600;}
.eb-qty span{color:#fff;font-weight:700;min-width:16px;text-align:center;font-size:14px;}
.eb-bar{position:sticky;bottom:0;background:var(--paper);border-top:1px solid var(--line);padding:14px 22px;box-shadow:0 -8px 24px rgba(35,51,42,.06);}
.eb-cline{display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--line-2);}
.eb-note-in{width:100%;margin-top:8px;padding:9px 11px;border-radius:10px;border:1.5px dashed var(--line);background:transparent;font-size:13px;resize:none;outline:none;color:var(--ink);}
.eb-note-in:focus{border-color:var(--honey);border-style:solid;}
.eb-steps{display:flex;align-items:center;margin:22px 0;}
.eb-step{flex:1;text-align:center;position:relative;}
.eb-step .dot{width:30px;height:30px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;background:var(--line);color:var(--ink-soft);font-size:14px;font-weight:700;transition:.3s;z-index:2;position:relative;}
.eb-step.done .dot{background:var(--pine);color:#fff;}
.eb-step.active .dot{background:var(--honey);color:var(--honey-ink);box-shadow:0 0 0 5px rgba(217,154,43,.2);}
.eb-step small{font-size:11px;font-weight:600;color:var(--ink-soft);}
.eb-step.done small,.eb-step.active small{color:var(--ink);}
.eb-step:not(:last-child):after{content:"";position:absolute;top:15px;left:60%;right:-40%;height:2px;background:var(--line);z-index:1;}
.eb-step.done:not(:last-child):after{background:var(--pine);}
.eb-admin{min-height:100vh;background:var(--bg-pattern, none) var(--bg);}
.eb-anav{background:var(--pine);color:var(--pine-ink);padding:0 24px;display:flex;align-items:center;gap:6px;height:62px;position:sticky;top:0;z-index:20;box-shadow:var(--shadow);overflow-x:auto;}
.eb-anav .brand{font-weight:600;font-size:18px;margin-inline-end:18px;display:flex;align-items:center;gap:9px;white-space:nowrap;}
.eb-anav .brand b{width:30px;height:30px;border-radius:9px;background:var(--honey);display:flex;align-items:center;justify-content:center;font-size:17px;}
.eb-atab{padding:9px 16px;border-radius:10px;font-weight:600;font-size:14px;color:#cfd8cf;transition:.14s;white-space:nowrap;}
.eb-atab.on{background:rgba(255,255,255,.12);color:#fff;}
.eb-atab:hover{color:#fff;}
.eb-awrap{max-width:1120px;margin:0 auto;padding:26px 24px 60px;}
.eb-ahead{display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px;}
.eb-ahead h1{font-size:30px;font-weight:600;}
.eb-ahead p{color:var(--ink-soft);font-size:14px;margin-top:2px;}
.eb-filters{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;}
.eb-fpill{padding:8px 15px;border-radius:999px;font-weight:600;font-size:13px;background:var(--paper);border:1.5px solid var(--line);color:var(--ink-soft);transition:.14s;}
.eb-fpill.on{background:var(--pine);color:#fff;border-color:var(--pine);}
.eb-tickets{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;}
.eb-ticket{background:var(--paper);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column;}
.eb-ticket-top{padding:14px 16px;border-bottom:1px dashed var(--line);display:flex;align-items:center;justify-content:space-between;}
.eb-tnum{font-size:13px;color:var(--ink-soft);}
.eb-tnum b{color:var(--ink);}
.eb-tt{display:flex;align-items:center;gap:8px;}
.eb-table-badge{background:var(--pine);color:#fff;font-weight:700;font-size:14px;padding:6px 12px;border-radius:10px;}
.eb-status{font-size:11px;font-weight:700;padding:4px 9px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em;}
.eb-status.new{background:#fbe6c4;color:#7a5510;}
.eb-status.preparing{background:#d8e6e2;color:#1f4f43;}
.eb-status.served{background:#e3e9e1;color:#5b6b60;}
.eb-ticket-body{padding:14px 16px;flex:1;}
.eb-trow{display:flex;justify-content:space-between;font-size:14px;padding:3px 0;}
.eb-trow .q{color:var(--berry);font-weight:700;margin-inline-end:7px;}
.eb-tnote{margin-top:4px;font-size:12.5px;color:var(--ink-soft);background:#fdf6e6;border-inline-start:3px solid var(--honey);padding:5px 9px;border-radius:0 8px 8px 0;}
.eb-pay-row{display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);}
.eb-paybtn{font-size:12.5px;font-weight:600;color:var(--pine);text-decoration:underline;text-underline-offset:2px;}
.eb-paybtn:hover{color:var(--honey);}
.eb-ticket-foot{padding:12px 16px;border-top:1px dashed var(--line);display:flex;gap:8px;}
.eb-tbtn{flex:1;padding:10px;border-radius:10px;font-weight:600;font-size:13px;transition:.14s;}
.eb-tbtn.primary{background:var(--honey);color:var(--honey-ink);}
.eb-tbtn.primary:hover{background:var(--honey-2);}
.eb-tbtn.done{background:var(--pine);color:#fff;}
.eb-tbtn.muted{background:var(--line-2);color:var(--ink-soft);}
.eb-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;margin-bottom:26px;}
.eb-stat{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:var(--shadow);}
.eb-stat .k{font-size:12px;font-weight:600;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;}
.eb-stat .v{font-size:30px;font-weight:600;margin-top:6px;}
.eb-stat .v.serif{font-family:'Fraunces',serif;}
.eb-panel{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:var(--shadow);}
.eb-panel h3{font-size:16px;font-weight:600;margin-bottom:14px;}
.eb-bar-row{display:flex;align-items:center;gap:12px;margin-bottom:11px;font-size:13.5px;}
.eb-bar-row .nm{width:120px;flex:none;}
.eb-bar-track{flex:1;height:11px;border-radius:99px;background:var(--line-2);overflow:hidden;}
.eb-bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--pine),var(--honey));transition:width .6s ease;}
.eb-bar-row .vl{width:40px;text-align:end;font-weight:600;color:var(--ink-soft);font-size:12.5px;}
.eb-two{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
@media(max-width:760px){.eb-two{grid-template-columns:1fr;}}
.eb-ctable{width:100%;border-collapse:collapse;font-size:14px;}
.eb-ctable th{text-align:start;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft);padding:10px 12px;border-bottom:1px solid var(--line);}
.eb-ctable td{padding:13px 12px;border-bottom:1px solid var(--line-2);}
.eb-ctable tr:hover td{background:#fbf7ee;}
.eb-pill-mini{display:inline-flex;align-items:center;gap:5px;background:var(--line-2);padding:3px 9px;border-radius:99px;font-size:12px;font-weight:600;}
.eb-medit-cat{margin-bottom:26px;}
.eb-medit-cat h2{font-family:'Fraunces',serif;font-size:20px;font-weight:600;margin-bottom:6px;display:flex;align-items:center;gap:8px;}
.eb-medit-cat h2 small{font-size:12px;font-weight:600;color:var(--ink-soft);font-family:'DM Sans',sans-serif;}
.eb-mrow{display:flex;align-items:center;gap:14px;background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-bottom:10px;box-shadow:var(--shadow);}
.eb-mrow.out{opacity:.6;}
.eb-mrow .info{flex:1;min-width:0;}
.eb-mrow .info b{font-size:15px;}
.eb-mrow .info .ing{font-size:12px;color:var(--ink-soft);font-style:italic;margin-top:2px;}
.eb-mrow .pr{font-weight:700;color:var(--pine);font-size:15px;white-space:nowrap;}
.eb-toggle{position:relative;width:42px;height:24px;border-radius:99px;background:var(--line);transition:.2s;flex:none;}
.eb-toggle.on{background:var(--pine);}
.eb-toggle i{position:absolute;top:3px;inset-inline-start:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s;}
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
.eb-empty{text-align:center;padding:60px 20px;color:var(--ink-soft);}
.eb-empty .em{font-size:46px;}
.eb-empty h3{font-size:19px;color:var(--ink);margin:12px 0 5px;font-weight:600;}
.eb-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:78px;z-index:120;background:var(--ink);color:#fff;padding:12px 20px;border-radius:13px;font-weight:500;font-size:14px;box-shadow:var(--shadow-lg);animation:toast .3s ease;display:flex;align-items:center;gap:9px;max-width:90vw;}
@keyframes toast{from{opacity:0;transform:translate(-50%,10px);}to{opacity:1;transform:translateX(-50%);}}
.eb-overlay{position:fixed;inset:0;background:rgba(35,51,42,.5);z-index:110;display:flex;align-items:center;justify-content:center;padding:20px;animation:fade .2s ease;overflow:auto;}
.eb-modal{background:var(--paper);border-radius:20px;max-width:460px;width:100%;padding:24px;box-shadow:var(--shadow-lg);margin:auto;}
.eb-modal h3{font-size:21px;font-weight:600;margin-bottom:4px;}
.eb-sep{height:1px;background:var(--line-2);margin:16px 0;}
.eb-link{color:var(--pine);font-weight:600;text-decoration:underline;text-underline-offset:2px;}
.eb-login{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg-pattern, none) var(--bg);}
.eb-login-card{width:100%;max-width:380px;background:var(--paper);border:1px solid var(--line);border-radius:20px;padding:30px 26px;box-shadow:var(--shadow-lg);}
.eb-login-card .lock{width:54px;height:54px;border-radius:50%;background:var(--pine);color:var(--pine-ink);display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px;}
.eb-login-card h1{font-size:22px;font-weight:600;text-align:center;margin:0 0 4px;}
.eb-login-card p.sub{font-size:13px;color:var(--ink-soft);text-align:center;margin:0 0 22px;}
.eb-login-card .err{background:#f6dfe4;color:#7a2336;font-size:13px;font-weight:600;padding:9px 12px;border-radius:10px;margin-bottom:14px;text-align:center;}
.eb-staffbar{display:flex;align-items:center;gap:6px;}
@media(prefers-reduced-motion:reduce){.eb-app *{animation:none!important;transition:none!important;}.eb-track{scroll-behavior:auto;}}

/* Shape personality — varies by theme, layered on top of the base rounded look */
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

.eb-themecard{cursor:pointer;background:var(--paper);border:2px solid var(--line);border-radius:18px;padding:16px;transition:.16s;}
.eb-themecard:hover{border-color:var(--honey);}
.eb-themecard.on{border-color:var(--pine);box-shadow:0 0 0 3px rgba(47,74,58,.12);}
.eb-theme-swatches{display:flex;gap:6px;margin-bottom:12px;}
.eb-theme-swatches i{width:26px;height:26px;border-radius:50%;display:block;border:2px solid rgba(255,255,255,.7);box-shadow:0 0 0 1px var(--line);}
.eb-theme-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
`;


export default function App() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [menu, setMenu] = useState(DEFAULT_MENU);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [lang, setLang] = useState("en");
  const [themeId, setThemeId] = useState("hearth");
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);

  // Which side of the app to show is decided by the URL, not a toggle.
  // A normal QR scan (?table=4) is always the customer view.
  // Staff reach the admin panel only via ?staff (or ?admin) and must log in.
  const isStaffRoute = useMemo(() => {
    try { const p = new URLSearchParams(window.location.search); return p.has("staff") || p.has("admin"); } catch { return false; }
  }, []);
  const [staffAuthed, setStaffAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      setOrders(await loadJSON(K_ORDERS, []));
      setCustomers(await loadJSON(K_CUSTOMERS, {}));
      setMenu(await loadJSON(K_MENU, DEFAULT_MENU));
      setSlides(await loadJSON(K_SLIDES, DEFAULT_SLIDES));
      setLang(await loadJSON(K_LANG, "en"));
      setThemeId(await loadJSON(K_THEME, "hearth"));
      setStaffAuthed(await loadJSON(K_STAFF, false) === true);
      setLoaded(true);
    })();
  }, []);

  // Canlı senkron: başka bir cihaz veriyi değiştirince buraya düşer.
  // applyingRemote ref'i, gelen veriyi tekrar Supabase'e geri yazmamızı engeller.
  const applyingRemote = useRef(false);
  useEffect(() => {
    const unsub = subscribeShared((key, value) => {
      applyingRemote.current = true;
      if (key === K_ORDERS) setOrders(value || []);
      else if (key === K_CUSTOMERS) setCustomers(value || {});
      else if (key === K_MENU) setMenu(value || DEFAULT_MENU);
      else if (key === K_SLIDES) setSlides(value || DEFAULT_SLIDES);
      setTimeout(() => { applyingRemote.current = false; }, 0);
    });
    return unsub;
  }, []);

  useEffect(() => { if (loaded && !applyingRemote.current) saveJSON(K_ORDERS, orders); }, [orders, loaded]);
  useEffect(() => { if (loaded && !applyingRemote.current) saveJSON(K_CUSTOMERS, customers); }, [customers, loaded]);
  useEffect(() => { if (loaded && !applyingRemote.current) saveJSON(K_MENU, menu); }, [menu, loaded]);
  useEffect(() => { if (loaded && !applyingRemote.current) saveJSON(K_SLIDES, slides); }, [slides, loaded]);
  useEffect(() => { if (loaded) saveJSON(K_LANG, lang); }, [lang, loaded]);
  useEffect(() => { if (loaded) saveJSON(K_THEME, themeId); }, [themeId, loaded]);
  useEffect(() => { if (loaded) saveJSON(K_STAFF, staffAuthed); }, [staffAuthed, loaded]);

  const t = useMemo(() => makeT(lang), [lang]);
  const dir = useMemo(() => (LANGS.find((l) => l.code === lang)?.dir || "ltr"), [lang]);
  const theme = useMemo(() => THEMES.find((th) => th.id === themeId) || THEMES[0], [themeId]);
  const themeStyle = useMemo(() => Object.fromEntries(Object.entries(theme.vars).map(([k, v]) => ["--" + k, v])), [theme]);

  const flash = useCallback((msg) => {
    setToast(msg);
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const resetDemo = () => {
    setOrders([]); setCustomers({}); setMenu(DEFAULT_MENU); setSlides(DEFAULT_SLIDES);
    flash(t("t_reset"));
  };

  const goCustomer = () => {
    try { window.location.href = window.location.pathname; } catch { /* noop */ }
  };
  const signOutStaff = () => { setStaffAuthed(false); goCustomer(); };

  return (
    <LangCtx.Provider value={{ lang, setLang, dir, t }}>
      <ThemeCtx.Provider value={{ themeId, setThemeId }}>
        <div className="eb-app" dir={dir} data-shape={theme.shape} style={themeStyle}>
          <style>{CSS}</style>
          {!isStaffRoute ? (
            <CustomerApp orders={orders} setOrders={setOrders} customers={customers} setCustomers={setCustomers} menu={menu} slides={slides} flash={flash} />
          ) : staffAuthed ? (
            <AdminApp orders={orders} setOrders={setOrders} customers={customers} menu={menu} setMenu={setMenu} slides={slides} setSlides={setSlides} flash={flash} resetDemo={resetDemo} onSignOut={signOutStaff} />
          ) : (
            <StaffLogin onSuccess={() => setStaffAuthed(true)} onBack={goCustomer} />
          )}
          {toast && <div className="eb-toast">🔔 {toast}</div>}
        </div>
      </ThemeCtx.Provider>
    </LangCtx.Provider>
  );
}


function CustomerApp({ orders, setOrders, customers, setCustomers, menu, slides, flash }) {
  const { t } = useT();
  const [screen, setScreen] = useState("scan");
  const [table, setTable] = useState(null);
  const [cart, setCart] = useState({});
  const [user, setUser] = useState(null);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [useReward, setUseReward] = useState(false);

  const itemsById = useMemo(() => Object.fromEntries(menu.map((i) => [i.id, i])), [menu]);
  const record = user ? customers[user] : null;
  const stamps = record ? record.stamps : 0;
  const hasReward = stamps >= REWARD_THRESHOLD;

  const cartList = Object.entries(cart).map(([id, v]) => (itemsById[id] ? { ...itemsById[id], ...v } : null)).filter(Boolean);
  const cartCount = cartList.reduce((s, i) => s + i.qty, 0);
  const rewardItem = useReward && hasReward ? cartList.filter((i) => REWARD_ITEMS.includes(i.id)).sort((a, b) => a.price - b.price)[0] : null;
  const subtotal = cartList.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = rewardItem ? rewardItem.price : 0;
  const total = Math.max(0, subtotal - discount);

  const add = (id) => { setCart((c) => ({ ...c, [id]: { qty: (c[id]?.qty || 0) + 1, note: c[id]?.note || "" } })); flash(t("t_added", { name: itemsById[id]?.name })); };
  const dec = (id) => setCart((c) => { const q = (c[id]?.qty || 0) - 1; if (q <= 0) { const n = { ...c }; delete n[id]; return n; } return { ...c, [id]: { ...c[id], qty: q } }; });
  const setNote = (id, note) => setCart((c) => ({ ...c, [id]: { ...c[id], note } }));

  const placeOrder = (orderNote) => {
    const id = "#" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const order = {
      id, table,
      items: cartList.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, note: i.note || "" })),
      orderNote: orderNote || "", customerEmail: user || null, customerName: record ? record.name : null,
      rewardUsed: !!rewardItem, status: "new", paid: false, paidAt: null, billRequested: false,
      createdAt: new Date().toISOString(), subtotal, discount, total,
    };
    setOrders((o) => [order, ...o]);
    if (user) {
      setCustomers((cs) => {
        const r = cs[user] || { email: user, name: record?.name || "", orders: 0, stamps: 0, totalSpent: 0, joinedAt: new Date().toISOString() };
        let newStamps = r.stamps + 1;
        if (rewardItem) newStamps = Math.max(0, r.stamps - REWARD_THRESHOLD + 1);
        return { ...cs, [user]: { ...r, orders: r.orders + 1, stamps: newStamps, totalSpent: r.totalSpent + total } };
      });
    }
    setLastOrderId(id); setCart({}); setUseReward(false); setScreen("placed");
  };

  const requestBill = () => {
    setOrders((os) => os.map((o) => (o.table === table && !o.paid ? { ...o, billRequested: true } : o)));
    flash(t("t_server_notified", { n: table }));
  };
  const reorder = (order) => {
    let added = 0;
    order.items.forEach((it) => { const m = itemsById[it.id]; if (m && m.available) { setCart((c) => ({ ...c, [it.id]: { qty: (c[it.id]?.qty || 0) + it.qty, note: c[it.id]?.note || "" } })); added += 1; } });
    if (added) { flash(t("t_to_basket")); setScreen("cart"); } else flash(t("t_unavailable"));
  };
  const tableOrders = orders.filter((o) => o.table === table);

  const signIn = (email, name) => {
    const key = email.trim().toLowerCase();
    setCustomers((cs) => cs[key] ? cs : { ...cs, [key]: { email: key, name: name || key.split("@")[0], orders: 0, stamps: 0, totalSpent: 0, joinedAt: new Date().toISOString() } });
    setUser(key); flash(t("t_signed_in")); setScreen("home");
  };

  return (
    <div className="eb-stage">
      <div className="eb-phone">
        <div className="eb-phone-bar"><i /></div>
        {screen === "scan" && <ScanScreen onDetect={(tb) => { setTable(tb); setScreen("home"); }} />}
        {screen === "home" && <HomeScreen table={table} user={user} record={record} stamps={stamps} hasReward={hasReward} menu={menu} slides={slides} tableOrders={tableOrders} go={setScreen} rescan={() => setScreen("scan")} onBill={() => setScreen("bill")} cartCount={cartCount} />}
        {screen === "menu" && <MenuScreen menu={menu} cart={cart} add={add} dec={dec} cartCount={cartCount} total={subtotal} back={() => setScreen("home")} toCart={() => setScreen("cart")} />}
        {screen === "cart" && <CartScreen cartList={cartList} add={add} dec={dec} setNote={setNote} subtotal={subtotal} total={total} discount={discount} rewardItem={rewardItem} hasReward={hasReward} useReward={useReward} setUseReward={setUseReward} user={user} table={table} back={() => setScreen("menu")} place={placeOrder} toAuth={() => setScreen("auth")} />}
        {screen === "bill" && <BillScreen table={table} orders={tableOrders} requestBill={requestBill} back={() => setScreen("home")} toMenu={() => setScreen("menu")} />}
        {screen === "placed" && <PlacedScreen order={orders.find((o) => o.id === lastOrderId)} table={table} user={user} stamps={stamps} hasReward={hasReward} backToMenu={() => setScreen("menu")} toAccount={() => setScreen("account")} toAuth={() => setScreen("auth")} toBill={() => setScreen("bill")} />}
        {screen === "auth" && <AuthScreen onSignIn={signIn} back={() => setScreen(cartCount ? "cart" : "home")} />}
        {screen === "account" && <AccountScreen user={user} record={record} stamps={stamps} hasReward={hasReward} orders={orders.filter((o) => o.customerEmail === user)} reorder={reorder} back={() => setScreen("home")} signOut={() => { setUser(null); setScreen("home"); }} toAuth={() => setScreen("auth")} />}
      </div>
    </div>
  );
}

function ScanScreen({ onDetect }) {
  const { t } = useT();
  const urlTable = (() => { try { const v = parseInt(new URLSearchParams(window.location.search).get("table"), 10); return v >= 1 && v <= TABLE_COUNT ? v : null; } catch { return null; } })();
  const [sticker, setSticker] = useState(urlTable || 5);
  const [phase, setPhase] = useState("scanning");
  useEffect(() => {
    setPhase("scanning");
    const t1 = setTimeout(() => setPhase("found"), 1500);
    const t2 = setTimeout(() => onDetect(sticker), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [sticker]); // eslint-disable-line
  return (
    <div className="eb-screen eb-scan">
      <div className="eb-scan-top"><LangPicker /></div>
      <span className="eb-chip" style={{ background: "var(--honey)", color: "var(--honey-ink)" }}>{phase === "scanning" ? t("scan_reading") : t("scan_found")}</span>
      <div className={`eb-cam ${phase === "found" ? "found" : ""}`}>
        <div className="frame"><span className="c1" /><span className="c2" /><span className="c3" /><span className="c4" /></div>
        {phase === "scanning" ? (<><div className="laser" /><div style={{ fontSize: 46, opacity: .9 }}>🔳</div></>) : (
          <div className="eb-detected" style={{ textAlign: "center", color: "#fff" }}><div style={{ fontSize: 40 }}>✓</div><div className="eb-serif" style={{ fontSize: 26, fontWeight: 600 }}>{t("table_n", { n: sticker })}</div></div>
        )}
      </div>
      <h2 className="eb-serif" style={{ fontSize: 23, fontWeight: 600 }}>{t("scan_title")}</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: "6px 0 0" }}>{t("scan_blurb")}</p>
      <div className="eb-demobox">
        <div className="h">🔧 {t("demo_control")}</div>
        <p>{t("demo_blurb")}</p>
        <div className="eb-stickers">{Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((tb) => (<button key={tb} className={`eb-sticker ${sticker === tb ? "on" : ""}`} onClick={() => setSticker(tb)}>{tb}</button>))}</div>
      </div>
    </div>
  );
}

function Carousel({ slides }) {
  const ref = useRef(null);
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el || slides.length < 2) return;
    const id = setInterval(() => { const w = el.clientWidth || 1; const next = (Math.round(el.scrollLeft / w) + 1) % slides.length; el.scrollTo({ left: next * w, behavior: "smooth" }); }, 4200);
    return () => clearInterval(id);
  }, [slides.length]);
  const onScroll = () => { const el = ref.current; if (!el) return; setDot(Math.round(Math.abs(el.scrollLeft) / (el.clientWidth || 1))); };
  if (!slides.length) return <div className="eb-slide" style={{ width: "100%" }}><div className="fb" style={{ background: SLIDE_GRADS[0] }}>🔥</div><div className="scrim" /></div>;
  return (
    <div className="eb-carousel">
      <div className="eb-track" ref={ref} onScroll={onScroll}>
        {slides.map((s, i) => (
          <div className="eb-slide" key={s.id || i}>
            <SmartImg src={s.img} alt={s.cap} fallback={<div className="fb" style={{ background: s.grad || SLIDE_GRADS[0] }}>{s.emoji}</div>} />
            <div className="scrim" />{s.cap && <div className="cap">{s.cap}</div>}
          </div>
        ))}
      </div>
      {slides.length > 1 && <div className="eb-dots">{slides.map((_, i) => <i key={i} className={dot === i ? "on" : ""} />)}</div>}
    </div>
  );
}


function HomeScreen({ table, user, record, stamps, hasReward, menu, slides, tableOrders, go, rescan, onBill, cartCount }) {
  const { t } = useT();
  const repFor = (key) => menu.find((i) => i.cat === key && i.available) || menu.find((i) => i.cat === key);
  const due = tableOrders.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);
  const hasOrders = tableOrders.length > 0;
  return (
    <div className="eb-screen">
      <div style={{ position: "relative" }}>
        <Carousel slides={slides} />
        <div className="eb-overhero">
          <div className="eb-logo">🔥</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <LangPicker dark />
            <button className="eb-chip" onClick={() => go("account")} style={{ background: "rgba(20,28,22,.55)", color: "#fff", backdropFilter: "blur(4px)" }}>{user ? t("hi_name", { name: record?.name?.split(" ")[0] || "" }) : t("sign_in")}</button>
          </div>
        </div>
      </div>
      <div className="eb-namecard">
        <h1 className="eb-serif">Hearth &amp; Bean</h1>
        <p>{t("tagline")}</p>
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <span className="eb-chip" style={{ background: "var(--honey)", color: "var(--honey-ink)" }}>📍 {t("table_n", { n: table })}</span>
          <button className="eb-link" style={{ fontSize: 12 }} onClick={rescan}>{t("not_your_table")}</button>
        </div>
        {hasOrders && (
          <button onClick={onBill} className="eb-billrow" style={{ marginTop: 12 }}>
            <span className="eb-tt" style={{ gap: 10 }}>
              <span style={{ fontSize: 20 }}>{due > 0 ? "💳" : "✅"}</span>
              <span style={{ textAlign: "start" }}><b style={{ fontSize: 14 }}>{due > 0 ? t("bill_open") : t("all_settled")}</b><span style={{ display: "block", fontSize: 12, color: "var(--ink-soft)" }}>{due > 0 ? t("on_your_table", { amt: money(due) }) : t("nothing_owing")}</span></span>
            </span>
            <span className={`eb-pp ${due > 0 ? "unpaid" : "paid"}`}>{due > 0 ? t("unpaid") : t("paid")}</span>
          </button>
        )}
      </div>
      <div className="eb-pad" style={{ marginTop: 14 }}>
        {hasReward && <div className="eb-reward-banner" style={{ marginBottom: 14 }}><span style={{ fontSize: 26 }}>🎁</span><div><b style={{ fontSize: 14 }}>{t("reward_ready_t")}</b><div style={{ fontSize: 12.5, opacity: .9 }}>{t("reward_ready_b")}</div></div></div>}
        <div className="eb-stampcard">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><b className="eb-serif" style={{ fontSize: 17 }}>{t("bean_club")}</b><div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{user ? t("stamps_progress", { n: stamps, max: REWARD_THRESHOLD }) : t("signin_to_collect")}</div></div>
            <span style={{ fontSize: 22 }}>{hasReward ? "🎉" : "⭐"}</span>
          </div>
          <div className="eb-stamps">{Array.from({ length: REWARD_THRESHOLD }).map((_, i) => <div key={i} className={`eb-stamp ${(hasReward && i < REWARD_THRESHOLD) || i < (stamps % (REWARD_THRESHOLD + 1)) ? "on" : ""}`}>☕</div>)}</div>
          {!user && <button className="eb-btn ghost" style={{ marginTop: 14 }} onClick={() => go("account")}>{t("join_free")}</button>}
        </div>
        <button className="eb-btn honey" style={{ marginTop: 18, fontSize: 16, padding: 16 }} onClick={() => go("menu")}>🍽️ {t("view_menu")} {cartCount > 0 ? `· ${t("in_basket", { n: cartCount })}` : ""}</button>
        <div style={{ marginTop: 22 }}>
          <h3 className="eb-serif" style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{t("whats_on")}</h3>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {CATS.map((c) => { const rep = repFor(c.key); return (
              <button key={c.key} onClick={() => go("menu")} style={{ flex: "none", width: 96, textAlign: "start" }}>
                <div className="eb-thumb" style={{ width: 96, height: 74, borderRadius: 13, background: CAT_TINT[c.key] }}><SmartImg src={rep?.image} alt={t("cat_" + c.key)} fallback={<span style={{ fontSize: 32 }}>{rep?.emoji || "🍽️"}</span>} /></div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{t("cat_" + c.key)}</div>
              </button>
            ); })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuScreen({ menu, cart, add, dec, cartCount, total, back, toCart }) {
  const { t } = useT();
  return (
    <div className="eb-screen">
      <div className="eb-pad" style={{ paddingTop: 6, display: "flex", alignItems: "center", gap: 12 }}><button onClick={back} style={{ fontSize: 22 }}>‹</button><h2 className="eb-serif" style={{ fontSize: 22, fontWeight: 600 }}>{t("menu")}</h2></div>
      <div className="eb-cats">{CATS.map((c) => (<button key={c.key} className="eb-cat-pill" onClick={() => document.getElementById("cat-" + c.key)?.scrollIntoView({ behavior: "smooth", block: "start" })}>{t("cat_" + c.key)}</button>))}</div>
      <div>
        {CATS.map((c) => { const items = menu.filter((i) => i.cat === c.key); if (!items.length) return null; return (
          <div key={c.key} id={"cat-" + c.key}>
            <div className="eb-cat-head"><h2 className="eb-serif">{t("cat_" + c.key)}</h2><span>{t("cat_" + c.key + "_b")}</span></div>
            {items.map((it) => { const q = cart[it.id]?.qty || 0; return (
              <div className={`eb-item ${!it.available ? "out" : ""}`} key={it.id}>
                <div className="eb-thumb" style={{ background: CAT_TINT[c.key] }}><SmartImg src={it.image} alt={it.name} fallback={<span>{it.emoji}</span>} /></div>
                <div className="eb-item-body"><h3>{it.name}</h3><p>{it.desc}</p>{it.ingredients && <div className="eb-ingredients">{it.ingredients}</div>}<div className="price">{money(it.price)}</div></div>
                {!it.available ? <span className="eb-soldout">{t("sold_out")}</span> : q > 0 ? (
                  <div className="eb-qty"><button onClick={() => dec(it.id)}>−</button><span>{q}</span><button onClick={() => add(it.id)}>+</button></div>
                ) : <button className="eb-add" onClick={() => add(it.id)} aria-label={it.name}>+</button>}
              </div>
            ); })}
          </div>
        ); })}
      </div>
      {cartCount > 0 && <div className="eb-bar"><button className="eb-btn honey" onClick={toCart} style={{ justifyContent: "space-between", padding: "15px 18px" }}><span>{t("view_basket")} · {cartCount} {cartCount > 1 ? t("items") : t("item")}</span><span>{money(total)} →</span></button></div>}
    </div>
  );
}

function CartScreen({ cartList, add, dec, setNote, subtotal, total, discount, rewardItem, hasReward, useReward, setUseReward, user, table, back, place, toAuth }) {
  const { t } = useT();
  const [orderNote, setOrderNote] = useState("");
  if (cartList.length === 0) return (
    <div className="eb-screen">
      <div className="eb-pad" style={{ paddingTop: 6, display: "flex", alignItems: "center", gap: 12 }}><button onClick={back} style={{ fontSize: 22 }}>‹</button><h2 className="eb-serif" style={{ fontSize: 22, fontWeight: 600 }}>{t("your_basket")}</h2></div>
      <div className="eb-empty"><div className="em">🧺</div><h3>{t("empty_basket_t")}</h3><p>{t("empty_basket_b")}</p><button className="eb-btn honey" style={{ width: "auto", marginTop: 16 }} onClick={back}>{t("browse_menu")}</button></div>
    </div>
  );
  return (
    <div className="eb-screen">
      <div className="eb-pad" style={{ paddingTop: 6, display: "flex", alignItems: "center", gap: 12 }}><button onClick={back} style={{ fontSize: 22 }}>‹</button><h2 className="eb-serif" style={{ fontSize: 22, fontWeight: 600 }}>{t("your_basket")}</h2></div>
      <div className="eb-pad">
        <span className="eb-chip" style={{ marginBottom: 6 }}>📍 {t("delivering_to", { n: table })}</span>
        {cartList.map((i) => (
          <div className="eb-cline" key={i.id}>
            <div className="eb-thumb" style={{ width: 50, height: 50, fontSize: 24, background: "var(--line-2)" }}><SmartImg src={i.image} alt={i.name} fallback={<span>{i.emoji}</span>} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ fontSize: 14.5 }}>{i.name}</b><span style={{ fontWeight: 700, fontSize: 14 }}>{money(i.price * i.qty)}</span></div>
              <div className="eb-qty" style={{ width: "fit-content", marginTop: 6, background: "var(--line-2)" }}><button onClick={() => dec(i.id)} style={{ color: "var(--ink)" }}>−</button><span style={{ color: "var(--ink)" }}>{i.qty}</span><button onClick={() => add(i.id)} style={{ color: "var(--ink)" }}>+</button></div>
              <textarea className="eb-note-in" rows={1} placeholder={t("note_for_item", { name: i.name })} value={i.note} onChange={(e) => setNote(i.id, e.target.value)} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 16 }}><label className="eb-label">{t("order_note_label")}</label><textarea className="eb-input" rows={2} placeholder={t("order_note_ph")} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} /></div>
        {hasReward && (
          <button onClick={() => setUseReward((v) => !v)} className="eb-reward-banner" style={{ width: "100%", marginTop: 16, textAlign: "start", justifyContent: "flex-start" }}>
            <span style={{ fontSize: 24 }}>{useReward ? "✅" : "🎁"}</span>
            <div><b style={{ fontSize: 13.5 }}>{useReward ? t("reward_applied") : t("use_reward")}</b><div style={{ fontSize: 12, opacity: .9 }}>{rewardItem ? t("reward_free_item", { name: rewardItem.name }) : t("reward_add_item")}</div></div>
          </button>
        )}
        <div className="eb-sep" />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--ink-soft)" }}><span>{t("subtotal")}</span><span>{money(subtotal)}</span></div>
        {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--berry)", marginTop: 4 }}><span>{t("club_reward")}</span><span>−{money(discount)}</span></div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, marginTop: 8 }}><span>{t("total")}</span><span>{money(total)}</span></div>
        {!user && <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 14, textAlign: "center" }}>{t("guest_1")} <button className="eb-link" onClick={toAuth}>{t("sign_in")}</button> {t("guest_2")}</p>}
      </div>
      <div className="eb-bar"><button className="eb-btn honey" onClick={() => place(orderNote)} style={{ fontSize: 16, padding: 16 }}>{t("send_order")} · {money(total)}</button></div>
    </div>
  );
}


function BillScreen({ table, orders, requestBill, back, toMenu }) {
  const { t } = useT();
  const sorted = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const grand = orders.reduce((s, o) => s + o.total, 0);
  const due = orders.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);
  const paidAmt = grand - due;
  const requested = orders.some((o) => !o.paid && o.billRequested);
  return (
    <div className="eb-screen">
      <div className="eb-pad" style={{ paddingTop: 6, display: "flex", alignItems: "center", gap: 12 }}><button onClick={back} style={{ fontSize: 22 }}>‹</button><h2 className="eb-serif" style={{ fontSize: 22, fontWeight: 600 }}>{t("bill_title", { n: table })}</h2></div>
      {orders.length === 0 ? (
        <div className="eb-empty"><div className="em">🧾</div><h3>{t("no_orders_yet")}</h3><p>{t("bill_builds")}</p><button className="eb-btn honey" style={{ width: "auto", marginTop: 16 }} onClick={toMenu}>{t("browse_menu")}</button></div>
      ) : (
        <div className="eb-pad">
          {sorted.map((o) => (
            <div key={o.id} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 14, marginBottom: 12, background: "var(--paper)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><b className="eb-mono" style={{ fontSize: 13 }}>{o.id}</b><span className={`eb-pp ${o.paid ? "paid" : "unpaid"}`}>{o.paid ? t("paid") : t("unpaid")}</span></div>
              {o.items.map((i, k) => (<div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginTop: 5 }}><span><span className="eb-mono" style={{ color: "var(--berry)", fontWeight: 700, marginInlineEnd: 6 }}>{i.qty}×</span>{i.name}</span><span>{money(i.price * i.qty)}</span></div>))}
              {o.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--berry)", marginTop: 4 }}><span>{t("reward_word")}</span><span>−{money(o.discount)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginTop: 7, paddingTop: 7, borderTop: "1px dashed var(--line)" }}><span>{t("order_total")}</span><span>{money(o.total)}</span></div>
            </div>
          ))}
          <div className="eb-stampcard" style={{ marginTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--ink-soft)" }}><span>{t("total_ordered")}</span><span>{money(grand)}</span></div>
            {paidAmt > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--ink-soft)", marginTop: 4 }}><span>{t("already_paid")}</span><span>{money(paidAmt)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 19, fontWeight: 700, marginTop: 8 }}><span>{due > 0 ? t("amount_due") : t("settled")}</span><span>{money(due)}</span></div>
          </div>
          {due > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14 }}><span className="eb-chip" style={{ background: "var(--line-2)", color: "var(--ink)" }}>💵 {t("pay_at_counter")}</span></div>
              <button className="eb-btn honey" disabled={requested} style={{ marginTop: 12, fontSize: 16, padding: 16, opacity: requested ? .6 : 1 }} onClick={requestBill}>{requested ? "✓ " + t("server_notified") : "🔔 " + t("ask_bill")}</button>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "center", marginTop: 10 }}>{requested ? t("someone_over", { n: table }) : t("ask_bill_hint")}</p>
            </>
          ) : <div className="eb-reward-banner" style={{ marginTop: 16, justifyContent: "center" }}><span style={{ fontSize: 24 }}>✅</span><b>{t("all_settled_thanks")}</b></div>}
        </div>
      )}
    </div>
  );
}

const STATUS_STEPS = [{ key: "new", icon: "✓", lbl: "step_received" }, { key: "preparing", icon: "👨‍🍳", lbl: "step_preparing" }, { key: "served", icon: "🍽️", lbl: "step_served" }];

function PlacedScreen({ order, table, user, stamps, hasReward, backToMenu, toAccount, toAuth, toBill }) {
  const { t } = useT();
  if (!order) return null;
  const idx = STATUS_STEPS.findIndex((s) => s.key === order.status);
  return (
    <div className="eb-screen">
      <div className="eb-pad" style={{ paddingTop: 24, textAlign: "center" }}>
        <div style={{ fontSize: 54 }}>🎉</div>
        <h2 className="eb-serif" style={{ fontSize: 26, fontWeight: 600, marginTop: 6 }}>{t("order_sent")}</h2>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>{t("getting_ready", { n: table })}</p>
        <div className="eb-mono" style={{ marginTop: 10, fontSize: 13, color: "var(--ink-soft)" }}>{t("order_id", { id: order.id })}</div>
        <div className="eb-steps">{STATUS_STEPS.map((s, i) => (<div key={s.key} className={`eb-step ${i < idx ? "done" : ""} ${i === idx ? "active" : ""}`}><div className="dot">{i < idx ? "✓" : s.icon}</div><small>{t(s.lbl)}</small></div>))}</div>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{t("status_updates")}</p>
        <div className="eb-sep" />
        {user ? (
          <div className="eb-stampcard"><b className="eb-serif" style={{ fontSize: 16 }}>{hasReward ? t("reward_unlocked") : t("stamp_earned")}</b><div className="eb-stamps">{Array.from({ length: REWARD_THRESHOLD }).map((_, i) => <div key={i} className={`eb-stamp ${(hasReward || i < stamps) ? "on" : ""}`}>☕</div>)}</div><button className="eb-btn ghost" style={{ marginTop: 14 }} onClick={toAccount}>{t("view_account")}</button></div>
        ) : (
          <div className="eb-stampcard" style={{ textAlign: "start" }}><b className="eb-serif" style={{ fontSize: 15 }}>{t("missed_stamp_t")}</b><p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 12px" }}>{t("missed_stamp_b")}</p><button className="eb-btn" onClick={toAuth}>{t("join_club")}</button></div>
        )}
        <button className="eb-btn honey" style={{ marginTop: 14 }} onClick={backToMenu}>{t("order_more")}</button>
        <button className="eb-btn ghost" style={{ marginTop: 10 }} onClick={toBill}>🧾 {t("view_bill")}</button>
      </div>
    </div>
  );
}

function AuthScreen({ onSignIn, back }) {
  const { t } = useT();
  const [email, setEmail] = useState(""); const [name, setName] = useState("");
  const ok = /\S+@\S+\.\S+/.test(email);
  return (
    <div className="eb-screen">
      <div className="eb-pad" style={{ paddingTop: 6, display: "flex", alignItems: "center", gap: 12 }}><button onClick={back} style={{ fontSize: 22 }}>‹</button><h2 className="eb-serif" style={{ fontSize: 22, fontWeight: 600 }}>{t("join_club")}</h2></div>
      <div className="eb-pad" style={{ marginTop: 8 }}>
        <div className="eb-reward-banner" style={{ marginBottom: 20 }}><span style={{ fontSize: 26 }}>☕</span><div style={{ fontSize: 13 }}>{t("join_banner")}</div></div>
        <label className="eb-label">{t("your_name")}</label><input className="eb-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayşe" />
        <div style={{ height: 14 }} />
        <label className="eb-label">{t("email")}</label><input className="eb-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "8px 0 18px" }}>{t("email_consent")}</p>
        <button className="eb-btn honey" disabled={!ok} style={{ opacity: ok ? 1 : .5, fontSize: 16, padding: 15 }} onClick={() => onSignIn(email, name)}>{t("create_account")}</button>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 14, textAlign: "center" }}>{t("already_member")}</p>
      </div>
    </div>
  );
}

function AccountScreen({ user, record, stamps, hasReward, orders, reorder, back, signOut, toAuth }) {
  const { t } = useT();
  if (!user) return (
    <div className="eb-screen">
      <div className="eb-pad" style={{ paddingTop: 6, display: "flex", alignItems: "center", gap: 12 }}><button onClick={back} style={{ fontSize: 22 }}>‹</button><h2 className="eb-serif" style={{ fontSize: 22, fontWeight: 600 }}>{t("account")}</h2></div>
      <div className="eb-empty"><div className="em">⭐</div><h3>{t("not_signed_in")}</h3><p>{t("join_to_track")}</p><button className="eb-btn honey" style={{ width: "auto", marginTop: 16 }} onClick={toAuth}>{t("join_club")}</button></div>
    </div>
  );
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return (
    <div className="eb-screen">
      <div className="eb-pad" style={{ paddingTop: 6, display: "flex", alignItems: "center", gap: 12 }}><button onClick={back} style={{ fontSize: 22 }}>‹</button><h2 className="eb-serif" style={{ fontSize: 22, fontWeight: 600 }}>{t("hi_name", { name: record?.name })}</h2></div>
      <div className="eb-pad">
        <div className="eb-stampcard">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><b className="eb-serif" style={{ fontSize: 17 }}>{t("bean_club")}</b><span className="eb-pill-mini">{t("orders_count", { n: record?.orders || 0 })}</span></div>
          <div className="eb-stamps">{Array.from({ length: REWARD_THRESHOLD }).map((_, i) => <div key={i} className={`eb-stamp ${(hasReward || i < stamps) ? "on" : ""}`}>☕</div>)}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 10 }}>{hasReward ? t("reward_ready_short") : t("more_until", { n: REWARD_THRESHOLD - stamps })}</div>
        </div>
        <h3 className="eb-serif" style={{ fontSize: 16, fontWeight: 600, margin: "22px 0 10px" }}>{t("order_history")}</h3>
        {sorted.length === 0 ? <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>{t("no_orders_hist")}</p> : sorted.map((o) => (
          <div key={o.id} style={{ border: "1px solid var(--line)", borderRadius: 13, padding: 13, marginBottom: 10, background: "var(--paper)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b className="eb-mono" style={{ fontSize: 13 }}>{o.id}</b>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className={`eb-pp ${o.paid ? "paid" : "unpaid"}`}>{o.paid ? t("paid") : t("unpaid")}</span><span style={{ fontSize: 13, fontWeight: 700 }}>{money(o.total)}</span></div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 5 }}>{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{t("table_n", { n: o.table })} · {new Date(o.createdAt).toLocaleDateString()}</span>
              <button className="eb-link" style={{ fontSize: 13 }} onClick={() => reorder(o)}>↻ {t("reorder")}</button>
            </div>
          </div>
        ))}
        <button className="eb-btn ghost" style={{ marginTop: 14 }} onClick={signOut}>{t("sign_out")}</button>
      </div>
    </div>
  );
}


function StaffLogin({ onSuccess, onBack }) {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => {
    if (email.trim().toLowerCase() === STAFF_EMAIL.toLowerCase() && pw === STAFF_PASSWORD) { setErr(false); onSuccess(); }
    else setErr(true);
  };
  const onKey = (e) => { if (e.key === "Enter") submit(); };
  return (
    <div className="eb-login">
      <div className="eb-login-card">
        <div className="lock">🔒</div>
        <h1 className="eb-serif">{t("staff_login_title")}</h1>
        <p className="sub">{t("staff_login_sub")}</p>
        {err && <div className="err">{t("staff_wrong")}</div>}
        <label className="eb-label">{t("email")}</label>
        <input className="eb-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={onKey} placeholder="admin@hearthbean.co" autoComplete="username" />
        <div style={{ height: 14 }} />
        <label className="eb-label">{t("staff_password")}</label>
        <input className="eb-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={onKey} autoComplete="current-password" />
        <button className="eb-btn" style={{ marginTop: 20, fontSize: 15, padding: 14 }} onClick={submit}>{t("staff_signin")}</button>
        <button className="eb-link" style={{ display: "block", margin: "16px auto 0", fontSize: 13 }} onClick={onBack}>{t("staff_back_customer")}</button>
      </div>
    </div>
  );
}

function AdminApp({ orders, setOrders, customers, menu, setMenu, slides, setSlides, flash, resetDemo, onSignOut }) {
  const { t } = useT();
  const [tab, setTab] = useState("orders");
  const newCount = orders.filter((o) => o.status === "new").length;
  const setStatus = (id, status) => { setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o))); flash(t("t_order_status", { id, status: t("pill_" + status) || status })); };
  const setPaid = (id, paid) => { setOrders((os) => os.map((o) => (o.id === id ? { ...o, paid, paidAt: paid ? new Date().toISOString() : null, billRequested: paid ? false : o.billRequested } : o))); };
  const setTablePaid = (table, paid) => { setOrders((os) => os.map((o) => (o.table === table ? { ...o, paid, paidAt: paid ? new Date().toISOString() : null, billRequested: paid ? false : o.billRequested } : o))); flash(paid ? t("t_table_paid", { n: table }) : t("t_table_reopened", { n: table })); };
  return (
    <div className="eb-admin">
      <div className="eb-anav">
        <div className="brand"><b>🔥</b> Hearth &amp; Bean</div>
        <button className={`eb-atab ${tab === "orders" ? "on" : ""}`} onClick={() => setTab("orders")}>{t("nav_orders")}{newCount > 0 && ` · ${newCount}`}</button>
        <button className={`eb-atab ${tab === "tables" ? "on" : ""}`} onClick={() => setTab("tables")}>{t("nav_tables")}</button>
        <button className={`eb-atab ${tab === "menu" ? "on" : ""}`} onClick={() => setTab("menu")}>{t("nav_menu")}</button>
        <button className={`eb-atab ${tab === "gallery" ? "on" : ""}`} onClick={() => setTab("gallery")}>{t("nav_gallery")}</button>
        <button className={`eb-atab ${tab === "brand" ? "on" : ""}`} onClick={() => setTab("brand")}>{t("nav_brand")}</button>
        <button className={`eb-atab ${tab === "stats" ? "on" : ""}`} onClick={() => setTab("stats")}>{t("nav_stats")}</button>
        <button className={`eb-atab ${tab === "customers" ? "on" : ""}`} onClick={() => setTab("customers")}>{t("nav_customers")}</button>
        <div style={{ flex: 1 }} />
        <LangPicker dark />
        <span style={{ fontSize: 12.5, color: "#cfd8cf", whiteSpace: "nowrap" }}>{t("staff_counter")}</span>
        <button className="eb-atab" onClick={resetDemo} title={t("reset_demo")}>↻</button>
        <button className="eb-atab" onClick={onSignOut} title={t("staff_signout")}>⎋</button>
      </div>
      <div className="eb-awrap">
        {tab === "orders" && <AdminOrders orders={orders} setStatus={setStatus} setPaid={setPaid} />}
        {tab === "tables" && <AdminTables orders={orders} setTablePaid={setTablePaid} />}
        {tab === "menu" && <AdminMenu menu={menu} setMenu={setMenu} flash={flash} />}
        {tab === "gallery" && <AdminGallery slides={slides} setSlides={setSlides} flash={flash} />}
        {tab === "brand" && <AdminBrand flash={flash} />}
        {tab === "stats" && <AdminStats orders={orders} customers={customers} menu={menu} />}
        {tab === "customers" && <AdminCustomers customers={customers} flash={flash} />}
      </div>
    </div>
  );
}

function AdminOrders({ orders, setStatus, setPaid }) {
  const { t } = useT();
  const [filter, setFilter] = useState("active");
  const list = orders.filter((o) => filter === "all" ? true : filter === "active" ? o.status !== "served" : o.status === filter).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return (
    <div>
      <div className="eb-ahead"><div><h1 className="eb-serif">{t("live_orders")}</h1><p>{t("live_orders_sub")}</p></div></div>
      <div className="eb-filters">
        {["active", "new", "preparing", "served", "all"].map((f) => (<button key={f} className={`eb-fpill ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>{t("f_" + f)}</button>))}
      </div>
      {list.length === 0 ? (
        <div className="eb-empty"><div className="em">🧾</div><h3>{t("no_orders_admin_t")}</h3><p>{t("no_orders_admin_b")}</p></div>
      ) : (
        <div className="eb-tickets">
          {list.map((o) => (
            <div className="eb-ticket" key={o.id}>
              <div className="eb-ticket-top">
                <div className="eb-tt"><span className="eb-table-badge">{t("table_n", { n: o.table })}</span><div className="eb-tnum"><b>{o.id}</b><br />{timeAgo(o.createdAt, t)}</div></div>
                <span className={`eb-status ${o.status}`}>{t("pill_" + o.status)}</span>
              </div>
              <div className="eb-ticket-body">
                {o.items.map((i, k) => (<div key={k}><div className="eb-trow"><span><span className="q">{i.qty}×</span>{i.name}</span><span>{money(i.price * i.qty)}</span></div>{i.note && <div className="eb-tnote">📝 {i.note}</div>}</div>))}
                {o.orderNote && <div className="eb-tnote">🗒️ {o.orderNote}</div>}
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 8 }}>{o.customerName ? `${o.customerName}${o.rewardUsed ? " · 🎁 " + t("reward_tag") : ""}` : t("guest")}</div>
                <div className="eb-pay-row"><span className={`eb-pp ${o.paid ? "paid" : "unpaid"}`}>{o.paid ? t("paid") : t("unpaid")}</span><button className="eb-paybtn" onClick={() => setPaid(o.id, !o.paid)}>{o.paid ? t("mark_unpaid") : t("mark_paid")}</button></div>
              </div>
              <div className="eb-ticket-foot">
                {o.status === "new" && <button className="eb-tbtn primary" onClick={() => setStatus(o.id, "preparing")}>{t("start_preparing")}</button>}
                {o.status === "preparing" && <button className="eb-tbtn done" onClick={() => setStatus(o.id, "served")}>{t("mark_served")}</button>}
                {o.status === "served" && <button className="eb-tbtn muted" onClick={() => setStatus(o.id, "preparing")}>{t("reopen")}</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function AdminTables({ orders, setTablePaid }) {
  const { t } = useT();
  const byTable = {};
  orders.forEach((o) => { if (!byTable[o.table]) byTable[o.table] = []; byTable[o.table].push(o); });
  const tables = Object.entries(byTable).map(([table, os]) => {
    const due = os.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);
    const grand = os.reduce((s, o) => s + o.total, 0);
    const called = os.some((o) => !o.paid && o.billRequested);
    const active = os.filter((o) => o.status !== "served").length;
    return { table: Number(table), os, due, grand, called, active };
  }).sort((a, b) => (b.called - a.called) || (b.due - a.due) || (a.table - b.table));
  const owingCount = tables.filter((t2) => t2.due > 0).length;
  const owingTotal = tables.filter((t2) => t2.due > 0).reduce((s, t2) => s + t2.due, 0);
  return (
    <div>
      <div className="eb-ahead"><div><h1 className="eb-serif">{t("tables")}</h1><p>{t("tables_sub")}</p></div></div>
      {tables.length === 0 ? (
        <div className="eb-empty"><div className="em">🪑</div><h3>{t("no_tables_t")}</h3><p>{t("no_tables_b")}</p></div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}><span className="eb-chip" style={{ background: owingCount ? "var(--berry)" : "var(--pine)" }}>{owingCount ? t("n_owing", { n: owingCount, total: money(owingTotal) }) : t("all_tables_settled")}</span></div>
          <div className="eb-floor">
            {tables.map((tb) => (
              <div key={tb.table} className={`eb-tablecard ${tb.due > 0 ? "owing" : ""} ${tb.called ? "called" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="eb-table-badge">{t("table_n", { n: tb.table })}</span>{tb.active > 0 && <span className="eb-pill-mini">{tb.active} {t("in_kitchen")}</span>}</div>
                <div style={{ marginTop: 12 }}>
                  {tb.due > 0 ? (<><div style={{ fontSize: 22, fontWeight: 700, color: "var(--berry)" }}>{money(tb.due)}</div><div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{t("of_total", { total: money(tb.grand) })}</div></>) : (<div style={{ fontSize: 15, fontWeight: 600, color: "var(--pine)" }}>{t("paid_in_full", { total: money(tb.grand) })}</div>)}
                </div>
                {tb.called && <div className="eb-called">{t("bill_requested_alert")}</div>}
                <button className={`eb-btn ${tb.due > 0 ? "honey" : "ghost"}`} style={{ marginTop: 12, fontSize: 13, padding: 10 }} onClick={() => setTablePaid(tb.table, tb.due > 0)}>{tb.due > 0 ? t("mark_paid_due", { due: money(tb.due) }) : t("reopen_bill")}</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


function ItemEditor({ item, onSave, onClose }) {
  const { t } = useT();
  const blank = { id: "", cat: "hot", name: "", desc: "", ingredients: "", price: 0, emoji: "☕", image: "", available: true };
  const [f, setF] = useState(item || blank);
  const fileRef = useRef(null);
  const onFile = (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setF((s) => ({ ...s, image: reader.result })); reader.readAsDataURL(file); };
  const save = () => { const id = f.id || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24) || "item-" + Date.now(); onSave({ ...f, id, price: Number(f.price) || 0 }); };
  return (
    <div className="eb-overlay" onClick={onClose}>
      <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{item ? t("edit_item_title") : t("add_item_title")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 16 }}>{t("menu_editor_sub")}</p>
        <div className="eb-uploader">
          <div className="eb-preview"><SmartImg src={f.image} alt="" fallback={<span>{f.emoji}</span>} /></div>
          <div style={{ flex: 1 }}>
            <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={onFile} />
            <button className="eb-btn ghost" style={{ fontSize: 13, padding: 9 }} onClick={() => fileRef.current?.click()}>{t("upload_photo")}</button>
            {f.image && <button className="eb-link" style={{ fontSize: 12, marginTop: 6 }} onClick={() => setF((s) => ({ ...s, image: "" }))}>{t("remove_photo")}</button>}
          </div>
        </div>
        <div style={{ marginTop: 12 }}><label className="eb-label">{t("paste_url")}</label><input className="eb-input" value={f.image?.startsWith("data:") ? "" : f.image} onChange={(e) => setF((s) => ({ ...s, image: e.target.value }))} placeholder="https://…" /></div>
        <div className="eb-two" style={{ marginTop: 14 }}>
          <div><label className="eb-label">{t("name")}</label><input className="eb-input" value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} /></div>
          <div><label className="eb-label">{t("category")}</label><select className="eb-input" value={f.cat} onChange={(e) => setF((s) => ({ ...s, cat: e.target.value }))}>{CATS.map((c) => <option key={c.key} value={c.key}>{t("cat_" + c.key)}</option>)}</select></div>
        </div>
        <div className="eb-two" style={{ marginTop: 14 }}>
          <div><label className="eb-label">{t("price")} (₺)</label><input className="eb-input" type="number" value={f.price} onChange={(e) => setF((s) => ({ ...s, price: e.target.value }))} /></div>
          <div><label className="eb-label">{t("emoji")}</label><input className="eb-input" value={f.emoji} onChange={(e) => setF((s) => ({ ...s, emoji: e.target.value }))} /></div>
        </div>
        <div style={{ marginTop: 14 }}><label className="eb-label">{t("short_desc")}</label><input className="eb-input" value={f.desc} onChange={(e) => setF((s) => ({ ...s, desc: e.target.value }))} /></div>
        <div style={{ marginTop: 14 }}><label className="eb-label">{t("ingredients")}</label><input className="eb-input" value={f.ingredients} onChange={(e) => setF((s) => ({ ...s, ingredients: e.target.value }))} /></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{f.available ? t("available_order") : t("marked_sold_out")}</span>
          <button className={`eb-toggle ${f.available ? "on" : ""}`} onClick={() => setF((s) => ({ ...s, available: !s.available }))}><i /></button>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}><button className="eb-btn ghost" onClick={onClose}>{t("cancel")}</button><button className="eb-btn honey" disabled={!f.name} onClick={save}>{item ? t("save_changes") : t("add_to_menu")}</button></div>
      </div>
    </div>
  );
}

function AdminMenu({ menu, setMenu, flash }) {
  const { t } = useT();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const save = (item) => {
    setMenu((m) => { const exists = m.some((i) => i.id === item.id); return exists ? m.map((i) => (i.id === item.id ? item : i)) : [...m, item]; });
    flash(t("t_changes_saved")); setEditing(null); setAdding(false);
  };
  const toggleAvail = (id) => setMenu((m) => m.map((i) => (i.id === id ? { ...i, available: !i.available } : i)));
  const remove = (id) => setMenu((m) => m.filter((i) => i.id !== id));
  return (
    <div>
      <div className="eb-ahead"><div><h1 className="eb-serif">{t("nav_menu")}</h1><p>{t("menu_admin_sub")}</p></div><button className="eb-btn honey" style={{ width: "auto", padding: "12px 20px" }} onClick={() => setAdding(true)}>+ {t("add_item")}</button></div>
      {CATS.map((c) => { const items = menu.filter((i) => i.cat === c.key); return (
        <div key={c.key} className="eb-medit-cat">
          <h2>{t("cat_" + c.key)} <small>{t("items_count", { n: items.length })}</small></h2>
          {items.length === 0 ? <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>{t("empty_cat")}</p> : items.map((it) => (
            <div key={it.id} className={`eb-mrow ${!it.available ? "out" : ""}`}>
              <div className="eb-thumb" style={{ background: CAT_TINT[c.key], width: 50, height: 50 }}><SmartImg src={it.image} alt={it.name} fallback={<span style={{ fontSize: 24 }}>{it.emoji}</span>} /></div>
              <div className="info"><b>{it.name}</b>{it.ingredients && <div className="ing">{it.ingredients}</div>}</div>
              <div className="pr">{money(it.price)}</div>
              <button className={`eb-toggle ${it.available ? "on" : ""}`} onClick={() => toggleAvail(it.id)} title={t("available_order")}><i /></button>
              <button className="eb-iconbtn" onClick={() => setEditing(it)}>✏️</button>
              <button className="eb-iconbtn" onClick={() => remove(it.id)}>🗑️</button>
            </div>
          ))}
        </div>
      ); })}
      {(editing || adding) && <ItemEditor item={editing} onSave={save} onClose={() => { setEditing(null); setAdding(false); }} />}
    </div>
  );
}


function SlideEditor({ slide, onSave, onClose }) {
  const { t } = useT();
  const blank = { id: "", img: "", cap: "", emoji: "🪟", grad: SLIDE_GRADS[0] };
  const [f, setF] = useState(slide || blank);
  const fileRef = useRef(null);
  const onFile = (e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setF((s) => ({ ...s, img: reader.result })); reader.readAsDataURL(file); };
  const save = () => onSave({ ...f, id: f.id || "slide-" + Date.now() });
  return (
    <div className="eb-overlay" onClick={onClose}>
      <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{slide ? t("edit_photo_title") : t("add_photo_title")}</h3>
        <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 16 }}>{t("gallery_editor_sub")}</p>
        <div className="eb-uploader">
          <div className="eb-preview" style={{ width: 120, height: 80, borderRadius: 12 }}><SmartImg src={f.img} alt="" fallback={<span style={{ background: f.grad, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{f.emoji}</span>} /></div>
          <div style={{ flex: 1 }}>
            <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={onFile} />
            <button className="eb-btn ghost" style={{ fontSize: 13, padding: 9 }} onClick={() => fileRef.current?.click()}>{t("upload_photo")}</button>
            {f.img && <button className="eb-link" style={{ fontSize: 12, marginTop: 6 }} onClick={() => setF((s) => ({ ...s, img: "" }))}>{t("remove_photo")}</button>}
          </div>
        </div>
        <div style={{ marginTop: 12 }}><label className="eb-label">{t("paste_url")}</label><input className="eb-input" value={f.img?.startsWith("data:") ? "" : f.img} onChange={(e) => setF((s) => ({ ...s, img: e.target.value }))} placeholder="https://…" /></div>
        <div style={{ marginTop: 14 }}><label className="eb-label">{t("caption")}</label><input className="eb-input" value={f.cap} onChange={(e) => setF((s) => ({ ...s, cap: e.target.value }))} /></div>
        <div style={{ marginTop: 14 }}>
          <label className="eb-label">{t("fallback_colour")}</label>
          <div style={{ display: "flex", gap: 8 }}>{SLIDE_GRADS.map((g, i) => (<button key={i} onClick={() => setF((s) => ({ ...s, grad: g }))} style={{ width: 34, height: 34, borderRadius: 9, background: g, border: f.grad === g ? "3px solid var(--honey)" : "1px solid var(--line)" }} />))}</div>
          <p style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 8 }}>{t("fallback_hint")}</p>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}><button className="eb-btn ghost" onClick={onClose}>{t("cancel")}</button><button className="eb-btn honey" onClick={save}>{slide ? t("save_changes") : t("add_to_menu")}</button></div>
      </div>
    </div>
  );
}

function AdminBrand({ flash }) {
  const { t } = useT();
  const { themeId, setThemeId } = useTheme();
  const pick = (th) => { setThemeId(th.id); flash(t("theme_applied", { name: th.label })); };
  return (
    <div>
      <div className="eb-ahead"><div><h1 className="eb-serif">{t("brand_title")}</h1><p>{t("brand_sub")}</p></div></div>
      <div className="eb-theme-grid">
        {THEMES.map((th) => (
          <div key={th.id} className={`eb-themecard ${themeId === th.id ? "on" : ""}`} onClick={() => pick(th)}>
            <div className="eb-theme-swatches">{th.swatch.map((c, i) => <i key={i} style={{ background: c }} />)}</div>
            <b style={{ fontSize: 15 }}>{th.label}</b>
            {themeId === th.id && <div style={{ marginTop: 6 }}><span className="eb-pill-mini">✓ {t("current_theme")}</span></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminGallery({ slides, setSlides, flash }) {
  const { t } = useT();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const save = (s) => { setSlides((arr) => { const exists = arr.some((x) => x.id === s.id); return exists ? arr.map((x) => (x.id === s.id ? s : x)) : [...arr, s]; }); flash(editing ? t("t_photo_updated") : t("t_photo_added")); setEditing(null); setAdding(false); };
  const remove = (id) => { setSlides((arr) => arr.filter((x) => x.id !== id)); flash(t("t_photo_removed")); };
  const move = (id, dir) => setSlides((arr) => { const i = arr.findIndex((x) => x.id === id); const j = i + dir; if (j < 0 || j >= arr.length) return arr; const copy = [...arr]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy; });
  return (
    <div>
      <div className="eb-ahead"><div><h1 className="eb-serif">{t("gallery")}</h1><p>{t("gallery_sub")}</p></div><button className="eb-btn honey" style={{ width: "auto", padding: "12px 20px" }} onClick={() => setAdding(true)}>+ {t("add_photo")}</button></div>
      {slides.length === 0 ? (
        <div className="eb-empty"><div className="em">🖼️</div><h3>{t("no_photos_t")}</h3><p>{t("no_photos_b")}</p></div>
      ) : (
        <div className="eb-gallery">
          {slides.map((s, i) => (
            <div key={s.id} className="eb-grow">
              <div className="eb-gthumb"><SmartImg src={s.img} alt={s.cap} fallback={<div style={{ width: "100%", height: "100%", background: s.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{s.emoji}</div>} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14 }}>{s.cap || t("no_caption")}</b>
                <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{s.img ? t("uploaded_photo") : t("gradient_fallback")}</div>
              </div>
              <button className="eb-iconbtn" onClick={() => move(s.id, -1)} disabled={i === 0} style={{ opacity: i === 0 ? .4 : 1 }}>↑</button>
              <button className="eb-iconbtn" onClick={() => move(s.id, 1)} disabled={i === slides.length - 1} style={{ opacity: i === slides.length - 1 ? .4 : 1 }}>↓</button>
              <button className="eb-iconbtn" onClick={() => setEditing(s)}>✏️</button>
              <button className="eb-iconbtn" onClick={() => remove(s.id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
      {(editing || adding) && <SlideEditor slide={editing} onSave={save} onClose={() => { setEditing(null); setAdding(false); }} />}
    </div>
  );
}


function AdminStats({ orders, customers, menu }) {
  const { t } = useT();
  if (orders.length === 0) return (
    <div>
      <div className="eb-ahead"><div><h1 className="eb-serif">{t("statistics")}</h1><p>{t("stats_sub2")}</p></div></div>
      <div className="eb-empty"><div className="em">📊</div><h3>{t("no_data_t")}</h3><p>{t("no_data_b")}</p></div>
    </div>
  );
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const outstanding = orders.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0);
  const avg = revenue / orders.length;
  const members = Object.keys(customers).length;
  const repeat = Object.values(customers).filter((c) => c.orders > 1).length;
  const itemCounts = {};
  orders.forEach((o) => o.items.forEach((i) => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty; }));
  const bestSellers = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxItem = bestSellers[0]?.[1] || 1;
  const tableCounts = {};
  orders.forEach((o) => { tableCounts[o.table] = (tableCounts[o.table] || 0) + 1; });
  const busiestTables = Object.entries(tableCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxTable = busiestTables[0]?.[1] || 1;
  const hourCounts = Array(24).fill(0);
  orders.forEach((o) => { hourCounts[new Date(o.createdAt).getHours()] += 1; });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const maxHour = Math.max(...hourCounts, 1);
  return (
    <div>
      <div className="eb-ahead"><div><h1 className="eb-serif">{t("statistics")}</h1><p>{t("stats_sub")}</p></div></div>
      <div className="eb-stats-grid">
        <div className="eb-stat"><div className="k">{t("revenue")}</div><div className="v serif">{money(revenue)}</div></div>
        <div className="eb-stat"><div className="k">{t("outstanding")}</div><div className="v serif" style={{ color: outstanding > 0 ? "var(--berry)" : "var(--pine)" }}>{money(outstanding)}</div></div>
        <div className="eb-stat"><div className="k">{t("orders_stat")}</div><div className="v">{orders.length}</div></div>
        <div className="eb-stat"><div className="k">{t("avg_order")}</div><div className="v serif">{money(avg)}</div></div>
        <div className="eb-stat"><div className="k">{t("members")}</div><div className="v">{members}</div></div>
        <div className="eb-stat"><div className="k">{t("repeat_guests")}</div><div className="v">{repeat}</div></div>
        <div className="eb-stat"><div className="k">{t("peak_hour")}</div><div className="v">{String(peakHour).padStart(2, "0")}:00</div></div>
      </div>
      <div className="eb-two">
        <div className="eb-panel"><h3>{t("best_sellers")}</h3>{bestSellers.map(([name, n]) => (<div key={name} className="eb-bar-row"><span className="nm">{name}</span><div className="eb-bar-track"><div className="eb-bar-fill" style={{ width: `${(n / maxItem) * 100}%` }} /></div><span className="vl">{n}</span></div>))}</div>
        <div className="eb-panel"><h3>{t("busiest_tables")}</h3>{busiestTables.map(([tb, n]) => (<div key={tb} className="eb-bar-row"><span className="nm">{t("table_n", { n: tb })}</span><div className="eb-bar-track"><div className="eb-bar-fill" style={{ width: `${(n / maxTable) * 100}%` }} /></div><span className="vl">{n}</span></div>))}</div>
      </div>
      <div className="eb-panel" style={{ marginTop: 16 }}>
        <h3>{t("orders_by_hour")}</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 90 }}>
          {hourCounts.map((n, h) => (<div key={h} title={`${h}:00 — ${n}`} style={{ flex: 1, background: n ? "var(--pine)" : "var(--line-2)", height: `${Math.max(4, (n / maxHour) * 90)}px`, borderRadius: 3 }} />))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-soft)", marginTop: 6 }}><span>00:00</span><span>12:00</span><span>23:00</span></div>
      </div>
    </div>
  );
}


function AdminCustomers({ customers, flash }) {
  const { t } = useT();
  const list = Object.values(customers).sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState(""); const [msg, setMsg] = useState("");
  const send = () => { flash(t("t_promo_queued", { n: list.length })); setComposing(false); setSubject(""); setMsg(""); };
  return (
    <div>
      <div className="eb-ahead"><div><h1 className="eb-serif">{t("customers")}</h1><p>{t("customers_sub")}</p></div>{list.length > 0 && <button className="eb-btn honey" style={{ width: "auto", padding: "12px 20px" }} onClick={() => setComposing(true)}>✉️ {t("email_all")}</button>}</div>
      {list.length === 0 ? (
        <div className="eb-empty"><div className="em">👥</div><h3>{t("no_members_t")}</h3><p>{t("no_members_b")}</p></div>
      ) : (
        <div className="eb-panel" style={{ overflowX: "auto" }}>
          <table className="eb-ctable">
            <thead><tr><th>{t("col_name")}</th><th>{t("col_email")}</th><th>{t("col_orders")}</th><th>{t("col_stamps")}</th><th>{t("col_spent")}</th><th>{t("col_joined")}</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.email}>
                  <td><b>{c.name}</b></td><td className="eb-mono" style={{ fontSize: 12.5 }}>{c.email}</td><td>{c.orders}</td>
                  <td><span className="eb-pill-mini">☕ {c.stamps}</span></td><td>{money(c.totalSpent)}</td><td style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{new Date(c.joinedAt).toLocaleDateString()}</td>
                  <td><button className="eb-link" style={{ fontSize: 12.5 }} onClick={() => setComposing(c.email)}>{t("email_btn")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {composing && (
        <div className="eb-overlay" onClick={() => setComposing(false)}>
          <div className="eb-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("compose_promo")}</h3>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "4px 0 16px" }}>{t("to_label")} {typeof composing === "string" ? composing : t("all_members_n", { n: list.length })}</p>
            <label className="eb-label">{t("subject")}</label><input className="eb-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <div style={{ height: 14 }} />
            <label className="eb-label">{t("message")}</label><textarea className="eb-input" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} />
            <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "10px 0 4px" }}>{t("promo_demo_note")}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}><button className="eb-btn ghost" onClick={() => setComposing(false)}>{t("cancel")}</button><button className="eb-btn honey" onClick={send}>{t("send_promo")}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
