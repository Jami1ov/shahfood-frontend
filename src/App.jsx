import { useState, useEffect } from "react";
import { Search, MapPin, ArrowLeft, Plus, Minus, User, ShoppingBag, Home, Package, LogOut, Phone, ChevronRight, Check, X, Edit3, Wallet, CreditCard, Star } from "lucide-react";

const API = "https://shahfood-backend-production.up.railway.app";
const SHAHRISABZ = { lat: 39.0593, lon: 66.8487 };
const BRAND = "#c2622f";
const BRAND_DARK = "#9c4a1e";

const fmt = n => (n || 0).toLocaleString("uz-UZ") + " so'm";
const normPhone = p => { const d = String(p || "").replace(/\D/g, ""); return d.startsWith("998") ? d : (d.length === 9 ? "998" + d : d); };
const haversine = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lat2) return null;
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

async function apiCall(path, { method = "GET", body, token } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = {};
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  html,body,#root{height:100%}
  body{font-family:'Manrope',sans-serif;background:#faf6ef;color:#2b211a;line-height:1.5;
    background-image:radial-gradient(circle at 1px 1px,rgba(150,110,70,.05) 1px,transparent 0);background-size:24px 24px;}
  h1,h2,h3{font-family:'Fraunces',serif;font-weight:600;letter-spacing:-.01em}
  button,input,textarea,select{font-family:inherit;font-size:inherit;color:inherit}
  button{cursor:pointer;border:none;background:none}
  input,textarea{outline:none}
  a{color:inherit;text-decoration:none}
  .app{max-width:480px;margin:0 auto;min-height:100vh;background:#faf6ef;position:relative;padding-bottom:80px}
  @media(min-width:640px){.app{box-shadow:0 0 40px rgba(60,40,20,.07)}}
`;

/* ---------- UI helpers ---------- */
function Toast({ msg }) {
  if (!msg) return null;
  return <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#2b211a", color: "#fff", padding: "10px 18px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 9999, maxWidth: "85%", textAlign: "center" }}>{msg}</div>;
}

function Header({ title, onBack, search, setSearch }) {
  return (
    <div style={{ position: "sticky", top: 0, background: "#faf6ef", zIndex: 50, borderBottom: "1px solid #ece2d4", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ padding: 8, marginLeft: -8, borderRadius: 10 }}>
            <ArrowLeft size={22} />
          </button>
        )}
        {title ? (
          <h2 style={{ fontSize: 20 }}>{title}</h2>
        ) : (
          <>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 600, color: BRAND }}>Dastur<span style={{ color: "#d99a2b" }}>xon</span></div>
            <div style={{ flex: 1, position: "relative", marginLeft: 8 }}>
              <Search size={18} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a7a6b" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Restoran qidirish…"
                style={{ width: "100%", padding: "10px 12px 10px 38px", border: "1px solid #ece2d4", borderRadius: 22, background: "#fffdf9", fontSize: 14 }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { k: "home", icon: Home, label: "Bosh" },
    { k: "search", icon: Search, label: "Qidiruv" },
    { k: "orders", icon: Package, label: "Buyurtmalar" },
    { k: "profile", icon: User, label: "Profil" }
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fffdf9", borderTop: "1px solid #ece2d4", padding: "8px 0 calc(8px + env(safe-area-inset-bottom))", zIndex: 100 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex" }}>
        {items.map(({ k, icon: Icon, label }) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "6px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: tab === k ? BRAND : "#8a7a6b" }}>
            <Icon size={22} strokeWidth={tab === k ? 2.4 : 1.8} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Home / Restaurants list ---------- */
function RestaurantsList({ restaurants, userLoc, onOpen, search, setSearch }) {
  const filtered = restaurants
    .map(r => ({ ...r, dist: userLoc ? haversine(userLoc.lat, userLoc.lon, r.lat, r.lon) : null }))
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.dist || 999) - (b.dist || 999));

  return (
    <>
      <Header search={search} setSearch={setSearch} />
      <div style={{ padding: "16px 16px 20px" }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Shahrisabz<span style={{ color: BRAND }}>.</span></h1>
        <div style={{ color: "#8a7a6b", fontSize: 14, fontWeight: 500, marginBottom: 20 }}>Eng yaxshi taomlar — eshigingiz oldida</div>

        {!filtered.length && (
          <div style={{ textAlign: "center", padding: 40, color: "#8a7a6b" }}>Restoran topilmadi</div>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          {filtered.map(r => (
            <button key={r.id} onClick={() => onOpen(r)}
              style={{ textAlign: "left", background: "#fffdf9", border: "1px solid #ece2d4", borderRadius: 18, overflow: "hidden", boxShadow: "0 1px 2px rgba(60,40,20,.04),0 8px 20px rgba(60,40,20,.04)", opacity: r.is_open === false ? 0.55 : 1 }}>
              <div style={{ background: r.bg_gradient || `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`, height: 110, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, position: "relative" }}>
                <span>{r.emoji || "🍽️"}</span>
                {r.badge && <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,.92)", color: "#2b211a", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{r.badge}</div>}
                {r.is_open === false && <div style={{ position: "absolute", top: 10, right: 10, background: "#c0392b", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Yopiq</div>}
              </div>
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{r.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#8a7a6b", fontWeight: 500 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={14} fill="#d99a2b" stroke="#d99a2b" /> {r.rating || "—"}</span>
                  <span>·</span>
                  <span>{fmt(r.delivery_fee)} yetkazma</span>
                  {r.dist != null && (<><span>·</span><span>{r.dist} km</span></>)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- Restaurant detail with menu ---------- */
function RestaurantDetail({ restaurant, onBack, cart, addToCart, removeFromCart, onCheckout }) {
  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState(null);

  useEffect(() => {
    apiCall(`/api/restaurants/${restaurant.id}/menu`).then(d => {
      setMenu(d);
      if (d.categories?.length) setActiveCat(d.categories[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [restaurant.id]);

  const cartItems = Object.values(cart).filter(c => c.restaurantId === restaurant.id);
  const cartTotal = cartItems.reduce((s, c) => s + c.price * c.qty, 0);

  const filteredItems = activeCat ? menu.items.filter(i => i.category_id === activeCat) : menu.items;

  return (
    <>
      <div style={{ background: restaurant.bg_gradient || `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`, padding: "18px 16px 24px", color: "#fff", position: "relative" }}>
        <button onClick={onBack} style={{ padding: 8, marginLeft: -8, borderRadius: 10, color: "#fff" }}><ArrowLeft size={22} /></button>
        <div style={{ fontSize: 50, marginTop: 8 }}>{restaurant.emoji}</div>
        <h1 style={{ fontSize: 28, color: "#fff", marginTop: 4 }}>{restaurant.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, marginTop: 8, opacity: 0.95, fontWeight: 600 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={14} fill="#fff" /> {restaurant.rating || "—"}</span>
          <span>·</span><span>{fmt(restaurant.delivery_fee)} yetkazma</span>
          <span>·</span><span>Min {fmt(restaurant.min_order)}</span>
        </div>
        {restaurant.address && <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {restaurant.address}</div>}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#8a7a6b" }}>Menyu yuklanmoqda…</div>
      ) : !menu.items?.length ? (
        <div style={{ padding: 60, textAlign: "center", color: "#8a7a6b" }}>Bu restoranda hozircha menyu qo'shilmagan 🍽️</div>
      ) : (
        <>
          {/* Category tabs */}
          <div style={{ position: "sticky", top: 0, background: "#faf6ef", zIndex: 40, borderBottom: "1px solid #ece2d4", padding: "10px 0" }}>
            <div style={{ display: "flex", gap: 8, padding: "0 16px", overflowX: "auto", scrollbarWidth: "none" }}>
              {menu.categories.map(c => (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  style={{ padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                    background: activeCat === c.id ? BRAND : "#fffdf9",
                    color: activeCat === c.id ? "#fff" : "#2b211a",
                    border: activeCat === c.id ? "none" : "1px solid #ece2d4" }}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div style={{ padding: "14px 16px 20px", display: "grid", gap: 12 }}>
            {filteredItems.map(item => {
              const inCart = cart[`${restaurant.id}_${item.id}`];
              return (
                <div key={item.id} style={{ background: "#fffdf9", border: "1px solid #ece2d4", borderRadius: 16, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
                  {item.image_url ? (
                    <img src={item.image_url} alt="" style={{ width: 78, height: 78, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 78, height: 78, borderRadius: 12, background: "linear-gradient(135deg,#f6efe4,#ece2d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>🍽️</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: 12, color: "#8a7a6b", marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.description}</div>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: BRAND }}>{fmt(item.price)}</span>
                      {inCart ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, background: BRAND, borderRadius: 20, padding: "4px 6px" }}>
                          <button onClick={() => removeFromCart(restaurant.id, item.id)} style={{ color: "#fff", padding: 4, display: "flex" }}><Minus size={16} /></button>
                          <span style={{ color: "#fff", fontWeight: 700, minWidth: 16, textAlign: "center" }}>{inCart.qty}</span>
                          <button onClick={() => addToCart(restaurant, item)} style={{ color: "#fff", padding: 4, display: "flex" }}><Plus size={16} /></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(restaurant, item)} style={{ background: BRAND, color: "#fff", padding: "6px 14px", borderRadius: 20, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                          <Plus size={14} /> Qo'shish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {cartTotal > 0 && (
        <div style={{ position: "fixed", bottom: 80, left: 0, right: 0, padding: "0 16px", zIndex: 60 }}>
          <div style={{ maxWidth: 448, margin: "0 auto" }}>
            <button onClick={onCheckout}
              style={{ width: "100%", background: BRAND, color: "#fff", padding: "14px 18px", borderRadius: 16, fontWeight: 800, fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 8px 20px rgba(194,98,47,.35)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}><ShoppingBag size={18} /> Buyurtma berish</span>
              <span>{fmt(cartTotal)}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Login modal ---------- */
function LoginModal({ onClose, onSuccess }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function sendCode() {
    setError(""); setInfo(""); setLoading(true);
    try {
      const r = await apiCall("/api/auth/send-code", { method: "POST", body: { phone } });
      setInfo(r.channel === "telegram" ? "Kod Telegramga yuborildi ✓" : "Kod yuborildi ✓");
      setStep("code");
    } catch (e) {
      if (e.need_telegram) setError("Avval botda raqamingizni ulashing: " + e.bot_url);
      else setError(e.error || "Kod yuborilmadi");
    } finally { setLoading(false); }
  }

  async function verifyCode() {
    setError(""); setLoading(true);
    try {
      const r = await apiCall("/api/auth/verify-code", { method: "POST", body: { phone, code, name } });
      localStorage.setItem("dx_token", r.token);
      localStorage.setItem("dx_user", JSON.stringify(r.user));
      onSuccess(r.user, r.token);
    } catch (e) {
      setError(e.error || "Kod noto'g'ri");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,12,6,.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fffdf9", width: "100%", maxWidth: 480, borderRadius: "24px 24px 0 0", padding: "8px 22px 30px", animation: "slideUp .25s" }}>
        <div style={{ width: 40, height: 4, background: "#ece2d4", borderRadius: 2, margin: "8px auto 18px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 22 }}>{step === "phone" ? "Kirish" : "Tasdiqlash"}</h2>
          <button onClick={onClose} style={{ padding: 6 }}><X size={22} /></button>
        </div>

        {step === "phone" && (
          <>
            <div style={{ color: "#8a7a6b", fontSize: 14, marginBottom: 16 }}>Telefon raqamingizni kiriting — Telegram orqali tasdiqlash kodi keladi.</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: "#8a7a6b", fontWeight: 700, marginBottom: 6 }}>Telefon raqam</label>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #ece2d4", borderRadius: 12, background: "#faf6ef", padding: "0 12px" }}>
                <Phone size={18} color="#8a7a6b" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 90 123 45 67" autoFocus
                  style={{ flex: 1, padding: "13px 12px", background: "transparent", border: "none", fontSize: 15 }} />
              </div>
            </div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ismingiz (ixtiyoriy)"
              style={{ width: "100%", padding: "13px 14px", border: "1px solid #ece2d4", borderRadius: 12, background: "#faf6ef", fontSize: 15, marginBottom: 14 }} />
            <button onClick={sendCode} disabled={loading || phone.length < 7}
              style={{ width: "100%", background: BRAND, color: "#fff", padding: "14px", borderRadius: 14, fontWeight: 800, fontSize: 15, opacity: (loading || phone.length < 7) ? 0.5 : 1 }}>
              {loading ? "Yuborilmoqda…" : "Kod yuborish"}
            </button>
            <div style={{ fontSize: 12, color: "#8a7a6b", marginTop: 12, textAlign: "center" }}>
              Hali botda ro'yxatdan o'tmaganmisiz? <a href="https://t.me/dasturxon_app_bot" target="_blank" rel="noreferrer" style={{ color: BRAND, fontWeight: 700 }}>Botni oching</a>
            </div>
          </>
        )}

        {step === "code" && (
          <>
            <div style={{ color: "#8a7a6b", fontSize: 14, marginBottom: 16 }}>
              <b>{phone}</b> raqamingizga Telegramda kelgan 6 xonali kodni kiriting.
            </div>
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" autoFocus inputMode="numeric"
              style={{ width: "100%", padding: "16px 14px", border: "1px solid #ece2d4", borderRadius: 12, background: "#faf6ef", fontSize: 22, textAlign: "center", letterSpacing: 6, fontWeight: 700, marginBottom: 14 }} />
            <button onClick={verifyCode} disabled={loading || code.length !== 6}
              style={{ width: "100%", background: BRAND, color: "#fff", padding: "14px", borderRadius: 14, fontWeight: 800, fontSize: 15, opacity: (loading || code.length !== 6) ? 0.5 : 1 }}>
              {loading ? "Tekshirilmoqda…" : "Kirish"}
            </button>
            <button onClick={() => { setStep("phone"); setCode(""); setError(""); setInfo(""); }} style={{ width: "100%", color: "#8a7a6b", padding: 12, fontSize: 13, fontWeight: 600, marginTop: 8 }}>
              ← Raqamni o'zgartirish
            </button>
          </>
        )}

        {info && <div style={{ marginTop: 12, fontSize: 13, color: "#3b7d4f", textAlign: "center", fontWeight: 600 }}>{info}</div>}
        {error && <div style={{ marginTop: 12, fontSize: 13, color: "#c0392b", textAlign: "center", fontWeight: 600 }}>{error}</div>}
      </div>
    </div>
  );
}

/* ---------- Checkout ---------- */
function Checkout({ restaurant, cartItems, cartTotal, user, token, onBack, onSuccess, showToast }) {
  const [addresses, setAddresses] = useState([]);
  const [addrId, setAddrId] = useState(null);
  const [payment, setPayment] = useState("cash");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newAddr, setNewAddr] = useState("");

  useEffect(() => {
    apiCall("/api/auth/me", { token }).then(d => {
      const list = d.addresses || [];
      setAddresses(list);
      const active = list.find(a => a.is_active) || list[0];
      if (active) setAddrId(active.id);
      if (!list.length) setShowAdd(true);
    }).catch(() => {});
  }, [token]);

  const total = cartTotal + (restaurant.delivery_fee || 0);
  const tooLow = cartTotal < (restaurant.min_order || 0);

  async function addAddress() {
    if (!newAddr.trim()) return;
    try {
      const a = await apiCall("/api/auth/addresses", { method: "POST", token, body: { label: "Yangi", address: newAddr, lat: SHAHRISABZ.lat, lon: SHAHRISABZ.lon } });
      // refresh
      const me = await apiCall("/api/auth/me", { token });
      setAddresses(me.addresses || []);
      setAddrId(a?.id || (me.addresses?.[0]?.id));
      setShowAdd(false); setNewAddr("");
    } catch (e) {
      // Fallback: just keep it locally for the order
      const tmp = { id: -1, address: newAddr, lat: SHAHRISABZ.lat, lon: SHAHRISABZ.lon };
      setAddresses([tmp]); setAddrId(-1); setShowAdd(false);
    }
  }

  async function placeOrder() {
    if (tooLow) { showToast(`Minimal buyurtma: ${fmt(restaurant.min_order)}`); return; }
    const addr = addresses.find(a => a.id === addrId);
    if (!addr) { showToast("Manzilni tanlang"); return; }

    setLoading(true);
    try {
      const order = await apiCall("/api/orders", {
        method: "POST", token,
        body: {
          restaurant_id: restaurant.id,
          items: cartItems.map(c => ({ id: c.itemId, name: c.name, price: c.price, qty: c.qty })),
          subtotal: cartTotal,
          delivery_fee: restaurant.delivery_fee || 0,
          total,
          address: addr.address,
          lat: addr.lat,
          lon: addr.lon,
          payment_method: payment,
          courier_note: note || null
        }
      });
      onSuccess(order);
    } catch (e) {
      showToast(e.error || "Buyurtma yuborilmadi");
    } finally { setLoading(false); }
  }

  return (
    <>
      <Header title="Buyurtmani rasmiylashtirish" onBack={onBack} />
      <div style={{ padding: "16px 16px 200px" }}>
        {/* Restaurant */}
        <div style={{ background: "#fffdf9", border: "1px solid #ece2d4", borderRadius: 14, padding: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 32 }}>{restaurant.emoji}</div>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 600 }}>{restaurant.name}</div>
            <div style={{ fontSize: 12, color: "#8a7a6b" }}>{cartItems.length} ta taom</div>
          </div>
        </div>

        {/* Items */}
        <div style={{ background: "#fffdf9", border: "1px solid #ece2d4", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, marginBottom: 10 }}>Buyurtma</h3>
          {cartItems.map(c => (
            <div key={c.itemId} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
              <span>{c.qty}× {c.name}</span>
              <span style={{ fontWeight: 600 }}>{fmt(c.price * c.qty)}</span>
            </div>
          ))}
        </div>

        {/* Address */}
        <div style={{ background: "#fffdf9", border: "1px solid #ece2d4", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, marginBottom: 10 }}>Yetkazib berish manzili</h3>
          {addresses.map(a => (
            <button key={a.id} onClick={() => setAddrId(a.id)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10, border: `2px solid ${addrId === a.id ? BRAND : "#ece2d4"}`, background: addrId === a.id ? "#fbf0e6" : "#faf6ef", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <MapPin size={18} color={addrId === a.id ? BRAND : "#8a7a6b"} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{a.address}</span>
            </button>
          ))}
          {showAdd ? (
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input value={newAddr} onChange={e => setNewAddr(e.target.value)} placeholder="Shahrisabz, ko'cha..."
                style={{ flex: 1, padding: "11px 12px", border: "1px solid #ece2d4", borderRadius: 10, background: "#faf6ef" }} autoFocus />
              <button onClick={addAddress} style={{ background: BRAND, color: "#fff", padding: "0 16px", borderRadius: 10, fontWeight: 700 }}>OK</button>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1.5px dashed #c2622f", color: BRAND, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Plus size={16} /> Yangi manzil qo'shish
            </button>
          )}
        </div>

        {/* Payment */}
        <div style={{ background: "#fffdf9", border: "1px solid #ece2d4", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, marginBottom: 10 }}>To'lov turi</h3>
          {[
            { k: "cash", label: "Naqd (yetkazganda)", icon: Wallet },
            { k: "payme", label: "Payme", icon: CreditCard },
            { k: "click", label: "Click", icon: CreditCard }
          ].map(p => (
            <button key={p.k} onClick={() => setPayment(p.k)} style={{ width: "100%", textAlign: "left", padding: "12px 12px", borderRadius: 10, border: `2px solid ${payment === p.k ? BRAND : "#ece2d4"}`, background: payment === p.k ? "#fbf0e6" : "#faf6ef", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <p.icon size={18} color={payment === p.k ? BRAND : "#8a7a6b"} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{p.label}</span>
              {p.k !== "cash" && <span style={{ marginLeft: "auto", fontSize: 11, color: "#8a7a6b", fontWeight: 600 }}>Tez orada</span>}
            </button>
          ))}
        </div>

        {/* Note */}
        <div style={{ background: "#fffdf9", border: "1px solid #ece2d4", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, marginBottom: 10 }}>Kuryerga izoh (ixtiyoriy)</h3>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Domofon kodi, qavat..."
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #ece2d4", borderRadius: 10, background: "#faf6ef", minHeight: 60, resize: "vertical", fontSize: 14 }} />
        </div>

        {/* Total */}
        <div style={{ background: "#fffdf9", border: "1px solid #ece2d4", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
            <span style={{ color: "#8a7a6b" }}>Taomlar</span><span>{fmt(cartTotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 10 }}>
            <span style={{ color: "#8a7a6b" }}>Yetkazib berish</span><span>{fmt(restaurant.delivery_fee || 0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ece2d4", paddingTop: 10, fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 600 }}>
            <span>Jami</span><span style={{ color: BRAND }}>{fmt(total)}</span>
          </div>
          {tooLow && <div style={{ marginTop: 10, fontSize: 12, color: "#c0392b", fontWeight: 600 }}>⚠️ Minimal buyurtma: {fmt(restaurant.min_order)}</div>}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 80, left: 0, right: 0, padding: "0 16px", zIndex: 60 }}>
        <div style={{ maxWidth: 448, margin: "0 auto" }}>
          <button onClick={placeOrder} disabled={loading || tooLow}
            style={{ width: "100%", background: BRAND, color: "#fff", padding: "15px", borderRadius: 16, fontWeight: 800, fontSize: 15, boxShadow: "0 8px 20px rgba(194,98,47,.35)", opacity: (loading || tooLow) ? 0.5 : 1 }}>
            {loading ? "Yuborilmoqda…" : `Buyurtma berish — ${fmt(total)}`}
          </button>
        </div>
      </div>
    </>
  );
}

/* ---------- Orders ---------- */
function OrdersTab({ user, token, onLogin, onOpenResto, restaurants }) {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!token) { setOrders([]); return; }
    apiCall("/api/orders", { token }).then(setOrders).catch(() => setOrders([]));
  }, [token]);

  if (!token) {
    return (
      <>
        <Header title="Buyurtmalar" />
        <div style={{ padding: "60px 24px", textAlign: "center" }}>
          <Package size={56} color="#c2622f" strokeWidth={1.4} style={{ margin: "0 auto 14px" }} />
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Buyurtmalaringizni ko'rish uchun kiring</h2>
          <div style={{ color: "#8a7a6b", fontSize: 14, marginBottom: 20 }}>Tarix va holatlarni bu yerda kuzatib borasiz.</div>
          <button onClick={onLogin} style={{ background: BRAND, color: "#fff", padding: "12px 28px", borderRadius: 12, fontWeight: 800 }}>Kirish</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Buyurtmalarim" />
      <div style={{ padding: "16px" }}>
        {orders === null ? <div style={{ textAlign: "center", padding: 40, color: "#8a7a6b" }}>Yuklanmoqda…</div>
          : !orders.length ? (
            <div style={{ textAlign: "center", padding: 40, color: "#8a7a6b" }}>Hozircha buyurtmalar yo'q</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {orders.map(o => {
                const date = new Date(o.created_at).toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
                const restName = o.restaurants?.name || restaurants.find(r => r.id === o.restaurant_id)?.name || "Restoran";
                return (
                  <div key={o.id} style={{ background: "#fffdf9", border: "1px solid #ece2d4", borderRadius: 14, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 600 }}>{restName}</div>
                      <div style={{ fontSize: 12, color: "#8a7a6b" }}>{date}</div>
                    </div>
                    <div style={{ fontSize: 13, color: "#8a7a6b", marginBottom: 8 }}>
                      {(o.items || []).map(i => `${i.qty}× ${i.name}`).join(", ")}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ background: "#fbf0e6", color: BRAND, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{o.status}</span>
                      <span style={{ fontWeight: 700, color: BRAND }}>{fmt(o.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </>
  );
}

/* ---------- Profile ---------- */
function ProfileTab({ user, token, onLogin, onLogout }) {
  const [me, setMe] = useState(user);
  useEffect(() => {
    if (token) apiCall("/api/auth/me", { token }).then(setMe).catch(() => {});
  }, [token]);

  if (!token) {
    return (
      <>
        <Header title="Profil" />
        <div style={{ padding: "60px 24px", textAlign: "center" }}>
          <User size={56} color="#c2622f" strokeWidth={1.4} style={{ margin: "0 auto 14px" }} />
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Profilga kirish</h2>
          <div style={{ color: "#8a7a6b", fontSize: 14, marginBottom: 20 }}>Buyurtmalar, manzillar va bonuslarni boshqarish uchun kiring.</div>
          <button onClick={onLogin} style={{ background: BRAND, color: "#fff", padding: "12px 28px", borderRadius: 12, fontWeight: 800 }}>Kirish</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Profil" />
      <div style={{ padding: "16px" }}>
        <div style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`, color: "#fff", padding: 20, borderRadius: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 600 }}>
            {(me?.name || "?")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 600 }}>{me?.name}</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>+{me?.phone}</div>
            {me?.bonus_points > 0 && <div style={{ fontSize: 12, marginTop: 4 }}>⭐ {me.bonus_points} bonus</div>}
          </div>
        </div>

        {me?.addresses?.length > 0 && (
          <div style={{ background: "#fffdf9", border: "1px solid #ece2d4", borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Manzillarim</h3>
            {me.addresses.map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 13 }}>
                <MapPin size={16} color={BRAND} />
                <span>{a.address}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={onLogout} style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid #ece2d4", background: "#fffdf9", color: "#c0392b", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <LogOut size={18} /> Chiqish
        </button>
      </div>
    </>
  );
}

/* ---------- Order success ---------- */
function OrderSuccess({ order, onHome }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div>
        <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#e4f3e8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <Check size={50} color="#3b7d4f" strokeWidth={3} />
        </div>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>Buyurtma qabul qilindi!</h1>
        <div style={{ color: "#8a7a6b", marginBottom: 6 }}>Buyurtma № <b>#{order?.id || "—"}</b></div>
        <div style={{ color: "#8a7a6b", marginBottom: 24, fontSize: 14 }}>Restoran tez orada bog'lanadi.</div>
        <button onClick={onHome} style={{ background: BRAND, color: "#fff", padding: "13px 36px", borderRadius: 14, fontWeight: 800 }}>Bosh sahifaga</button>
      </div>
    </div>
  );
}

