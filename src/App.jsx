import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Heart, Clock, Star, Home, ShoppingBag, ArrowLeft, Plus, Minus, User, ChevronRight, Filter, CreditCard, Phone, LogOut, CheckCircle, Edit3, X, Navigation, RefreshCw } from "lucide-react";

const P = "#F97316";

const API = "https://shahfood-backend-production.up.railway.app";

const api = {
  get: (path) => fetch(API + path).then(r => r.json()),
  post: (path, data, token) => fetch(API + path, {
    method: "POST",
    headers: {"Content-Type":"application/json", ...(token?{Authorization:"Bearer "+token}:{})},
    body: JSON.stringify(data)
  }).then(r => r.json()),
  patch: (path, data, token) => fetch(API + path, {
    method: "PATCH",
    headers: {"Content-Type":"application/json", ...(token?{Authorization:"Bearer "+token}:{})},
    body: JSON.stringify(data)
  }).then(r => r.json()),
};

const fmt = n => n.toLocaleString("uz-UZ") + " so'm";
const etaLeft = o => Math.max(5, (Number(o?.eta) || 30) - (Number(o?.stage) || 0) * 8);
const haversine = (lat1,lon1,lat2,lon2) => {
  const R=6371, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return +(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);
};

const SHAHRISABZ = {lat:39.0593, lon:66.8487};

const PROMCODES = {"DASTURXON10":{disc:10,label:"10% chegirma"},"YANGI50":{disc:50,label:"50% yetkazma"},"BIRINCHI":{disc:15,label:"15% chegirma"}};
const ORDER_STAGES = ["Qabul qilindi","Tayyorlanmoqda","Kuryer yo'lda","Yetkazildi"];
const STAGE_ICONS = ["✅","👨‍🍳","🛵","🎉"];
const REVIEW_TAGS = ["Tez yetkazdi","Issiq keldi","Chiroyli qadoq","Taom zo'r","Kuryer yaxshi","Narx mos"];
const CATS = [{id:"all",label:"Barchasi",e:"🍽️"},{id:"uzbek",label:"Milliy taomlar",e:"🍲"},{id:"fastfood",label:"Fast Food",e:"🍔"},{id:"pizza",label:"Pitsa",e:"🍕"},{id:"cafe",label:"Kafe",e:"☕"},{id:"sweet",label:"Shirinlik",e:"🍰"},{id:"soup",label:"Suyuq ovqatlar",e:"🥣"},{id:"bbq",label:"Gril & Kabob",e:"🍖"},{id:"drinks",label:"Ichimliklar",e:"🥤"}];

const FALLBACK_MENUS = {
  uzbek: {
    categories: ["Birinchi taom", "Ikkinchi taom", "Salatlar", "Ichimliklar"],
    items: [
      ["Manti (6 ta)", "Qo'lda tugilgan, qaymoq bilan", 22000, "Birinchi taom"],
      ["Chuchvara", "Mayda xamir, qaymoqli sous", 18000, "Birinchi taom"],
      ["Osh", "Milliy guruchli osh", 25000, "Ikkinchi taom"],
      ["Qozon kabob", "Kartoshka va go'sht bilan", 32000, "Ikkinchi taom"],
      ["Achichuk", "Pomidor va piyoz salati", 10000, "Salatlar"],
      ["Ko'k choy", "Issiq choy", 4000, "Ichimliklar"],
    ],
  },
  fastfood: {
    categories: ["Burgerlar", "Snacklar", "Ichimliklar"],
    items: [
      ["Classic Burger", "Mol go'shti, salat, maxsus sous", 26000, "Burgerlar"],
      ["Chicken Burger", "Qovurilgan tovuq filesi", 24000, "Burgerlar"],
      ["Kartoshka fri", "Sous bilan", 12000, "Snacklar"],
      ["Nuggets (6 ta)", "Tovuq nuggets", 16000, "Snacklar"],
      ["Cola 0.5L", "Sovuq ichimlik", 8000, "Ichimliklar"],
    ],
  },
  pizza: {
    categories: ["Pitstalar", "Qo'shimcha", "Ichimliklar"],
    items: [
      ["Margarita 30sm", "Mozzarella va pomidor sousi", 38000, "Pitstalar"],
      ["Pepperoni 30sm", "Kolbasa va pishloq", 45000, "Pitstalar"],
      ["Chicken BBQ 35sm", "Tovuq va BBQ sous", 54000, "Pitstalar"],
      ["Kartoshka fri", "Sous bilan", 12000, "Qo'shimcha"],
      ["Limonad", "Uy limonadi", 10000, "Ichimliklar"],
    ],
  },
  cafe: {
    categories: ["Kofe", "Pishiriqlar", "Shirinliklar", "Ichimliklar"],
    items: [
      ["Americano", "Klassik qora kofe", 9000, "Kofe"],
      ["Cappuccino", "Sutli yumshoq kofe", 14000, "Kofe"],
      ["Croissant", "Yangi pishirilgan", 12000, "Pishiriqlar"],
      ["Cheesecake", "Qulupnay sousi bilan", 22000, "Shirinliklar"],
      ["Fresh juice", "Tabiiy sharbat", 15000, "Ichimliklar"],
    ],
  },
  sweet: {
    categories: ["Muzqaymoq", "Shirinliklar", "Ichimliklar"],
    items: [
      ["Sundae", "3 shar muzqaymoq", 16000, "Muzqaymoq"],
      ["Milkshake", "Qalin sutli kokteyl", 18000, "Ichimliklar"],
      ["Waffle", "Meva va qaymoq bilan", 20000, "Shirinliklar"],
      ["Tort bo'lagi", "Kunlik assortiment", 18000, "Shirinliklar"],
    ],
  },
  bbq: {
    categories: ["Kaboblar", "Setlar", "Salatlar", "Ichimliklar"],
    items: [
      ["Qo'zi shashlik", "4 shampur", 36000, "Kaboblar"],
      ["Tovuq shashlik", "4 shampur", 30000, "Kaboblar"],
      ["Aralash set", "2 kishilik kabob set", 78000, "Setlar"],
      ["Achichuk", "Pomidor va piyoz", 10000, "Salatlar"],
      ["Ayron", "Sovuq ichimlik", 7000, "Ichimliklar"],
    ],
  },
};

const getFallbackMenu = (restaurant) => {
  const cats = Array.isArray(restaurant?.cats) ? restaurant.cats : [];
  const kind = cats.find(c => FALLBACK_MENUS[c]) || "uzbek";
  const template = FALLBACK_MENUS[kind];
  const categories = template.categories.map((name, index) => ({
    id: restaurant.id * 100 + index + 1,
    restaurant_id: restaurant.id,
    name,
    sort_order: index + 1,
    is_fallback: true,
  }));
  const categoryByName = Object.fromEntries(categories.map(c => [c.name, c.id]));
  const items = template.items.map(([name, description, price, categoryName], index) => ({
    id: restaurant.id * 1000 + index + 1,
    restaurant_id: restaurant.id,
    category_id: categoryByName[categoryName],
    name,
    description,
    price,
    image_url: null,
    is_available: true,
    is_fallback: true,
  }));
  return { categories, items };
};

