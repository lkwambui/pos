import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";
import {
  ShoppingCart, Package, Search, Scan, Plus, Minus, X,
  User, ChevronDown, CheckCircle2, Banknote, Phone, CreditCard,
  Layers, QrCode, Printer, Mail, MessageSquare, FileDown,
  Zap, Shield, AlertCircle, Loader2,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  vatRate: number;
  category?: { name: string };
  stock?: { quantity: number };
  isActive: boolean;
  trackStock: boolean;
}

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
  vatRate: number;
  discount: number;
  categoryName: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number; hasMore: boolean };
}

const fmt = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

export function NewSaleView() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMode, setPaymentMode] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("254");
  const [mpesaStatus, setMpesaStatus] = useState<string | null>(null);
  const [mpesaError, setMpesaError] = useState<string | null>(null);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const [lastCheckoutId, setLastCheckoutId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.qty * (1 - i.discount / 100), 0);
  const vat = cart.reduce((acc, i) => {
    const lineTotal = i.price * i.qty * (1 - i.discount / 100);
    return acc + (lineTotal * i.vatRate) / (100 + i.vatRate);
  }, 0);
  const totalDiscount = cart.reduce((acc, i) => acc + i.price * i.qty * (i.discount / 100), 0);
  const total = subtotal;
  const balance = amountPaid ? parseFloat(amountPaid.replace(/,/g, "")) - total : 0;

  useEffect(() => {
    api.get<PaginatedResponse<Product>>("/products?limit=100")
      .then(res => {
        const items = res.data || [];
        setProducts(items);
        const cats = ["All", ...new Set(items.map(p => p.category?.name || "Uncategorized").filter(Boolean))];
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (paymentMode === "MPESA") {
      setAmountPaid(total.toFixed(2));
    }
  }, [paymentMode, total]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const filteredProducts = products.filter(p => {
    if (!p.isActive) return false;
    const matchCat = activeCategory === "All" || p.category?.name === activeCategory;
    const query = searchQuery.toLowerCase();
    const matchSearch = !query || p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    return matchCat && matchSearch;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.sellingPrice),
        qty: 1,
        vatRate: Number(product.vatRate),
        discount: 0,
        categoryName: product.category?.name || "",
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const handlePaymentMode = (mode: string) => {
    setPaymentMode(mode === paymentMode ? null : mode);
    setMpesaPhone("254");
    setMpesaStatus(null);
    setMpesaError(null);
  };

  const initiateMpesaStkPush = async (paymentId: string) => {
    try {
      const res = await api.post("/mpesa/stk-push", {
        paymentId,
        phone: mpesaPhone,
      });
      setLastCheckoutId(res.data.checkoutRequestId);
      setMpesaStatus("processing");
      return res.data.checkoutRequestId;
    } catch (err: any) {
      setMpesaError(err.message || "M-Pesa STK Push failed");
      setMpesaStatus("failed");
      setSubmitting(false);
      return null;
    }
  };

  const pollPaymentStatus = (checkoutId: string, paymentId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    return new Promise<void>((resolve) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await api.get(`/mpesa/status/${checkoutId}`);
          if (res.data.status === "PAID") {
            if (pollRef.current) clearInterval(pollRef.current);
            setMpesaStatus("paid");
            resolve();
          } else if (res.data.status === "REFUNDED") {
            if (pollRef.current) clearInterval(pollRef.current);
            setMpesaStatus("failed");
            setMpesaError("Payment was not completed. Please try again.");
            resolve();
          }
        } catch {
          // continue polling
        }
      }, 3000);
    });
  };

  const completeSale = async () => {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setMpesaError(null);
    try {
      const res = await api.post("/sales", {
        items: cart.map(i => ({
          productId: i.id,
          quantity: i.qty,
          unitPrice: i.price,
          discount: i.discount,
          vatRate: i.vatRate,
        })),
        amountPaid: amountPaid ? parseFloat(amountPaid.replace(/,/g, "")) : 0,
        paymentMethod: paymentMode || undefined,
      });

      setLastSale(res.data);

      if (paymentMode === "MPESA") {
        const payment = res.data.payments?.[0] || res.data.payment;
        if (payment?.id) {
          setLastPaymentId(payment.id);
          const checkoutId = await initiateMpesaStkPush(payment.id);
          if (checkoutId) {
            await pollPaymentStatus(checkoutId, payment.id);
            const updatedSale = await api.get(`/sales/${res.data.id}`);
            setLastSale(updatedSale.data);
          }
        }
      }

      setShowReceipt(true);
    } catch (err: any) {
      alert(err.message || "Failed to complete sale");
    } finally {
      setSubmitting(false);
    }
  };

  if (showReceipt && lastSale) {
    return (
      <ReceiptView
        sale={lastSale}
        cart={cart}
        total={total}
        vat={vat}
        paymentMode={paymentMode || "Cash"}
        mpesaStatus={mpesaStatus}
        onClose={() => {
          setShowReceipt(false);
          setCart([]);
          setAmountPaid("");
          setPaymentMode(null);
          setLastSale(null);
          setMpesaStatus(null);
          setMpesaError(null);
          setLastPaymentId(null);
          setLastCheckoutId(null);
        }}
      />
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col border-r border-border bg-background overflow-hidden">
        <div className="p-4 bg-card border-b border-border space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-muted rounded-lg text-sm placeholder-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search product or scan barcode..."
              />
            </div>
            <button className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Scan size={16} className="text-muted-foreground" />
            </button>
          </div>
          {categories.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeCategory === cat ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map(p => {
              const stockQty = p.stock?.quantity ?? 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.trackStock && stockQty === 0}
                  className={`bg-card rounded-xl p-3 border border-border text-left transition-all hover:shadow-md hover:border-primary/30 group ${
                    p.trackStock && stockQty === 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <div className="w-full h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-2.5 group-hover:from-blue-50 group-hover:to-blue-50/50 transition-colors">
                    <Package size={20} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="text-[11px] font-medium text-foreground leading-tight line-clamp-2 mb-1">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground mb-1.5">{p.sku}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{fmt(Number(p.sellingPrice))}</span>
                    {p.trackStock && stockQty === 0 ? (
                      <span className="text-[9px] text-red-500 font-medium">Out of stock</span>
                    ) : p.trackStock ? (
                      <span className="text-[9px] text-emerald-600 font-medium">{stockQty} left</span>
                    ) : null}
                  </div>
                  {Number(p.vatRate) > 0 && (
                    <div className="mt-1">
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">VAT {p.vatRate}%</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-80 xl:w-96 flex flex-col bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={15} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Cart</span>
            {cart.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {cart.reduce((a, i) => a + i.qty, 0)}
              </span>
            )}
          </div>
          <button className="px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 rounded transition-colors" onClick={() => setCart([])}>Clear</button>
        </div>

        <div className="px-4 py-2 border-b border-border">
          <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm text-muted-foreground hover:bg-slate-100 transition-colors">
            <User size={13} />
            <span className="text-xs">Walk-in Customer</span>
            <ChevronDown size={12} className="ml-auto" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <ShoppingCart size={32} className="text-slate-200 mb-3" />
              <p className="text-sm text-muted-foreground">Cart is empty</p>
              <p className="text-xs text-muted-foreground mt-1">Click a product to add it</p>
            </div>
          ) : (
            cart.map(item => {
              const lineTotal = item.price * item.qty * (1 - item.discount / 100);
              return (
                <div key={item.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Package size={12} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground leading-tight truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.sku}</div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
                        <Minus size={11} />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold text-foreground">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-card border border-border flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors">
                        <Plus size={11} />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-foreground">{fmt(lineTotal)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border px-4 py-3 space-y-1.5 bg-muted/30">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal (excl. VAT)</span>
            <span>{fmt(subtotal - vat)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600">
              <span>Discount</span>
              <span>-{fmt(totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>VAT (16%)</span>
            <span>{fmt(vat)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{fmt(total)}</span>
          </div>
        </div>

        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">KES</span>
              <input
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                disabled={paymentMode === "MPESA"}
                className="w-full pl-10 pr-3 py-2 bg-muted rounded-lg text-sm font-semibold placeholder-muted-foreground border-0 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                placeholder="0.00"
              />
            </div>
            {paymentMode !== "MPESA" && balance > 0 && (
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Change</div>
                <div className="text-xs font-bold text-emerald-600">{fmt(balance)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "CASH", label: "Cash", icon: Banknote, color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
              { id: "MPESA", label: "M-Pesa", icon: Phone, color: "bg-green-600 hover:bg-green-700 text-white" },
              { id: "CARD", label: "Card", icon: CreditCard, color: "bg-violet-600 hover:bg-violet-700 text-white" },
              { id: "SPLIT", label: "Split", icon: Layers, color: "bg-amber-500 hover:bg-amber-600 text-white" },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => handlePaymentMode(btn.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${btn.color} ${paymentMode === btn.id ? "ring-2 ring-offset-1 ring-current scale-[0.98]" : ""}`}
              >
                <btn.icon size={13} />
                {btn.label}
              </button>
            ))}
          </div>

          {paymentMode === "MPESA" && (
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">+</span>
                <input
                  value={mpesaPhone}
                  onChange={e => setMpesaPhone(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-muted rounded-lg text-sm font-mono placeholder-muted-foreground border-0 outline-none focus:ring-2 focus:ring-green-500/20"
                  placeholder="254712345678"
                />
              </div>
              {mpesaError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle size={12} />
                  {mpesaError}
                </div>
              )}
            </div>
          )}

          <button
            onClick={completeSale}
            disabled={cart.length === 0 || submitting || (paymentMode === "MPESA" && !mpesaPhone)}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && mpesaStatus === "processing" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Waiting for M-Pesa...
              </>
            ) : submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                {paymentMode === "MPESA" ? `Pay with M-Pesa · ${fmt(total)}` : `Complete Sale · ${fmt(total)}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptView({ sale, cart, total, vat, paymentMode, mpesaStatus, onClose }: {
  sale: any; cart: CartItem[]; total: number; vat: number; paymentMode: string; mpesaStatus?: string | null; onClose: () => void;
}) {
  const invoiceNum = sale?.saleNumber || "N/A";
  const paymentRef = sale?.payments?.[0]?.reference || sale?.payment?.reference || "";
  const isMpesa = paymentMode === "MPESA";
  const paymentComplete = !isMpesa || mpesaStatus === "paid";

  return (
    <div className="flex h-full items-center justify-center bg-muted p-8">
      <div className="max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {paymentComplete ? (
              <CheckCircle2 size={18} className="text-emerald-600" />
            ) : (
              <Loader2 size={18} className="text-amber-500 animate-spin" />
            )}
            <h2 className="font-semibold text-foreground">
              {paymentComplete ? "Receipt" : "Processing Payment"}
            </h2>
          </div>
          <div className="flex gap-2">
            {[
              { icon: Printer, label: "Print" },
              { icon: Mail, label: "Email" },
              { icon: MessageSquare, label: "WhatsApp" },
              { icon: FileDown, label: "PDF" },
            ].map(a => (
              <button key={a.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card border border-border hover:bg-muted transition-colors text-muted-foreground">
                <a.icon size={12} /> {a.label}
              </button>
            ))}
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-blue-700 transition-colors">
              New Sale
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 font-mono text-sm">
          <div className="text-center mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-2">
              <Zap size={18} className="text-white" />
            </div>
            <div className="font-bold text-base text-slate-900">SwiftPOS Store</div>
            <div className="text-xs text-slate-500">Westlands, Nairobi</div>
          </div>

          <div className="border-t border-dashed border-slate-200 my-3" />

          <div className="space-y-1 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-semibold text-slate-900">{invoiceNum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="text-slate-700">{new Date().toLocaleDateString("en-KE")} {new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 my-3" />

          <div className="space-y-2 mb-3">
            {cart.map(item => {
              const lineTotal = item.price * item.qty * (1 - item.discount / 100);
              return (
                <div key={item.id}>
                  <div className="text-[11px] text-slate-700 font-medium leading-tight">{item.name}</div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">{item.qty} × KES {item.price}{item.vatRate > 0 ? " *" : ""}</span>
                    <span className="font-semibold text-slate-900">KES {lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-slate-200 my-3" />

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (excl. VAT)</span>
              <span>KES {(total - vat).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>VAT 16%</span>
              <span>KES {vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-900 mt-1 pt-1 border-t border-slate-200">
              <span>TOTAL</span>
              <span>KES {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Payment</span>
              <span>{paymentMode.toUpperCase()}{isMpesa && mpesaStatus === "paid" && paymentRef ? ` (${paymentRef})` : ""}</span>
            </div>
            {isMpesa && !paymentComplete && (
              <div className="flex items-center gap-1.5 text-amber-600 text-[11px] mt-1">
                <Loader2 size={11} className="animate-spin" />
                Awaiting M-Pesa confirmation...
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-200 my-3" />

          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
              <QrCode size={40} className="text-slate-400" />
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 space-y-0.5">
            <div>* VAT-able items</div>
            <div className="font-semibold text-slate-600">Thank you for shopping with us!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