/* =========================================== */
/*                  ROOT APP                   */
/* =========================================== */
export default function App() {
  const [tab, setTab] = useState("home");
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState("");
  const [activeResto, setActiveResto] = useState(null);
  const [cart, setCart] = useState({}); // { "restoId_itemId": {restaurantId, itemId, name, price, qty} }
  const [view, setView] = useState("list"); // list | resto | checkout | success
  const [lastOrder, setLastOrder] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [toast, setToast] = useState("");

  const [token, setToken] = useState(() => localStorage.getItem("dx_token"));
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("dx_user")); } catch { return null; } });
  const [showLogin, setShowLogin] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  // Load restaurants
  useEffect(() => {
    apiCall("/api/restaurants").then(setRestaurants).catch(() => setRestaurants([]));
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setUserLoc({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => setUserLoc(SHAHRISABZ),
        { timeout: 4000 }
      );
    } else { setUserLoc(SHAHRISABZ); }
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2500); }

  function addToCart(restaurant, item) {
    const key = `${restaurant.id}_${item.id}`;
    setCart(c => ({ ...c, [key]: { restaurantId: restaurant.id, itemId: item.id, name: item.name, price: item.price, qty: (c[key]?.qty || 0) + 1 } }));
  }
  function removeFromCart(restoId, itemId) {
    const key = `${restoId}_${itemId}`;
    setCart(c => {
      const cur = c[key]; if (!cur) return c;
      if (cur.qty <= 1) { const { [key]: _, ...rest } = c; return rest; }
      return { ...c, [key]: { ...cur, qty: cur.qty - 1 } };
    });
  }

  function openResto(r) { setActiveResto(r); setView("resto"); }
  function backHome() { setView("list"); setActiveResto(null); }

  function tryCheckout() {
    if (!token) { setPendingCheckout(true); setShowLogin(true); return; }
    setView("checkout");
  }

  function onLoginSuccess(u, t) {
    setUser(u); setToken(t); setShowLogin(false);
    if (pendingCheckout) { setPendingCheckout(false); setView("checkout"); }
  }

  function logout() {
    localStorage.removeItem("dx_token"); localStorage.removeItem("dx_user");
    setToken(null); setUser(null);
  }

  function onOrderSuccess(o) {
    setLastOrder(o); setView("success"); setCart({});
  }

  const cartItemsForActive = activeResto ? Object.values(cart).filter(c => c.restaurantId === activeResto.id) : [];
  const cartTotalForActive = cartItemsForActive.reduce((s, c) => s + c.price * c.qty, 0);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {view === "list" && tab === "home" && (
          <RestaurantsList restaurants={restaurants} userLoc={userLoc} onOpen={openResto} search={search} setSearch={setSearch} />
        )}
        {view === "list" && tab === "search" && (
          <RestaurantsList restaurants={restaurants} userLoc={userLoc} onOpen={openResto} search={search} setSearch={setSearch} />
        )}
        {view === "list" && tab === "orders" && (
          <OrdersTab user={user} token={token} onLogin={() => setShowLogin(true)} restaurants={restaurants} />
        )}
        {view === "list" && tab === "profile" && (
          <ProfileTab user={user} token={token} onLogin={() => setShowLogin(true)} onLogout={logout} />
        )}

        {view === "resto" && activeResto && (
          <RestaurantDetail
            restaurant={activeResto}
            onBack={backHome}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            onCheckout={tryCheckout}
          />
        )}

        {view === "checkout" && activeResto && (
          <Checkout
            restaurant={activeResto}
            cartItems={cartItemsForActive}
            cartTotal={cartTotalForActive}
            user={user}
            token={token}
            onBack={() => setView("resto")}
            onSuccess={onOrderSuccess}
            showToast={showToast}
          />
        )}

        {view === "success" && (
          <OrderSuccess order={lastOrder} onHome={() => { setView("list"); setTab("orders"); }} />
        )}

        {view === "list" && <BottomNav tab={tab} setTab={setTab} />}
      </div>

      {showLogin && <LoginModal onClose={() => { setShowLogin(false); setPendingCheckout(false); }} onSuccess={onLoginSuccess} />}
      <Toast msg={toast} />
    </>
  );
}