export default function App() {
  const [view, setView] = useState("main");
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" && window.innerWidth >= 768);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); };
  }, []);
  const [tab, setTab] = useState("home");
  const [resto, setResto] = useState(null);
  const [homeCat, setHomeCat] = useState("all");
  const [homeQ, setHomeQ] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [favs, setFavs] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("dx_favs") || "[]")); } catch { return new Set(); }
  });
  const [cart, setCart] = useState({});
  const [menuCat, setMenuCat] = useState("");
  const [orders, setOrders] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [userLoc, setUserLoc] = useState(SHAHRISABZ);
  const [locLoading, setLocLoading] = useState(false);
  const [addresses, setAddresses] = useState([{id:1,label:"Uyim",addr:"Amir Temur ko'chasi, 45",lat:39.0593,lon:66.8487,active:true},{id:2,label:"Ishim",addr:"Markaziy maydon, 1",lat:39.0610,lon:66.8500,active:false}]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("click");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoErr, setPromoErr] = useState("");
  const [noCall, setNoCall] = useState(false);
  const [courierNote, setCourierNote] = useState("");
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(null);
  const [starRest, setStarRest] = useState(0);
  const [starCourier, setStarCourier] = useState(0);
  const [reviewTags, setReviewTags] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState("overview");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/restaurants").then(data => {
      if(Array.isArray(data)) {
        setRestaurants(data.map(r => ({
          ...r,
          cats: r.category || [],
          fee: r.delivery_fee,
          min: r.min_order,
          bg: r.bg_gradient,
          e: r.emoji,
          open: r.is_open,
          reviews: r.review_count,
        })));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const [sortBy, setSortBy] = useState("distance");

  // ── Real auth (telefon → kod → token) ──
  const [token, setToken] = useState(() => localStorage.getItem("dx_token"));
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("dx_user")); } catch { return null; } });
  const userName = user?.name || "";
  const userPhone = user?.phone ? "+" + user.phone : "";
  const userBonus = user?.bonus_points || 0;

  const [loginStep, setLoginStep] = useState("phone"); // phone | code
  const [loginPhone, setLoginPhone] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErr, setLoginErr] = useState("");

  // ── Menyu (bazadan yuklanadi) ──
  const [menuData, setMenuData] = useState({ categories: [], items: [] });
  const [menuLoading, setMenuLoading] = useState(false);

  const normPhone = p => { const d = String(p || "").replace(/\D/g, ""); return d.startsWith("998") ? d : (d.length === 9 ? "998" + d : d); };

  const [editProfile, setEditProfile] = useState(false);
  const toastIdRef = useRef(0);

  // Foydalanuvchini va manzillarini yuklash
  useEffect(() => {
    if (!token) return;
    fetch(API + "/api/auth/me", { headers: { Authorization: "Bearer " + token } })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(me => {
        setUser(me);
        localStorage.setItem("dx_user", JSON.stringify(me));
        if (me.addresses?.length) {
          setAddresses(me.addresses.map(a => ({ id: a.id, label: a.label || "Manzil", addr: a.address, lat: a.lat, lon: a.lon, active: a.is_active })));
        }
      })
      .catch(() => { localStorage.removeItem("dx_token"); localStorage.removeItem("dx_user"); setToken(null); setUser(null); });
  }, [token]);

  // Buyurtmalar tarixini yuklash
  useEffect(() => {
    if (!token) { Promise.resolve().then(() => setOrders([])); return; }
    fetch(API + "/api/orders", { headers: { Authorization: "Bearer " + token } })
      .then(r => r.json())
      .then(data => Array.isArray(data) && setOrders(data.map(o => ({
        id: o.id,
        resto: o.restaurants?.name || "—",
        items: (o.items || []).map(i => `${i.qty}× ${i.name}`).join(", "),
        total: o.total,
        stage: Number(o.stage) || 0,
        eta: Number(o.estimated_minutes || o.eta) || 30,
        status: o.status,
        date: new Date(o.created_at).toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
      })))).catch(() => {});
  }, [token]);

  // Buyurtma kuzatuv ekranida — real holatni har 10 soniyada tekshirish
  useEffect(() => {
    if (view !== "tracking" || !trackingOrder || !token) return;
    const tick = () => {
      fetch(API + "/api/orders/" + trackingOrder, { headers: { Authorization: "Bearer " + token } })
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (!fresh) return;
          setOrders(prev => prev.map(o => o.id === trackingOrder
            ? { ...o, stage: fresh.stage ?? o.stage, status: fresh.status || o.status }
            : o));
        }).catch(() => {});
    };
    const iv = setInterval(tick, 10000);
    tick();
    return () => clearInterval(iv);
  }, [view, trackingOrder, token]);

  const activeAddr = addresses.find(a=>a.active) || addresses[0];

  // ── Brauzer "orqaga" tugmasi ilova ichida ishlashi uchun ──
  // Har bir ichki ekran (rest, checkout, tracking, auth) tarixga yoziladi.
  // Orqaga bosilganda saytdan chiqmasdan, oldingi ekranga qaytadi.
  const isInnerView = view !== "main" || checkoutOpen;
  useEffect(() => {
    if (isInnerView) {
      // Ichki ekranga kirdik — tarixga bitta yozuv qo'shamiz
      window.history.pushState({ dxInner: true }, "");
    }
  }, [isInnerView]);

  useEffect(() => {
    const onPop = () => {
      // Orqaga bosildi — agar ichki ekranda bo'lsak, bosh sahifaga qaytamiz
      if (checkoutOpen) { setCheckoutOpen(false); }
      else if (view !== "main") { setView("main"); }
      // Aks holda (bosh sahifada) — brauzer normal ishlaydi (saytdan chiqadi)
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [view, checkoutOpen]);

  const restWithDist = restaurants.map(r=>({...r, dist:haversine(userLoc.lat,userLoc.lon,r.lat,r.lon)}));
  const sorted = [...restWithDist].sort((a,b)=> sortBy==="distance" ? a.dist-b.dist : sortBy==="rating" ? b.rating-a.rating : a.fee-b.fee);
  const filteredHome = sorted.filter(r=>{
    const mc = homeCat==="all" || r.cats.includes(homeCat);
    const ms = r.name.toLowerCase().includes(homeQ.toLowerCase());
    return mc && ms;
  });
  const filteredSearch = searchQ.length>0 ? sorted.filter(r=>r.name.toLowerCase().includes(searchQ.toLowerCase()) || r.cats.some(c=>CATS.find(ct=>ct.id===c)?.label.toLowerCase().includes(searchQ.toLowerCase()))) : sorted;

  const cartCount = Object.values(cart).reduce((s,v)=>s+v,0);
  const cartSubtotal = Object.entries(cart).reduce((s,[id,qty])=>{const item=menuData.items.find(m=>m.id===+id);return s+(item?.price||0)*qty;},0);
  const promoDisc = promoApplied ? Math.round(cartSubtotal*(PROMCODES[promoApplied].disc/100)) : 0;
  const cartTotal = cartSubtotal - promoDisc + (resto?.fee||0);

  const addToast = (msg, type="ok") => {
    const id = ++toastIdRef.current;
    setToasts(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),2500);
  };

  const getLocation = () => {
    setLocLoading(true);
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(pos=>{
        setUserLoc({lat:pos.coords.latitude,lon:pos.coords.longitude});
        setLocLoading(false);
        addToast("Manzilingiz aniqlandi ✓");
      },()=>{setLocLoading(false);addToast("GPS ruxsat berilmadi","err");});
    } else {
      setLocLoading(false);addToast("GPS mavjud emas","err");
    }
  };

  const openResto = async (r) => {
    setResto(r); setView("rest"); setCart({});
    setPromoApplied(null); setPromoErr("");
    setMenuData({ categories: [], items: [] });
    setMenuCat("");
    setMenuLoading(true);
    try {
      const m = await api.get(`/api/restaurants/${r.id}/menu`);
      const loadedMenu = {
        categories: m.categories || [],
        items: m.items || [],
      };
      const menu = loadedMenu.items.length ? loadedMenu : getFallbackMenu(r);
      const cats = menu.categories.map(c => c.name);
      setMenuData(menu);
      if (cats.length) setMenuCat(cats[0]);
    } catch {
      const menu = getFallbackMenu(r);
      const cats = menu.categories.map(c => c.name);
      setMenuData(menu);
      if (cats.length) setMenuCat(cats[0]);
      addToast("Namunaviy menyu yuklandi");
    }
    setMenuLoading(false);
  };
  const goBack = () => { if(checkoutOpen){setCheckoutOpen(false);return;} setView("main"); };
  const changeTab = t => { setTab(t); setView("main"); };
  const toggleFav = (id,e) => {e&&e.stopPropagation();setFavs(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);localStorage.setItem("dx_favs",JSON.stringify([...n]));return n;});};
  const addItem = id => {setCart(p=>({...p,[id]:(p[id]||0)+1}));const it=menuData.items.find(m=>m.id===id);addToast((it?.name||"Taom")+" qo'shildi ✓");};
  const removeItem = id => setCart(p=>{const n={...p};n[id]>1?n[id]--:delete n[id];return n;});

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    api.post("/api/promo/validate", {code}).then(data => {
      if(data.valid){setPromoApplied(code);setPromoErr("");addToast(data.description+" 🎉");}
      else{setPromoErr(data.error||"Noto'g'ri kod");setPromoApplied(null);}
    }).catch(()=>{setPromoErr("Xatolik");});
  };

  const estDelivery = r => {
    const d = r ? haversine(userLoc.lat,userLoc.lon,r.lat,r.lon) : 1;
    return Math.round(10 + d*8);
  };

  const placeOrder = (authToken = token) => {
    if(!authToken){addToast("Avval tizimga kiring","err");setView("auth");return;}
    if(cartSubtotal < (resto?.min||0)){addToast("Minimal buyurtma: "+fmt(resto.min),"err");return;}
    const items = Object.entries(cart).map(([id,qty])=>{
      const it = menuData.items.find(m=>m.id===+id);
      return {id:+id, name:it?.name, price:it?.price, qty};
    });
    const orderPayload = {
      restaurant_id: resto.id,
      items,
      subtotal:cartSubtotal, discount:promoDisc,
      delivery_fee:resto.fee||resto.delivery_fee,
      total:cartTotal,
      address:activeAddr.addr,
      lat:activeAddr.lat, lon:activeAddr.lon,
      payment_method:payMethod,
      promo_code:promoApplied||undefined,
      no_call:noCall, courier_note:courierNote,
      estimated_minutes:estDelivery(resto)
    };
    api.post("/api/orders", orderPayload, authToken).then(apiOrd => {
      if (apiOrd?.error) { addToast(apiOrd.error, "err"); return; }
      const ord = {
        id: apiOrd.id, resto:resto.name, restoId:resto.id, restoE:resto.e, restoBg:resto.bg,
        items, subtotal:cartSubtotal, discount:promoDisc, fee:resto.fee, total:cartTotal,
        date:new Date(), status:"Qabul qilindi", stage:0, eta:estDelivery(resto),
        addr:activeAddr.addr, pay:payMethod, noCall, courierNote,
        reviewed:false, stageTime:Date.now()
      };
      setOrders(prev=>[ord,...prev]);
      setCart({}); setPromoApplied(null); setPromoCode(""); setCheckoutOpen(false);
      addToast("Buyurtma qabul qilindi! 🎉");
      setTrackingOrder(ord.id);
      setView("tracking");
    }).catch(()=>{
      addToast("Buyurtma yuborilmadi", "err");
    });
  };

  const submitReview = () => {
    if(!reviewOpen) return;
    setOrders(prev=>prev.map(o=>o.id===reviewOpen.id?{...o,reviewed:true,rating:starRest,courierRating:starCourier,reviewTags,reviewText}:o));
    setRestaurants(prev=>prev.map(r=>{
      if(r.id===reviewOpen.restoId){
        const newR = +((r.rating*r.reviews+starRest)/(r.reviews+1)).toFixed(1);
        return {...r,rating:newR,reviews:r.reviews+1};
      }
      return r;
    }));
    addToast("Sharhingiz qabul qilindi! Rahmat ⭐");
    setReviewOpen(null); setStarRest(0); setStarCourier(0); setReviewTags([]); setReviewText("");
  };

  const menuItems = menuCat ? menuData.items.filter(m => menuData.categories.find(c => c.id === m.category_id)?.name === menuCat) : menuData.items;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0;}
    html,body,#root{font-family:'Nunito','Segoe UI',sans-serif;background:#f0e6d8;margin:0;padding:0;width:100%;overflow-x:hidden;}
    body{display:flex;justify-content:center;}
    #root{width:100%;max-width:480px;}
    ::-webkit-scrollbar{display:none;}
    img,svg{max-width:100%;}
    .hs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
    .hs::-webkit-scrollbar{display:none;}
    .cd{transition:transform .15s;cursor:pointer;}
    .cd:active{transform:scale(.97);}
    .ob{background:${P};color:white;border:none;border-radius:14px;cursor:pointer;font-family:inherit;font-weight:800;transition:opacity .15s;}
    .ob:active{opacity:.8;}
    .ob:disabled{opacity:.5;cursor:not-allowed;}
    .hb{background:white;border:none;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);}
    .row{display:flex;align-items:center;}
    .pr{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #f5e6d8;cursor:pointer;}
    .pr:active{opacity:.7;}
    input[type=text],input[type=tel],input[type=number],textarea{border:1.5px solid #e5d5c5;border-radius:12px;padding:10px 14px;font-family:inherit;font-size:16px;outline:none;width:100%;background:white;}
    input:focus,textarea:focus{border-color:${P};}
    textarea{resize:none;}
    .fixed-bar{position:fixed;bottom:0;left:0;right:0;margin:0 auto;width:100%;max-width:480px;z-index:100;}
  `;

  const W = {background:"#FFF7ED",minHeight:"100vh",width:"100%",maxWidth:isDesktop?"100%":480,margin:"0 auto",position:"relative",overflowX:"hidden"};
  // Ichki sahifalar (resto, checkout, tracking, auth) desktopda markazda 600px
  const WP = {background:"#FFF7ED",minHeight:"100vh",width:"100%",maxWidth:isDesktop?600:480,margin:"0 auto",position:"relative",overflowX:"hidden"};
  const SH = {background:"white",padding:"14px 16px",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 12px rgba(0,0,0,.06)"};
  const BN = {position:"fixed",bottom:0,left:0,right:0,margin:"0 auto",width:"100%",maxWidth:isDesktop?760:480,background:"white",borderTop:"1px solid #f0f0f0",padding:"10px 0 16px",display:"flex",zIndex:100,boxShadow:"0 -4px 20px rgba(0,0,0,.08)",borderRadius:isDesktop?"20px 20px 0 0":0};

  const RestoCard = ({r}) => (
    <div className="cd" onClick={()=>openResto(r)} style={{background:"white",borderRadius:20,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,.08)"}}>
      <div style={{background:r.bg,height:isDesktop?170:110,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:isDesktop?64:42}}>{r.e}</span>
        {!r.open&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"white",fontWeight:800,fontSize:12,background:"rgba(0,0,0,.4)",padding:"4px 12px",borderRadius:20}}>Yopiq</span></div>}
        <div style={{position:"absolute",top:8,left:8,background:"rgba(255,255,255,.22)",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,color:"white"}}>{r.badge}</div>
        <button className="hb" style={{position:"absolute",top:8,right:8}} onClick={e=>toggleFav(r.id,e)}>
          <Heart size={14} fill={favs.has(r.id)?"#ef4444":"none"} color={favs.has(r.id)?"#ef4444":"#aaa"} strokeWidth={2}/>
        </button>
      </div>
      <div style={{padding:isDesktop?"14px 14px 16px":"10px 10px 12px"}}>
        <div style={{fontWeight:800,fontSize:isDesktop?16:13,color:"#1a1a1a",marginBottom:4,lineHeight:1.2}}>{r.name}</div>
        <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:5}}>
          <Star size={isDesktop?13:11} fill="#fbbf24" color="#fbbf24"/>
          <span style={{fontSize:isDesktop?13:12,fontWeight:700,color:"#1a1a1a"}}>{r.rating}</span>
          <span style={{fontSize:isDesktop?12:11,color:"#bbb"}}>({r.reviews})</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <Clock size={isDesktop?12:11} color="#aaa"/>
          <span style={{fontSize:isDesktop?12:11,color:"#888",fontWeight:600}}>{estDelivery(r)} min</span>
          <span style={{width:3,height:3,background:"#eee",borderRadius:"50%"}}/>
          <MapPin size={isDesktop?11:10} color="#aaa"/>
          <span style={{fontSize:isDesktop?12:11,color:"#888",fontWeight:600}}>{r.dist} km</span>
        </div>
      </div>
    </div>
  );

  const bottomNav = (
    <div style={BN}>
      {[{id:"home",icon:Home,label:"Bosh sahifa"},{id:"search",icon:Search,label:"Qidiruv"},{id:"orders",icon:ShoppingBag,label:"Buyurtmalar"},{id:"profile",icon:User,label:"Profil"}].map(({id,icon:Icon,label})=>(
        <button key={id} onClick={()=>changeTab(id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",position:"relative"}}>
          <Icon size={22} color={tab===id?P:"#ccc"} strokeWidth={tab===id?2.5:1.8}/>
          {id==="orders"&&orders.filter(o=>o.stage<3).length>0&&<span style={{position:"absolute",top:0,right:"calc(50% - 18px)",background:"#ef4444",color:"white",fontSize:9,fontWeight:800,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{orders.filter(o=>o.stage<3).length}</span>}
          <span style={{fontSize:10,fontWeight:700,color:tab===id?P:"#ccc"}}>{label}</span>
          {tab===id&&<span style={{width:4,height:4,background:P,borderRadius:"50%"}}/>}
        </button>
      ))}
    </div>
  );

  const sendCode = () => {
    const phone = normPhone(loginPhone);
    if(phone.length < 12){ setLoginErr("Raqam noto'g'ri"); return; }
    setLoginLoading(true); setLoginErr("");
    api.post("/api/auth/send-code", { phone }).then(r => {
      if(r.error){
        if(r.need_telegram) setLoginErr("Avval Telegram botda raqamingizni ulashing");
        else setLoginErr(r.error);
        return;
      }
      setLoginStep("code");
      addToast(r.channel==="telegram" ? "Kod Telegramga yuborildi ✓" : "Kod yuborildi ✓");
    }).catch(()=>setLoginErr("Tarmoq xatosi")).finally(()=>setLoginLoading(false));
  };

  const verifyCode = () => {
    const phone = normPhone(loginPhone);
    setLoginLoading(true); setLoginErr("");
    api.post("/api/auth/verify-code", { phone, code: loginCode, name: loginName||undefined }).then(r => {
      if(r.error || !r.token){ setLoginErr(r.error||"Kod noto'g'ri"); return; }
      localStorage.setItem("dx_token", r.token);
      localStorage.setItem("dx_user", JSON.stringify(r.user));
      setToken(r.token); setUser(r.user);
      setLoginStep("phone"); setLoginCode(""); setLoginPhone(""); setLoginName(""); setLoginErr("");
      addToast(`Xush kelibsiz, ${r.user?.name||""}! 👋`);
      if (checkoutOpen && resto && cartCount > 0) {
        placeOrder(r.token);
      } else {
        setView("main");
      }
    }).catch(()=>setLoginErr("Tarmoq xatosi")).finally(()=>setLoginLoading(false));
  };

  if(view==="auth") return (
    <div style={{...WP,padding:"40px 24px"}}>
      <style>{CSS}</style>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:48,marginBottom:12}}>🍽️</div>
        <div style={{fontWeight:900,fontSize:24,color:"#1a1a1a"}}>Dasturxon</div>
        <div style={{fontSize:13,color:"#aaa",marginTop:6}}>{loginStep==="phone" ? "Raqamingizni kiriting" : "Tasdiqlash kodi"}</div>
      </div>

      {loginStep==="phone" ? (<>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,fontWeight:700,color:"#555",display:"block",marginBottom:6}}>Telefon raqam</label>
          <input type="tel" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} placeholder="+998 90 000 00 00" autoFocus/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,fontWeight:700,color:"#555",display:"block",marginBottom:6}}>Ismingiz <span style={{color:"#aaa",fontWeight:500}}>(yangi bo'lsangiz)</span></label>
          <input type="text" value={loginName} onChange={e=>setLoginName(e.target.value)} placeholder="Abu Bakr"/>
        </div>
        <button className="ob" onClick={sendCode} disabled={loginLoading} style={{width:"100%",padding:"15px",fontSize:15,borderRadius:16,marginTop:8,opacity:loginLoading?0.6:1}}>
          {loginLoading ? "Yuborilmoqda…" : "Kod yuborish →"}
        </button>
        <div style={{fontSize:12,color:"#aaa",textAlign:"center",marginTop:14,lineHeight:1.5}}>
          Kod Telegram orqali keladi.<br/>
          Hali botda ro'yxatdan o'tmaganmisiz? <a href="https://t.me/dasturxon_app_bot" target="_blank" rel="noreferrer" style={{color:P,fontWeight:800,textDecoration:"none"}}>@dasturxon_app_bot</a>
        </div>
      </>) : (<>
        <div style={{marginBottom:14,fontSize:13,color:"#555",textAlign:"center"}}>
          <b>+{normPhone(loginPhone)}</b> raqamiga Telegramda 6 xonali kod yuborildi
        </div>
        <input type="text" inputMode="numeric" value={loginCode} onChange={e=>setLoginCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="123456" autoFocus
          style={{width:"100%",padding:"18px 14px",fontSize:24,textAlign:"center",letterSpacing:6,fontWeight:800,borderRadius:16,border:"1px solid #eadcc8",background:"#fffaf3",marginBottom:14}}/>
        <button className="ob" onClick={verifyCode} disabled={loginLoading||loginCode.length!==6} style={{width:"100%",padding:"15px",fontSize:15,borderRadius:16,opacity:(loginLoading||loginCode.length!==6)?0.6:1}}>
          {loginLoading ? "Tekshirilmoqda…" : "Kirish →"}
        </button>
        <button onClick={()=>{setLoginStep("phone");setLoginCode("");setLoginErr("");}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:16,border:"none",background:"transparent",fontSize:13,color:"#888",cursor:"pointer",fontFamily:"inherit"}}>
          ← Raqamni o'zgartirish
        </button>
      </>)}

      {loginErr && <div style={{marginTop:14,fontSize:13,color:"#ef4444",textAlign:"center",fontWeight:700}}>{loginErr}</div>}

      <button onClick={()=>setView("main")} style={{width:"100%",marginTop:14,padding:"12px",borderRadius:16,border:"none",background:"transparent",fontSize:14,color:"#aaa",cursor:"pointer",fontFamily:"inherit"}}>
        Keyinroq
      </button>
    </div>
  );

  if(view==="tracking") {
    const ord = orders.find(o=>o.id===trackingOrder);
    if(!ord) return null;
    const pct = Math.round(((ord.stage+1)/ORDER_STAGES.length)*100);
    return (
      <div style={WP}>
        <style>{CSS}</style>
        <div style={SH}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setView("main")} style={{background:"#FFF0E5",border:"none",borderRadius:12,width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><ArrowLeft size={20} color="#1a1a1a"/></button>
            <span style={{fontWeight:900,fontSize:18,color:"#1a1a1a"}}>Buyurtma kuzatuv</span>
          </div>
        </div>
        <div style={{padding:"20px 16px 100px"}}>
          <div style={{background:ord.restoBg,borderRadius:20,padding:"20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:8}}>{STAGE_ICONS[ord.stage]}</div>
            <div style={{color:"white",fontWeight:900,fontSize:18,marginBottom:4}}>{ORDER_STAGES[ord.stage]}</div>
            {ord.stage<3&&<div style={{color:"rgba(255,255,255,.8)",fontSize:13}}>~{etaLeft(ord)} daqiqa qoldi</div>}
          </div>
          <div style={{background:"white",borderRadius:20,padding:"20px",marginBottom:16,boxShadow:"0 4px 16px rgba(0,0,0,.07)"}}>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:13,color:"#888"}}>Holat</span>
                <span style={{fontSize:13,fontWeight:800,color:P}}>{pct}%</span>
              </div>
              <div style={{background:"#f5e6d8",borderRadius:20,height:8,overflow:"hidden"}}>
                <div style={{background:P,width:pct+"%",height:"100%",borderRadius:20,transition:"width 1s ease"}}/>
              </div>
            </div>
            {ORDER_STAGES.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:i<ORDER_STAGES.length-1?12:0}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:i<=ord.stage?"#FFF0E5":"#f5f5f5",border:`2px solid ${i<=ord.stage?P:"#e5e5e5"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>
                  {i<=ord.stage?STAGE_ICONS[i]:"○"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:i<=ord.stage?800:600,fontSize:14,color:i<=ord.stage?"#1a1a1a":"#aaa"}}>{s}</div>
                  {i===ord.stage&&<div style={{fontSize:11,color:"#aaa",marginTop:2}}>Hozir...</div>}
                </div>
                {i<ord.stage&&<CheckCircle size={18} color="#22c55e"/>}
              </div>
            ))}
          </div>
          <div style={{background:"white",borderRadius:20,padding:"16px",marginBottom:16,boxShadow:"0 4px 16px rgba(0,0,0,.07)"}}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:12,color:"#1a1a1a"}}>📋 Buyurtma tafsiloti</div>
            {ord.items.map((it,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:13,color:"#555"}}>{it.name} × {it.qty}</span>
                <span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{fmt(it.price*it.qty)}</span>
              </div>
            ))}
            <div style={{borderTop:"1px solid #f5e6d8",marginTop:10,paddingTop:10}}>
              {ord.discount>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:"#22c55e"}}>Chegirma</span><span style={{fontSize:13,color:"#22c55e"}}>-{fmt(ord.discount)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:"#888"}}>Yetkazma</span><span style={{fontSize:13,color:"#888"}}>{fmt(ord.fee)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:800,fontSize:14}}>Jami</span><span style={{fontWeight:900,fontSize:16,color:P}}>{fmt(ord.total)}</span></div>
            </div>
          </div>
          {ord.stage===3&&!ord.reviewed&&(
            <button className="ob" onClick={()=>{setReviewOpen(ord);setStarRest(0);setStarCourier(0);setReviewTags([]);setReviewText("");}} style={{width:"100%",padding:"15px",fontSize:15,borderRadius:16}}>
              ⭐ Buyurtmani baholang
            </button>
          )}
          {ord.stage===3&&ord.reviewed&&(
            <div style={{textAlign:"center",padding:"16px",background:"#dcfce7",borderRadius:16,color:"#16a34a",fontWeight:700}}>
              ✓ Sharhingiz qabul qilindi. Rahmat!
            </div>
          )}
        </div>
      </div>
    );
  }

  if(view==="rest" && resto) {
    const r = restWithDist.find(x=>x.id===resto.id)||resto;
    return (
      <div style={WP}>
        <style>{CSS}</style>
        {checkoutOpen ? (
          <div style={{padding:"0 0 100px"}}>
            <div style={SH}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button onClick={()=>setCheckoutOpen(false)} style={{background:"#FFF0E5",border:"none",borderRadius:12,width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><ArrowLeft size={20} color="#1a1a1a"/></button>
                <span style={{fontWeight:900,fontSize:18,color:"#1a1a1a"}}>Buyurtmani rasmiylashtirish</span>
              </div>
            </div>
            <div style={{padding:"16px"}}>
              <div style={{background:"white",borderRadius:20,padding:"16px",marginBottom:14,boxShadow:"0 4px 16px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:12,color:"#1a1a1a"}}>📍 Yetkazish manzili</div>
                {addresses.map(a=>(
                  <div key={a.id} onClick={()=>setAddresses(prev=>prev.map(x=>({...x,active:x.id===a.id})))} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f5e6d8",cursor:"pointer"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:a.active?"#FFF0E5":"#f5f5f5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <MapPin size={16} color={a.active?P:"#aaa"}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#1a1a1a"}}>{a.label}</div>
                      <div style={{fontSize:12,color:"#aaa"}}>{a.addr}</div>
                    </div>
                    {a.active&&<CheckCircle size={18} color={P}/>}
                  </div>
                ))}
                <button onClick={getLocation} style={{display:"flex",alignItems:"center",gap:8,marginTop:10,background:"none",border:"none",cursor:"pointer",color:P,fontFamily:"inherit",fontWeight:700,fontSize:13}}>
                  <Navigation size={14}/> {locLoading?"Aniqlanmoqda...":"GPS bilan manzil aniqlash"}
                </button>
              </div>
              <div style={{background:"white",borderRadius:20,padding:"16px",marginBottom:14,boxShadow:"0 4px 16px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:12,color:"#1a1a1a"}}>💳 To'lov usuli</div>
                {[{id:"click",label:"Click",e:"💳"},{id:"payme",label:"Payme",e:"📱"},{id:"cash",label:"Naqd pul",e:"💵"}].map(m=>(
                  <div key={m.id} onClick={()=>setPayMethod(m.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f5e6d8",cursor:"pointer"}}>
                    <span style={{fontSize:20}}>{m.e}</span>
                    <span style={{flex:1,fontWeight:700,fontSize:13,color:"#1a1a1a"}}>{m.label}</span>
                    {payMethod===m.id&&<CheckCircle size={18} color={P}/>}
                  </div>
                ))}
              </div>
              <div style={{background:"white",borderRadius:20,padding:"16px",marginBottom:14,boxShadow:"0 4px 16px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:12,color:"#1a1a1a"}}>🎁 Promo kod</div>
                <div style={{display:"flex",gap:8}}>
                  <input type="text" value={promoCode} onChange={e=>setPromoCode(e.target.value.toUpperCase())} placeholder="DASTURXON10" style={{flex:1}}/>
                  <button className="ob" onClick={applyPromo} style={{padding:"10px 14px",borderRadius:12,fontSize:13}}>Qo'llanish</button>
                </div>
                {promoErr&&<div style={{fontSize:12,color:"#ef4444",marginTop:6}}>{promoErr}</div>}
                {promoApplied&&<div style={{fontSize:12,color:"#22c55e",marginTop:6}}>✓ {PROMCODES[promoApplied].label}</div>}
                <div style={{fontSize:11,color:"#bbb",marginTop:6}}>Kodlar: DASTURXON10 · YANGI50 · BIRINCHI</div>
              </div>
              <div style={{background:"white",borderRadius:20,padding:"16px",marginBottom:14,boxShadow:"0 4px 16px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:12,color:"#1a1a1a"}}>📝 Kuryer uchun izoh</div>
                <textarea value={courierNote} onChange={e=>setCourierNote(e.target.value)} placeholder="Qavat, eshik kodi, qo'ng'iroq qiling..." rows={2} style={{width:"100%"}}/>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,cursor:"pointer"}} onClick={()=>setNoCall(!noCall)}>
                  <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${noCall?P:"#ddd"}`,background:noCall?"#FFF0E5":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {noCall&&<CheckCircle size={12} color={P}/>}
                  </div>
                  <span style={{fontSize:13,color:"#555"}}>Qo'ng'iroq qilmaslik (faqat SMS)</span>
                </div>
              </div>
              <div style={{background:"white",borderRadius:20,padding:"16px",marginBottom:80,boxShadow:"0 4px 16px rgba(0,0,0,.07)"}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:10,color:"#1a1a1a"}}>🧾 Hisob</div>
                {Object.entries(cart).map(([id,qty])=>{const it=menuData.items.find(m=>m.id===+id);return it?(<div key={id} style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:"#555"}}>{it.name} × {qty}</span><span style={{fontSize:13,fontWeight:700}}>{fmt(it.price*qty)}</span></div>):null;})}
                <div style={{borderTop:"1px solid #f5e6d8",marginTop:10,paddingTop:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:"#888"}}>Mahsulotlar</span><span style={{fontSize:13}}>{fmt(cartSubtotal)}</span></div>
                  {promoDisc>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:"#22c55e"}}>Chegirma</span><span style={{fontSize:13,color:"#22c55e"}}>-{fmt(promoDisc)}</span></div>}
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,color:"#888"}}>Yetkazma</span><span style={{fontSize:13}}>{fmt(r.fee)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:800,fontSize:15}}>Jami</span><span style={{fontWeight:900,fontSize:18,color:P}}>{fmt(cartTotal)}</span></div>
                </div>
              </div>
            </div>
            <div style={{position:"fixed",bottom:0,left:0,right:0,margin:"0 auto",width:"100%",maxWidth:isDesktop?600:480,padding:"12px 16px 24px",zIndex:100}}>
              <button className="ob" onClick={placeOrder} style={{width:"100%",padding:"15px 20px",fontSize:15,borderRadius:18,boxShadow:"0 8px 30px rgba(249,115,22,.4)"}}>
                Buyurtma berish — {fmt(cartTotal)}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{background:r.bg,height:200,position:"relative",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:20}}>
              <button onClick={goBack} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,.9)",border:"none",borderRadius:12,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><ArrowLeft size={20} color="#1a1a1a"/></button>
              <button onClick={e=>toggleFav(r.id,e)} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,.9)",border:"none",borderRadius:12,width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Heart size={18} fill={favs.has(r.id)?"#ef4444":"none"} color={favs.has(r.id)?"#ef4444":"#555"}/></button>
              <span style={{fontSize:64}}>{r.e}</span>
            </div>
            <div style={{background:"white",padding:"18px 16px 14px",boxShadow:"0 4px 20px rgba(0,0,0,.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <h2 style={{margin:"0 0 6px",fontWeight:900,fontSize:20,color:"#1a1a1a"}}>{r.name}</h2>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,background:"#FFF0E5",padding:"4px 10px",borderRadius:20}}>
                      <Star size={12} fill="#fbbf24" color="#fbbf24"/><span style={{fontWeight:800,fontSize:12,color:"#1a1a1a"}}>{r.rating}</span><span style={{fontSize:11,color:"#aaa"}}>({r.reviews})</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4,background:"#f3f4f6",padding:"4px 10px",borderRadius:20}}>
                      <Clock size={12} color="#888"/><span style={{fontWeight:700,fontSize:12,color:"#555"}}>{estDelivery(r)} min</span>
                    </div>
                    <div style={{background:r.open?"#dcfce7":"#fee2e2",padding:"4px 10px",borderRadius:20}}>
                      <span style={{fontWeight:700,fontSize:12,color:r.open?"#16a34a":"#dc2626"}}>{r.open?"✓ Ochiq":"✕ Yopiq"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:10,fontSize:12,color:"#888"}}>
                <MapPin size={12} color={P}/><span>{r.address}</span><span style={{marginLeft:8}}><Phone size={12} color={P}/></span><span style={{marginLeft:4}}>{r.phone}</span>
              </div>
              {!r.open&&<div style={{background:"#fee2e2",borderRadius:12,padding:"8px 12px",fontSize:12,color:"#dc2626",fontWeight:700,marginBottom:10}}>⚠️ Ushbu restoran hozir yopiq. Keyinroq buyurtma bering.</div>}
              {cartSubtotal>0&&cartSubtotal<r.min&&<div style={{background:"#fff3cd",borderRadius:12,padding:"8px 12px",fontSize:12,color:"#92660a",fontWeight:700,marginBottom:10}}>⚠️ Minimal buyurtma: {fmt(r.min)}. Yana {fmt(r.min-cartSubtotal)} qo'shing.</div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[["Yetkazma",fmt(r.fee)],["Min.",fmt(r.min)],[r.dist+" km","masofasi"]].map(([l,v])=>(
                  <div key={l} style={{background:"#fafafa",borderRadius:12,padding:"8px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#bbb",fontWeight:600,marginBottom:2}}>{v}</div>
                    <div style={{fontSize:11,fontWeight:800,color:"#1a1a1a"}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:"white",borderBottom:"1px solid #f5e6d8",padding:"12px 0 0"}}>
              <div className="hs" style={{padding:"0 16px 12px"}}>
                {menuData.categories.map(c=>(
                  <button key={c.id} onClick={()=>setMenuCat(c.name)} style={{flexShrink:0,padding:"8px 16px",borderRadius:20,border:"none",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .15s",background:menuCat===c.name?P:"#f5f5f5",color:menuCat===c.name?"white":"#666"}}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div style={{padding:"12px 16px 130px"}}>
              {menuLoading ? (
                <div style={{textAlign:"center",padding:"40px 0",color:"#aaa",fontWeight:700}}>Menyu yuklanmoqda…</div>
              ) : menuData.items.length === 0 ? (
                <div style={{textAlign:"center",padding:"40px 0",color:"#aaa"}}><div style={{fontSize:48,marginBottom:12}}>🍽️</div><div style={{fontWeight:700,fontSize:15}}>Bu restoranda hozircha menyu qo'shilmagan</div></div>
              ) : (<>
              <div style={{fontWeight:800,fontSize:16,color:"#1a1a1a",marginBottom:12}}>{menuCat} <span style={{color:"#bbb",fontSize:13,fontWeight:600}}>({menuItems.length} ta)</span></div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {menuItems.map(item=>{
                  const qty=cart[item.id]||0;
                  return (
                    <div key={item.id} style={{background:"white",borderRadius:16,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" style={{width:58,height:58,borderRadius:12,objectFit:"cover",flexShrink:0}}/>
                      ) : (
                        <div style={{background:r.bg,width:58,height:58,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:24}}>{r.e}</div>
                      )}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:800,fontSize:13,color:"#1a1a1a",marginBottom:2,lineHeight:1.3}}>{item.name}</div>
                        <div style={{fontSize:11,color:"#aaa",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.description||""}</div>
                        <div style={{fontWeight:900,fontSize:14,color:P}}>{fmt(item.price)}</div>
                      </div>
                      <div style={{flexShrink:0}}>
                        {qty===0?(
                          <button className="ob" style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>addItem(item.id)} disabled={!r.open}>
                            <Plus size={16} color="white"/>
                          </button>
                        ):(
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <button onClick={()=>removeItem(item.id)} style={{width:30,height:30,borderRadius:10,background:"#f3f4f6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Minus size={14} color="#555"/></button>
                            <span style={{fontWeight:900,fontSize:14,color:"#1a1a1a",minWidth:16,textAlign:"center"}}>{qty}</span>
                            <button className="ob" style={{width:30,height:30,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>addItem(item.id)}><Plus size={14} color="white"/></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </>)}
            </div>
            {cartCount>0&&(
              <div style={{position:"fixed",bottom:0,left:0,right:0,margin:"0 auto",width:"100%",maxWidth:isDesktop?600:480,padding:"12px 16px 24px",zIndex:100}}>
                <button className="ob" onClick={()=>setCheckoutOpen(true)} style={{width:"100%",padding:"15px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:14,borderRadius:18,boxShadow:"0 8px 30px rgba(249,115,22,.4)"}}>
                  <div style={{background:"rgba(255,255,255,.25)",borderRadius:10,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13}}>{cartCount}</div>
                  <span>Savatga o'tish</span>
                  <span>{fmt(cartSubtotal)}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if(adminOpen) {
    const totalOrders = orders.length;
    const totalRev = orders.reduce((s,o)=>s+o.total,0);
    const activeOrds = orders.filter(o=>o.stage<3).length;
    return (
      <div style={W}>
        <style>{CSS}</style>
        <div style={{background:"#1a1a2e",padding:"16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{color:"white",fontWeight:900,fontSize:18}}>⚙️ Admin Panel</div>
          <button onClick={()=>setAdminOpen(false)} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={18} color="white"/></button>
        </div>
        <div className="hs" style={{background:"#1a1a2e",padding:"0 16px 16px",gap:6}}>
          {[["overview","📊","Ko'rsatkich"],["orders","📦","Buyurtmalar"],["restaurants","🍽️","Restoranlar"],["promos","🎁","Promokodlar"]].map(([t,e,l])=>(
            <button key={t} onClick={()=>setAdminTab(t)} style={{flexShrink:0,padding:"8px 14px",borderRadius:20,border:"none",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer",background:adminTab===t?"white":"rgba(255,255,255,.12)",color:adminTab===t?"#1a1a2e":"white"}}>
              {e} {l}
            </button>
          ))}
        </div>
        <div style={{padding:"16px 16px 40px"}}>
          {adminTab==="overview"&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[[totalOrders,"Jami buyurtma","📦"],[activeOrds,"Faol buyurtma","🔄"],[fmt(totalRev),"Jami daromad","💰"],[restaurants.length,"Restoranlar","🍽️"]].map(([v,l,e])=>(
                  <div key={l} style={{background:"white",borderRadius:16,padding:"14px",boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                    <div style={{fontSize:24,marginBottom:4}}>{e}</div>
                    <div style={{fontWeight:900,fontSize:18,color:"#1a1a1a"}}>{v}</div>
                    <div style={{fontSize:11,color:"#aaa",fontWeight:600}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"white",borderRadius:16,padding:"16px",boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:12,color:"#1a1a1a"}}>So'nggi buyurtmalar</div>
                {orders.slice(0,5).map(o=>(
                  <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f5e6d8"}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:"#1a1a1a"}}>{o.resto}</div>
                      <div style={{fontSize:11,color:"#aaa"}}>{o.items.length} ta mahsulot</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:800,fontSize:13,color:P}}>{fmt(o.total)}</div>
                      <div style={{fontSize:11,background:o.stage===3?"#dcfce7":"#FFF0E5",color:o.stage===3?"#16a34a":P,padding:"2px 8px",borderRadius:20,fontWeight:700}}>{ORDER_STAGES[o.stage]}</div>
                    </div>
                  </div>
                ))}
                {orders.length===0&&<div style={{textAlign:"center",color:"#aaa",fontSize:13,padding:"20px 0"}}>Hali buyurtmalar yo'q</div>}
              </div>
            </>
          )}
          {adminTab==="orders"&&(
            <div>
              {orders.map(o=>(
                <div key={o.id} style={{background:"white",borderRadius:16,padding:"14px",marginBottom:10,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:14,color:"#1a1a1a"}}>{o.resto}</div>
                      <div style={{fontSize:11,color:"#aaa"}}>{o.date.toLocaleDateString()} {o.date.toLocaleTimeString("uz-UZ",{hour:"2-digit",minute:"2-digit"})}</div>
                    </div>
                    <span style={{background:o.stage===3?"#dcfce7":"#FFF0E5",color:o.stage===3?"#16a34a":P,fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:20}}>{ORDER_STAGES[o.stage]}</span>
                  </div>
                  <div style={{fontSize:12,color:"#555",marginBottom:6}}>{o.items.map(i=>i.name+"×"+i.qty).join(", ")}</div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:"#888"}}>📍 {o.addr}</span><span style={{fontWeight:900,fontSize:14,color:P}}>{fmt(o.total)}</span></div>
                </div>
              ))}
              {orders.length===0&&<div style={{textAlign:"center",color:"#aaa",fontSize:14,padding:"40px 0"}}>Hali buyurtmalar yo'q</div>}
            </div>
          )}
          {adminTab==="restaurants"&&(
            <div>
              {restaurants.map(r=>(
                <div key={r.id} style={{background:"white",borderRadius:16,padding:"14px",marginBottom:10,boxShadow:"0 2px 10px rgba(0,0,0,.06)",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{background:r.bg,width:48,height:48,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:22}}>{r.e}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:14,color:"#1a1a1a"}}>{r.name}</div>
                    <div style={{fontSize:12,color:"#aaa"}}>{r.address}</div>
                    <div style={{display:"flex",gap:6,marginTop:4}}>
                      <span style={{fontSize:11,color:"#888"}}>⭐ {r.rating}</span>
                      <span style={{fontSize:11,color:"#888"}}>· {r.reviews} sharh</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                    <button onClick={()=>setRestaurants(prev=>prev.map(x=>x.id===r.id?{...x,open:!x.open}:x))} style={{background:r.open?"#dcfce7":"#fee2e2",border:"none",borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:700,color:r.open?"#16a34a":"#dc2626",cursor:"pointer",fontFamily:"inherit"}}>
                      {r.open?"Ochiq":"Yopiq"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {adminTab==="promos"&&(
            <div>
              <div style={{fontWeight:800,fontSize:15,color:"#1a1a1a",marginBottom:14}}>Faol promo kodlar</div>
              {Object.entries(PROMCODES).map(([code,info])=>(
                <div key={code} style={{background:"white",borderRadius:16,padding:"14px 16px",marginBottom:10,boxShadow:"0 2px 10px rgba(0,0,0,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:16,color:P}}>{code}</div>
                    <div style={{fontSize:12,color:"#888",marginTop:2}}>{info.label} · {info.disc}% chegirma</div>
                  </div>
                  <div style={{background:"#dcfce7",color:"#16a34a",fontWeight:700,fontSize:12,padding:"4px 12px",borderRadius:20}}>Faol</div>
                </div>
              ))}
              <button className="ob" onClick={()=>addToast("Yangi kod qo'shish tez orada!")} style={{width:"100%",padding:"13px",fontSize:14,borderRadius:14,marginTop:6}}>
                + Yangi promo kod
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={W}>
      <style>{CSS}</style>

      {toasts.map(t=>(
        <div key={t.id} style={{position:"fixed",top:80,left:0,right:0,margin:"0 auto",width:"fit-content",maxWidth:"88%",background:t.type==="err"?"#dc2626":"#1a1a2e",color:"white",padding:"10px 20px",borderRadius:20,fontSize:13,fontWeight:700,zIndex:9999,textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,.3)",transition:"all .3s"}}>
          {t.msg}
        </div>
      ))}

      {reviewOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:480}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontWeight:900,fontSize:18,color:"#1a1a1a"}}>Buyurtmani baholang</div>
              <button onClick={()=>setReviewOpen(null)} style={{background:"#f5f5f5",border:"none",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={18}/></button>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:14,color:"#555",marginBottom:8}}>Restoran ({reviewOpen.resto})</div>
              <div style={{display:"flex",gap:8}}>
                {[1,2,3,4,5].map(s=><button key={s} onClick={()=>setStarRest(s)} style={{background:"none",border:"none",cursor:"pointer",fontSize:28,opacity:s<=starRest?1:0.25}}>⭐</button>)}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:14,color:"#555",marginBottom:8}}>Kuryer</div>
              <div style={{display:"flex",gap:8}}>
                {[1,2,3,4,5].map(s=><button key={s} onClick={()=>setStarCourier(s)} style={{background:"none",border:"none",cursor:"pointer",fontSize:28,opacity:s<=starCourier?1:0.25}}>⭐</button>)}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:14,color:"#555",marginBottom:8}}>Tezkor teglar</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {REVIEW_TAGS.map(t=>(
                  <button key={t} onClick={()=>setReviewTags(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t])}
                    style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${reviewTags.includes(t)?P:"#e5e5e5"}`,background:reviewTags.includes(t)?"#FFF0E5":"white",color:reviewTags.includes(t)?P:"#555",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:20}}>
              <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Batafsil fikr (ixtiyoriy)..." rows={2} style={{width:"100%"}}/>
            </div>
            <button className="ob" onClick={submitReview} disabled={!starRest} style={{width:"100%",padding:"14px",fontSize:15,borderRadius:16}}>
              Yuborish ⭐
            </button>
          </div>
        </div>
      )}

      {tab==="home"&&(
        <>
          {isDesktop ? (
            <div style={{background:"white",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 12px rgba(0,0,0,.06)",padding:"16px 0"}}>
              <div style={{maxWidth:1100,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:18}}>
                <div onClick={()=>{setHomeCat("all");setHomeQ("");}} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0}}>
                  <span style={{fontSize:28}}>🍽️</span>
                  <span style={{fontWeight:900,fontSize:22,color:P,letterSpacing:-0.5}}>Dasturxon</span>
                </div>
                <button onClick={getLocation} style={{display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",minWidth:0,maxWidth:460,padding:"0 8px"}}>
                  <MapPin size={18} color={P} strokeWidth={2.5} style={{flexShrink:0}}/>
                  <span style={{display:"flex",flexDirection:"column",alignItems:"flex-start",minWidth:0}}>
                    <span style={{fontSize:12,color:"#888",fontWeight:700,lineHeight:1.2}}>{activeAddr.label}</span>
                    <span style={{fontWeight:900,fontSize:16,color:"#1a1a1a",whiteSpace:"nowrap",maxWidth:360,overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.3}}>{activeAddr.addr.includes("(")?activeAddr.addr.split("(")[0].trim():activeAddr.addr}</span>
                  </span>
                  {locLoading?<RefreshCw size={14} color={P}/>:<ChevronRight size={15} color="#aaa"/>}
                </button>
                <button onClick={()=>setTab("profile")} style={{background:P,border:"none",borderRadius:14,width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                  <User size={18} color="white"/>
                </button>
              </div>
            </div>
          ) : (
          <div style={SH}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:isDesktop?1100:"100%",margin:"0 auto",width:"100%"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:4,color:"#888",fontSize:12,marginBottom:2}}>
                  <MapPin size={12} color={P} strokeWidth={2.5}/>
                  <span>{activeAddr.label}</span>
                </div>
                <button onClick={getLocation} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit",maxWidth:"100%",overflow:"hidden"}}>
                  <span style={{fontWeight:900,fontSize:16,color:"#1a1a1a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:220}}>{activeAddr.addr.includes("(")?activeAddr.addr.split("(")[0].trim():activeAddr.addr}</span>
                  {locLoading?<RefreshCw size={14} color={P}/>:<ChevronRight size={15} color="#aaa"/>}
                </button>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>changeTab("profile")} style={{background:P,border:"none",borderRadius:12,width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  <User size={18} color="white"/>
                </button>
              </div>
            </div>
          </div>
          )}

          <div style={{padding:isDesktop?"18px 16px 4px":"14px 16px 4px",maxWidth:isDesktop?1100:"100%",margin:"0 auto",width:"100%"}}>
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:10,background:"white",borderRadius:16,padding:"12px 16px",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
                <Search size={18} color="#ccc"/>
                <input type="text" value={homeQ} onChange={e=>setHomeQ(e.target.value)} placeholder="Restoran yoki taom..." style={{border:"none",outline:"none",flex:1,fontSize:14,fontFamily:"inherit",background:"transparent",color:"#1a1a1a",padding:0}}/>
                {homeQ&&<button onClick={()=>setHomeQ("")} style={{border:"none",background:"none",cursor:"pointer",color:"#aaa",fontSize:16,lineHeight:1}}>✕</button>}
              </div>
              <button style={{background:"white",border:"none",borderRadius:16,width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}} onClick={()=>addToast("Filter tez orada!")}>
                <Filter size={18} color={P}/>
              </button>
            </div>
          </div>

          {!homeQ&&(
            <div style={{margin:"14px auto 4px",padding:"0 16px",maxWidth:isDesktop?1100:"100%",width:"100%"}}>
              <div style={{background:"linear-gradient(135deg,#c0370a,#F97316 50%,#fbbf24)",borderRadius:20,padding:isDesktop?"32px 36px":"20px",position:"relative",overflow:"hidden",cursor:"pointer"}} onClick={()=>addToast("Aksiya: DASTURXON10 kod bilan bepul yetkazma!")}>
                <div style={{position:"absolute",right:-20,top:-20,fontSize:isDesktop?140:90,opacity:.12}}>🎉</div>
                <div style={{position:"absolute",right:isDesktop?50:20,top:"50%",transform:"translateY(-50%)",fontSize:isDesktop?72:48}}>🍽️</div>
                <div style={{color:"rgba(255,255,255,.8)",fontSize:isDesktop?13:11,fontWeight:700,marginBottom:4,letterSpacing:1}}>MAXSUS TAKLIF</div>
                <div style={{color:"white",fontSize:isDesktop?28:18,fontWeight:900,lineHeight:1.25,marginBottom:8}}>Birinchi buyurtmada<br/>yetkazma BEPUL!</div>
                <div style={{background:"rgba(255,255,255,.22)",display:"inline-block",padding:"6px 14px",borderRadius:20,color:"white",fontSize:12,fontWeight:800}}>DASTURXON10 kod bilan →</div>
              </div>
            </div>
          )}

          <div style={{marginTop:14,marginBottom:4,maxWidth:isDesktop?1100:"100%",marginLeft:"auto",marginRight:"auto",width:"100%"}}>
            <div className="hs" style={{padding:"0 16px 4px",flexWrap:isDesktop?"wrap":"nowrap"}}>
              {CATS.map(c=>(
                <button key={c.id} onClick={()=>setHomeCat(c.id)} style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 12px",borderRadius:16,border:homeCat===c.id?`2px solid ${P}`:"2px solid transparent",background:homeCat===c.id?"#FFF0E5":"white",cursor:"pointer",transition:"all .15s",boxShadow:homeCat===c.id?"none":"0 2px 8px rgba(0,0,0,.05)"}}>
                  <span style={{fontSize:20}}>{c.e}</span>
                  <span style={{fontSize:11,fontWeight:700,color:homeCat===c.id?P:"#666",whiteSpace:"nowrap"}}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{padding:"6px 16px 2px",display:"flex",gap:8,maxWidth:isDesktop?1100:"100%",margin:"0 auto",width:"100%"}}>
            {[["distance","📍 Yaqin"],["rating","⭐ Reyting"],["fee","💰 Arzon"]].map(([s,l])=>(
              <button key={s} onClick={()=>setSortBy(s)} style={{padding:"6px 12px",borderRadius:20,border:"none",background:sortBy===s?"#1a1a2e":"white",color:sortBy===s?"white":"#888",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                {l}
              </button>
            ))}
          </div>

          <div style={{padding:"10px 16px 100px",maxWidth:isDesktop?1100:"100%",margin:"0 auto",width:"100%"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontWeight:900,fontSize:17,color:"#1a1a1a"}}>{homeCat==="all"&&!homeQ?"Restoranlar":"Natijalar"}</span>
              <span style={{background:"#FFF0E5",color:P,fontSize:12,fontWeight:800,padding:"2px 10px",borderRadius:20}}>{filteredHome.length} ta</span>
            </div>
            {filteredHome.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#bbb"}}><div style={{fontSize:48,marginBottom:12}}>😕</div><div style={{fontWeight:700,fontSize:16,color:"#777"}}>Topilmadi</div></div>}
            {loading ? (
              <div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:36,marginBottom:12}}>🍽️</div>
                <div style={{fontWeight:700,color:"#aaa"}}>Yuklanmoqda...</div>
              </div>
            ) : null}
            <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(auto-fill,minmax(220px,1fr))":"1fr 1fr",gap:isDesktop?16:12}}>
              {filteredHome.map(r=><RestoCard key={r.id} r={r}/>)}
            </div>
          </div>
        </>
      )}

      {tab==="search"&&(
        <>
          <div style={SH}>
            <div style={{fontWeight:900,fontSize:18,color:"#1a1a1a",marginBottom:12}}>🔍 Qidiruv</div>
            <div style={{display:"flex",alignItems:"center",gap:10,background:"#f5f0eb",borderRadius:16,padding:"12px 16px"}}>
              <Search size={18} color={P}/>
              <input type="text" autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Restoran, taom turi..." style={{border:"none",outline:"none",flex:1,fontSize:14,fontFamily:"inherit",background:"transparent",color:"#1a1a1a",padding:0}}/>
              {searchQ&&<button onClick={()=>setSearchQ("")} style={{border:"none",background:"none",cursor:"pointer",color:"#aaa",fontSize:16,lineHeight:1}}>✕</button>}
            </div>
          </div>
          {!searchQ&&(
            <div style={{padding:"14px 16px 4px"}}>
              <div style={{fontWeight:900,fontSize:15,color:"#1a1a1a",marginBottom:10}}>Kategoriyalar</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:18}}>
                {CATS.filter(c=>c.id!=="all").map(c=>(
                  <button key={c.id} onClick={()=>{setHomeCat(c.id);setTab("home");}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:"white",border:"none",borderRadius:14,padding:"12px 6px",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                    <span style={{fontSize:24}}>{c.e}</span><span style={{fontWeight:700,fontSize:11,color:"#1a1a1a",textAlign:"center"}}>{c.label}</span>
                  </button>
                ))}
              </div>
              <div style={{fontWeight:900,fontSize:15,color:"#1a1a1a",marginBottom:10}}>Barcha restoranlar</div>
            </div>
          )}
          <div style={{padding:"0 16px 100px"}}>
            {searchQ&&<div style={{fontWeight:700,fontSize:13,color:"#888",marginBottom:12}}>{filteredSearch.length} natija</div>}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(searchQ?filteredSearch:sorted).map(r=>(
                <div key={r.id} className="cd" onClick={()=>openResto(r)} style={{background:"white",borderRadius:16,display:"flex",alignItems:"center",gap:12,padding:"12px 14px",boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                  <div style={{background:r.bg,width:54,height:54,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:24}}>{r.e}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:14,color:"#1a1a1a"}}>{r.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3}}>
                      <Star size={11} fill="#fbbf24" color="#fbbf24"/>
                      <span style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{r.rating}</span>
                      <span style={{fontSize:11,color:"#bbb"}}>·</span>
                      <span style={{fontSize:11,color:"#888"}}>{estDelivery(r)} min</span>
                      <span style={{fontSize:11,color:"#bbb"}}>·</span>
                      <span style={{fontSize:11,color:"#888"}}>{r.dist} km</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                    <span style={{background:r.open?"#dcfce7":"#fee2e2",color:r.open?"#16a34a":"#dc2626",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{r.open?"Ochiq":"Yopiq"}</span>
                    <span style={{fontSize:11,color:"#aaa"}}>{fmt(r.fee)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab==="orders"&&(
        <>
          <div style={SH}><div style={{fontWeight:900,fontSize:18,color:"#1a1a1a"}}>📦 Buyurtmalarim</div></div>
          <div style={{padding:"16px 16px 100px"}}>
            {orders.filter(o=>o.stage<3).length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontWeight:800,fontSize:15,color:"#1a1a1a",marginBottom:10}}>🔄 Faol buyurtmalar</div>
                {orders.filter(o=>o.stage<3).map(o=>(
                  <div key={o.id} className="cd" onClick={()=>{setTrackingOrder(o.id);setView("tracking");}} style={{background:"white",borderRadius:16,padding:"14px",marginBottom:10,boxShadow:"0 4px 16px rgba(0,0,0,.07)",border:`1.5px solid ${P}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{fontWeight:800,fontSize:14,color:"#1a1a1a"}}>{o.resto}</div>
                      <span style={{background:"#FFF0E5",color:P,fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:20}}>{ORDER_STAGES[o.stage]}</span>
                    </div>
                    <div style={{background:"#f5e6d8",borderRadius:20,height:6,overflow:"hidden",marginBottom:6}}>
                      <div style={{background:P,width:Math.round((o.stage/(ORDER_STAGES.length-1))*100)+"%",height:"100%",borderRadius:20,transition:"width 1s"}}/>
                    </div>
                    <div style={{fontSize:12,color:"#888"}}>~{etaLeft(o)} daqiqa qoldi · Kuzatish →</div>
                  </div>
                ))}
              </div>
            )}
            {orders.filter(o=>o.stage===3).length>0&&(
              <div>
                <div style={{fontWeight:800,fontSize:15,color:"#1a1a1a",marginBottom:10}}>✅ Yetkazilgan</div>
                {orders.filter(o=>o.stage===3).map(o=>(
                  <div key={o.id} style={{background:"white",borderRadius:16,padding:"14px",marginBottom:10,boxShadow:"0 4px 16px rgba(0,0,0,.07)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{background:o.restoBg,width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{o.restoE}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:800,fontSize:14,color:"#1a1a1a"}}>{o.resto}</div>
                        <div style={{fontSize:11,color:"#aaa"}}>{o.date.toLocaleDateString("uz-UZ")}</div>
                      </div>
                      <div style={{fontWeight:900,fontSize:15,color:P}}>{fmt(o.total)}</div>
                    </div>
                    <div style={{fontSize:12,color:"#888",marginBottom:10}}>{o.items.map(i=>i.name+"×"+i.qty).join(" · ")}</div>
                    {o.reviewed?(
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        {Array(o.rating).fill(0).map((_,i)=><span key={i} style={{fontSize:14}}>⭐</span>)}
                        <span style={{fontSize:12,color:"#aaa",marginLeft:4}}>Baholagan</span>
                      </div>
                    ):(
                      <div style={{display:"flex",gap:8}}>
                        <button className="ob" onClick={()=>{setReviewOpen(o);setStarRest(0);setStarCourier(0);setReviewTags([]);setReviewText("");}} style={{flex:1,padding:"10px",fontSize:12,borderRadius:12}}>⭐ Baholash</button>
                        <button onClick={()=>{const r=restaurants.find(x=>x.name===o.resto);if(r)openResto(r);}} style={{flex:1,padding:"10px",borderRadius:12,border:`1.5px solid ${P}`,background:"white",color:P,fontFamily:"inherit",fontWeight:800,fontSize:12,cursor:"pointer"}}>Qayta buyurtma</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {orders.length===0&&(
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{fontSize:72,marginBottom:16}}>🛍️</div>
                <div style={{fontWeight:900,fontSize:20,color:"#1a1a1a",marginBottom:8}}>Buyurtmalar yo'q</div>
                <div style={{fontSize:14,color:"#aaa",marginBottom:28}}>Sevimli restoranlardan buyurtma qiling</div>
                <button className="ob" onClick={()=>setTab("home")} style={{padding:"14px 32px",fontSize:15}}>Restoranlarni ko'rish</button>
              </div>
            )}
          </div>
        </>
      )}

      {tab==="profile"&&(
        <>
          <div style={SH}><div style={{fontWeight:900,fontSize:18,color:"#1a1a1a"}}>👤 Profil</div></div>
          <div style={{padding:"16px 16px 100px"}}>
            <div style={{background:"white",borderRadius:20,padding:"20px",marginBottom:14,boxShadow:"0 4px 16px rgba(0,0,0,.07)"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
                <div style={{width:66,height:66,borderRadius:22,background:`linear-gradient(145deg,${P},#fbbf24)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:26,fontWeight:900,color:"white"}}>{(userName||"?").substring(0,2).toUpperCase()}</span>
                </div>
                <div style={{flex:1}}>
                  {editProfile?(
                    <div>
                      <input type="text" defaultValue={userName} onBlur={e=>{
                        const newName = e.target.value.trim();
                        if(newName && newName !== userName){
                          api.patch ? null : null; // placeholder
                          fetch(API+"/api/auth/profile",{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({name:newName})}).then(r=>r.json()).then(u=>{setUser(prev=>({...prev,name:u.name||newName}));localStorage.setItem("dx_user",JSON.stringify({...user,name:u.name||newName}));addToast("Saqlandi ✓");}).catch(()=>{});
                        }
                      }} style={{marginBottom:6,fontSize:15,fontWeight:800}} placeholder="Ismingiz"/>
                      <input type="tel" value={userPhone} readOnly style={{fontSize:13,opacity:0.6}} placeholder="Telefon"/>
                    </div>
                  ):(
                    <div>
                      <div style={{fontWeight:900,fontSize:19,color:"#1a1a1a"}}>{userName}</div>
                      <div style={{fontSize:13,color:"#aaa",marginTop:2}}>{userPhone}</div>
                    </div>
                  )}
                </div>
                <button onClick={()=>setEditProfile(!editProfile)} style={{background:"#f5f5f5",border:"none",borderRadius:10,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                  {editProfile?<CheckCircle size={16} color="#22c55e"/>:<Edit3 size={15} color="#888"/>}
                </button>
              </div>
              <div style={{background:"#FFF0E5",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>🎁</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:13,color:"#1a1a1a"}}>{userBonus} bonus ball</div>
                  <div style={{fontSize:11,color:"#aaa"}}>Har 100 so'mda 1 ball yig'iladi</div>
                </div>
                <button onClick={()=>addToast("Bonus tizimi tez orada!")} style={{background:P,border:"none",borderRadius:10,padding:"6px 12px",color:"white",fontSize:11,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Ishlatish</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {[[orders.length,"Buyurtma","📦"],[favs.size,"Sevimli","❤️"],[orders.filter(o=>o.reviewed).length,"Sharh","⭐"]].map(([v,l,e])=>(
                <div key={l} style={{background:"white",borderRadius:16,padding:"14px 8px",textAlign:"center",boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                  <div style={{fontSize:22,marginBottom:4}}>{e}</div>
                  <div style={{fontWeight:900,fontSize:18,color:"#1a1a1a"}}>{v}</div>
                  <div style={{fontSize:11,color:"#bbb",fontWeight:600}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{background:"white",borderRadius:20,padding:"4px 16px",marginBottom:14,boxShadow:"0 4px 16px rgba(0,0,0,.07)"}}>
              <div className="pr"><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:10,background:"#FFF0E5",display:"flex",alignItems:"center",justifyContent:"center"}}><MapPin size={17} color={P}/></div><span style={{fontWeight:700,fontSize:14,color:"#1a1a1a"}}>Manzillarim</span></div><ChevronRight size={18} color="#ddd"/></div>
              <div className="pr"><div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:10,background:"#FFF0E5",display:"flex",alignItems:"center",justifyContent:"center"}}><CreditCard size={17} color={P}/></div><span style={{fontWeight:700,fontSize:14,color:"#1a1a1a"}}>To'lov usullari</span></div><ChevronRight size={18} color="#ddd"/></div>
              <div className="pr" style={{borderBottom:"none"}} onClick={()=>{localStorage.removeItem("dx_token");localStorage.removeItem("dx_user");setToken(null);setUser(null);setView("main");addToast("Chiqdingiz");}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:10,background:"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center"}}><LogOut size={17} color="#ef4444"/></div><span style={{fontWeight:700,fontSize:14,color:"#ef4444"}}>Chiqish</span></div>
                <ChevronRight size={18} color="#fca5a5"/>
              </div>
            </div>
            <div style={{textAlign:"center",fontSize:12,color:"#ccc"}}>Dasturxon v2.0 · Shahrisabz © 2026</div>
          </div>
        </>
      )}

      {bottomNav}
    </div>
  );
}
