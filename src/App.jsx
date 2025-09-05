import React, { useMemo, useState } from "react";

/**
 * Agronova — Blockchain-based Supply Management (Prototype)
 * Single-file React component with TailwindCSS classes only (no external UI libs).
 * Focus: user-friendly demo for SIH internal — Landing + Dashboards + Fake Block Explorer.
 *
 * Features:
 * - Simulated blockchain with pseudo-hashes.
 * - Stakeholder logins (Farmer, Consumer, Broker, Admin).
 * - QR code scanning simulation for product history.
 * - Admin monitoring of blockchain and users.
 * - Enhanced UI with animations, responsive design, and feedback.
 * - Fix: Ensure newly added products are visible when returning to views.
 */

// --- Utilities --------------------------------------------------------------
const nowISO = () => new Date().toISOString();

function pseudoHash(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return (
    h.toString(16).padStart(8, "0") + Math.random().toString(16).slice(2, 10)
  ).toUpperCase();
}

function makeBlock(prevHash, data) {
  const body = JSON.stringify(data);
  const hash = pseudoHash(prevHash + body + nowISO());
  return {
    index: 0,
    timestamp: nowISO(),
    prevHash,
    data,
    hash,
  };
}

function classNames(...c) {
  return c.filter(Boolean).join(" ");
}

// --- Demo Seeds -------------------------------------------------------------
const seedProducts = [
  {
    id: "AGR-1001",
    name: "Organic Tomatoes",
    quantityKg: 120,
    basePricePerKg: 28,
    farmer: { id: "F-001", name: "Ravi Kumar", village: "Narsinghpur" },
    status: "LISTED",
  },
  {
    id: "AGR-1002",
    name: "Basmati Rice",
    quantityKg: 500,
    basePricePerKg: 62,
    farmer: { id: "F-002", name: "Sita Devi", village: "Rewa" },
    status: "LISTED",
  },
];

const seedUsers = [
  { id: "F-001", username: "farmer1", password: "password1", role: "farmer", name: "Ravi Kumar", village: "Narsinghpur" },
  { id: "F-002", username: "farmer2", password: "password2", role: "farmer", name: "Sita Devi", village: "Rewa" },
  { id: "C-001", username: "consumer1", password: "password1", role: "consumer", name: "Anil Sharma" },
  { id: "B-001", username: "broker1", password: "password1", role: "broker", name: "GreenSupply Pvt Ltd" },
  { id: "A-001", username: "admin", password: "password", role: "admin", name: "Admin" },
];

// --- Core Component ---------------------------------------------------------
export default function AgronovaPrototype() {
  const [view, setView] = useState("login");
  const [products, setProducts] = useState(seedProducts);
  const [chain, setChain] = useState(() => {
    const genesis = {
      index: 0,
      timestamp: nowISO(),
      prevHash: "0xGENESIS",
      data: { type: "GENESIS", message: "Agronova Chain Initialized" },
      hash: pseudoHash("GENESIS"),
    };
    const seedBlocks = seedProducts.map((p, i, arr) => {
      const prev = i === 0 ? genesis.hash : arr[i - 1]._hashTemp || genesis.hash;
      const b = makeBlock(prev, { type: "LISTING", product: p, actor: p.farmer });
      b.index = i + 1;
      arr[i]._hashTemp = b.hash;
      return b;
    });
    return [genesis, ...seedBlocks];
  });
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  // --- Shared Helpers -------------------------------------------------------
  function appendBlock(data) {
    setChain((prev) => {
      const last = prev[prev.length - 1];
      const block = makeBlock(last.hash, data);
      block.index = last.index + 1;
      return [...prev, block];
    });
  }

  function listProduct({ id, name, quantityKg, basePricePerKg, farmer }) {
    const newProd = {
      id,
      name,
      quantityKg: Number(quantityKg),
      basePricePerKg: Number(basePricePerKg),
      farmer: { ...farmer, id: user.id }, // Ensure farmer.id matches logged-in user
      status: "LISTED",
    };
    setProducts((prev) => {
      const updatedProducts = [newProd, ...prev];
      console.log("Updated products:", updatedProducts); // Debug log
      return updatedProducts;
    });
    appendBlock({ type: "LISTING", product: newProd, actor: { ...farmer, id: user.id } });
    setToast({ message: "Product listed successfully!", type: "success" });
    setTimeout(() => setToast(null), 3000);
  }

  function orderProduct({ productId, broker }) {
    if (!window.confirm("Confirm order placement?")) return;
    setProducts((prev) => {
      const updatedProducts = prev.map((p) =>
        p.id === productId ? { ...p, status: "SOLD", broker } : p
      );
      console.log("Updated products after order:", updatedProducts); // Debug log
      return updatedProducts;
    });
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    appendBlock({
      type: "TRANSFER",
      product: { id: prod.id, name: prod.name, quantityKg: prod.quantityKg },
      from: prod.farmer,
      to: broker,
      pricePerKg: prod.basePricePerKg,
    });
    setToast({ message: "Order placed successfully!", type: "success" });
    setTimeout(() => setToast(null), 3000);
  }

  const stats = useMemo(() => {
    const total = products.length;
    const sold = products.filter((p) => p.status === "SOLD").length;
    const listed = total - sold;
    return { total, sold, listed };
  }, [products]);

  // --- UI Pieces ------------------------------------------------------------
  const Nav = () => {
    if (view === "login") return null;
    return (
      <div className="w-full sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/80 bg-white/95 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer transform hover:scale-105 transition" onClick={() => setView("landing")}>
            <img src="/logo.jpeg" alt="Agronova Logo" className="w-10 h-10 rounded-full object-cover border border-green-200" />
            <span className="font-semibold text-xl tracking-tight text-green-700">Agronova</span>
          </div>
          <div className="ml-auto flex flex-wrap justify-center gap-2 text-sm">
            {["landing", user?.role, "explorer"].filter(Boolean).map((r) => (
              <button
                key={r}
                onClick={() => setView(r)}
                className={classNames(
                  "px-4 py-2 rounded-full border border-gray-300 transition-all duration-200",
                  view === r ? "bg-green-600 text-white border-green-600" : "text-gray-700 hover:bg-green-100 hover:border-green-400"
                )}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
            {user?.role === "admin" && (
              <button
                onClick={() => setView("admin")}
                className={classNames(
                  "px-4 py-2 rounded-full border border-gray-300 transition-all duration-200",
                  view === "admin" ? "bg-green-600 text-white border-green-600" : "text-gray-700 hover:bg-green-100 hover:border-green-400"
                )}
              >
                Admin
              </button>
            )}
            <button
              onClick={() => {
                setUser(null);
                setView("login");
                setToast({ message: "Logged out successfully!", type: "success" });
                setTimeout(() => setToast(null), 3000);
              }}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-red-100 hover:border-red-400 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SectionCard = ({ title, subtitle, children, aside }) => (
    <div className="w-full grid md:grid-cols-3 gap-4 animate-fade-in">
      <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
        <div>{children}</div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">{aside}</div>
    </div>
  );

  // --- Views ----------------------------------------------------------------
  const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("farmer");
    const [error, setError] = useState("");

    const handleLogin = () => {
      const foundUser = seedUsers.find(
        (u) => u.username === username && u.password === password && u.role === role
      );
      if (foundUser) {
        setUser(foundUser);
        setView(foundUser.role);
        setToast({ message: `Logged in as ${foundUser.name}!`, type: "success" });
        setTimeout(() => setToast(null), 3000);
        setUsername("");
        setPassword("");
        setError("");
      } else {
        setError("Invalid credentials or role");
        setToast({ message: "Login failed!", type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    };

    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-20">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-fade-in">
          <div className="flex justify-center mb-4">
            <img src="/logo.jpeg" alt="Agronova Logo" className="w-16 h-16 rounded-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Login to Agronova</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Role</label>
              <select
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-300"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {["farmer", "consumer", "broker", "admin"].map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Username</label>
              <input
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., farmer1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Password</label>
              <input
                type="password"
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              onClick={handleLogin}
              className="w-full px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 transition-all duration-200"
              disabled={!username || !password}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Landing = () => (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10 bg-gradient-to-b from-green-100 to-green-50">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-gray-900">
            Blockchain Transparency for India’s Agriculture Supply Chain
          </h1>
          <p className="mt-4 text-gray-600 text-lg leading-relaxed">
            Agronova ensures every handoff—from farmer to consumer—is tamper-proof,
            traceable, and fair. Perfect for SIH demos: list produce, place orders,
            and verify provenance in minutes.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
            {["farmer", "consumer", "broker", "explorer"].filter(r => r === user?.role || r === "explorer").map((r) => (
              <button
                key={r}
                onClick={() => setView(r)}
                className="px-6 py-3 rounded-xl border border-gray-300 bg-green-50 text-green-700 hover:bg-green-100 transition-all duration-200"
              >
                {r === "farmer" && "Farmer Dashboard"}
                {r === "consumer" && "Consumer Traceability"}
                {r === "broker" && "Broker Dashboard"}
                {r === "explorer" && "Block Explorer"}
              </button>
            ))}
            {user?.role === "admin" && (
              <button
                onClick={() => setView("admin")}
                className="px-6 py-3 rounded-xl border border-gray-300 bg-green-50 text-green-700 hover:bg-green-100 transition-all duration-200"
              >
                Admin Dashboard
              </button>
            )}
          </div>
          <div className="mt-6 text-sm text-gray-500">
            Team <span className="font-medium">Agronova</span> • SIH Prototype • No wallet required
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 flex justify-center animate-fade-in">
          <img src="/blockchain.png" alt="Blockchain Illustration" className="max-w-full h-auto max-h-64 object-contain" loading="lazy" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <KPICard label="Products" value={stats.total} icon="/blockchain.png" />
        <KPICard label="Listed" value={stats.listed} icon="/farmer.png" />
        <KPICard label="Sold" value={stats.sold} icon="/blockchain.png" />
      </div>
    </div>
  );

  function KPICard({ label, value, icon }) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-4 transform hover:scale-105 transition-all duration-200 animate-fade-in">
        {icon && <img src={icon} alt={label} className="w-10 h-10 object-contain" loading="lazy" />}
        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
      </div>
    );
  }

  const Farmer = () => {
    if (user?.role !== "farmer") return <div className="max-w-6xl mx-auto px-4 py-10 text-red-500">Access denied. Please log in as a farmer.</div>;
    const [form, setForm] = useState({
      id: `AGR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      quantityKg: "",
      basePricePerKg: "",
      farmerName: user.name,
      village: user.village || "",
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
      const newErrors = {};
      if (!form.name) newErrors.name = "Product name is required";
      if (!form.quantityKg || form.quantityKg <= 0) newErrors.quantityKg = "Valid quantity is required";
      if (!form.basePricePerKg || form.basePricePerKg <= 0) newErrors.basePricePerKg = "Valid price is required";
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <SectionCard
          title="Farmer — List Produce"
          subtitle="Create a tamper-proof listing stored on the blockchain."
          aside={
            <div className="flex flex-col gap-4">
              <HelpBox
                title="Tip for Judges"
                items={[
                  "Every listing becomes an immutable block.",
                  "Prices recorded transparently reduce middlemen manipulation.",
                  "Farmer-friendly UI with minimal fields.",
                ]}
              />
              <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 flex justify-center">
                <img src="/farmer.png" alt="Farmer Illustration" className="max-w-full h-auto max-h-48 object-contain border border-green-200 rounded-lg" loading="lazy" />
              </div>
            </div>
          }
        >
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ["Product ID", "id", true],
              ["Product Name", "name"],
              ["Quantity (Kg)", "quantityKg"],
              ["Base Price / Kg (₹)", "basePricePerKg"],
              ["Farmer Name", "farmerName", true],
              ["Village", "village"],
            ].map(([label, key, disabled]) => (
              <div key={key} className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">{label}</label>
                <input
                  className={classNames(
                    "border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300",
                    errors[key] ? "border-red-300" : "border-gray-300"
                  )}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={label}
                  disabled={disabled}
                />
                {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                if (!validateForm()) return;
                listProduct({
                  id: form.id,
                  name: form.name,
                  quantityKg: form.quantityKg,
                  basePricePerKg: form.basePricePerKg,
                  farmer: { id: user.id, name: form.farmerName, village: form.village || "—" },
                });
                setForm({
                  id: `AGR-${Math.floor(1000 + Math.random() * 9000)}`,
                  name: "",
                  quantityKg: "",
                  basePricePerKg: "",
                  farmerName: user.name,
                  village: user.village || "",
                });
                setErrors({});
              }}
              className="px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 transition-all duration-200"
              disabled={!form.name || !form.quantityKg || !form.basePricePerKg}
            >
              Upload to Blockchain
            </button>
            <button onClick={() => setView("explorer")} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-green-100 transition-all duration-200">
              View Blocks
            </button>
          </div>

          <div className="mt-8">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Your Recent Listings</h3>
            <SimpleTable
              columns={["ID", "Name", "Qty (Kg)", "Price/Kg", "Status"]}
              rows={products
                .filter((p) => p.farmer?.id === user.id)
                .map((p) => [p.id, p.name, p.quantityKg, `₹${p.basePricePerKg}`, p.status])}
            />
          </div>
        </SectionCard>
      </div>
    );
  };

  const Broker = () => {
    if (user?.role !== "broker") return <div className="max-w-6xl mx-auto px-4 py-10 text-red-500">Access denied. Please log in as a broker.</div>;
    const [broker, setBroker] = useState({ id: user.id, name: user.name });
    const available = products.filter((p) => p.status === "LISTED");

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <SectionCard
          title="Broker — Order Produce"
          subtitle="Place an order; the ownership transfer is recorded as a new block."
          aside={
            <div className="flex flex-col gap-4">
              <HelpBox
                title="What’s Recorded"
                items={["Product ID & name", "From farmer → to broker", "Price per Kg & quantity", "Timestamp & hashes"]}
              />
              <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 flex justify-center">
                <img src="/farmer.png" alt="Broker Illustration" className="max-w-full h-auto max-h-48 object-contain border border-green-200 rounded-lg" loading="lazy" />
              </div>
            </div>
          }
        >
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Broker Name</label>
                <input
                  className="border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
                  value={broker.name}
                  onChange={(e) => setBroker({ ...broker, name: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Select a product below and click <span className="font-medium">Order</span>.
                </div>
              </div>
            </div>
            <div className="mt-6">
              <SimpleTable
                columns={["ID", "Product", "Qty (Kg)", "Price/Kg", "Action"]}
                rows={available.map((p) => [
                  p.id,
                  p.name,
                  p.quantityKg,
                  `₹${p.basePricePerKg}`,
                  <button
                    key={p.id}
                    onClick={() => orderProduct({ productId: p.id, broker })}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all duration-200"
                  >
                    Order
                  </button>,
                ])}
              />
            </div>
          </div>
        </SectionCard>
      </div>
    );
  };

  const Consumer = () => {
    if (user?.role !== "consumer") return <div className="max-w-6xl mx-auto px-4 py-10 text-red-500">Access denied. Please log in as a consumer.</div>;
    const [query, setQuery] = useState("");
    const record = useMemo(() => {
      if (!query) return null;
      const related = chain.filter((b) => b.data?.product?.id === query);
      if (!related.length) return null;
      const listing = related.find((b) => b.data?.type === "LISTING");
      const transfer = related.find((b) => b.data?.type === "TRANSFER");
      return { listing, transfer };
    }, [query, chain]);

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <SectionCard
          title="Consumer — Verify Origin (QR/ID)"
          subtitle="Scan the QR code or enter the Product ID to trace the product’s history."
          aside={<HelpBox title="What you’ll see" items={["Farmer & village", "Harvest listing details", "Broker handoff", "Block hashes for trust"]} />}
        >
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">Product ID</label>
              <input
                className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="e.g., AGR-1001"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all duration-200"
                onClick={() => {
                  setQuery("AGR-1001");
                  setToast({ message: "QR code scanned!", type: "success" });
                  setTimeout(() => setToast(null), 3000);
                }}
              >
                Scan QR Code
              </button>
              <button
                className="px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all duration-200"
                onClick={() => setQuery(query.trim())}
              >
                Search
              </button>
            </div>
          </div>

          {record ? (
            <div className="mt-6 grid md:grid-cols-2 gap-4 animate-fade-in">
              {record.listing && (
                <div className="border border-gray-200 rounded-2xl p-6 bg-white">
                  <h4 className="font-semibold text-lg text-gray-800 mb-2">Listing (on-chain)</h4>
                  <DetailRow label="Product" value={record.listing.data.product.name} />
                  <DetailRow label="Qty" value={`${record.listing.data.product.quantityKg} Kg`} />
                  <DetailRow label="Price/Kg" value={`₹${record.listing.data.product.basePricePerKg}`} />
                  <DetailRow label="Farmer" value={`${record.listing.data.actor.name} (${record.listing.data.actor.village})`} />
                  <DetailRow label="Block Hash" value={record.listing.hash} mono />
                </div>
              )}
              {record.transfer ? (
                <div className="border border-gray-200 rounded-2xl p-6 bg-white">
                  <h4 className="font-semibold text-lg text-gray-800 mb-2">Transfer (on-chain)</h4>
                  <DetailRow label="From" value={`${record.transfer.data.from.name}`} />
                  <DetailRow label="To" value={`${record.transfer.data.to.name}`} />
                  <DetailRow label="Price/Kg" value={`₹${record.transfer.data.pricePerKg}`} />
                  <DetailRow label="Block Hash" value={record.transfer.hash} mono />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-2xl p-6 text-gray-600 bg-white">No transfer recorded yet — product might still be with the farmer.</div>
              )}
            </div>
          ) : (
            <div className="mt-6 text-gray-600">Enter a valid Product ID or scan the QR code to view provenance. Try <span className="font-medium">AGR-1001</span>.</div>
          )}
        </SectionCard>
      </div>
    );
  };

  const Admin = () => {
    if (user?.role !== "admin") return <div className="max-w-6xl mx-auto px-4 py-10 text-red-500">Access denied. Please log in as an admin.</div>;
    const [filterRole, setFilterRole] = useState("all");
    const filteredChain = useMemo(() => {
      if (filterRole === "all") return chain;
      return chain.filter((b) => {
        if (b.data?.type === "GENESIS") return true;
        if (filterRole === "farmer") return b.data?.actor?.id.startsWith("F-");
        if (filterRole === "broker") return b.data?.to?.id.startsWith("B-");
        return false;
      });
    }, [filterRole, chain]);

    const resetBlockchain = () => {
      if (!window.confirm("Reset the blockchain? This will clear all products and blocks.")) return;
      const genesis = {
        index: 0,
        timestamp: nowISO(),
        prevHash: "0xGENESIS",
        data: { type: "GENESIS", message: "Agronova Chain Initialized" },
        hash: pseudoHash("GENESIS"),
      };
      setChain([genesis]);
      setProducts([]);
      setToast({ message: "Blockchain reset successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    };

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <SectionCard
          title="Admin — Oversight & Analytics"
          subtitle="Monitor blockchain activities and manage users."
          aside={<HelpBox title="Insights" items={[`Total products: ${stats.total}`, `Listed: ${stats.listed}`, `Sold: ${stats.sold}`]} />}
        >
          <div className="grid sm:grid-cols-3 gap-4">
            <KPICard label="Total Products" value={stats.total} icon="/blockchain.png" />
            <KPICard label="Listed" value={stats.listed} icon="/farmer.png" />
            <KPICard label="Sold" value={stats.sold} icon="/blockchain.png" />
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={resetBlockchain}
              className="px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
            >
              Reset Blockchain
            </button>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">User Management</h3>
            <SimpleTable
              columns={["ID", "Name", "Role", "Username"]}
              rows={seedUsers.map((u) => [u.id, u.name, u.role.charAt(0).toUpperCase() + u.role.slice(1), u.username])}
            />
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Blockchain Activity</h3>
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-1 block">Filter by Role</label>
              <select
                className="border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All</option>
                <option value="farmer">Farmer</option>
                <option value="broker">Broker</option>
              </select>
            </div>
            <SimpleTable
              columns={["#", "Type", "When", "Hash"]}
              rows={filteredChain.map((b) => [
                b.index,
                b.data?.type || "—",
                new Date(b.timestamp).toLocaleString(),
                <code key={b.hash} className="text-xs break-all">{b.hash}</code>,
              ])}
            />
          </div>
        </SectionCard>
      </div>
    );
  };

  const Explorer = () => {
    const [expanded, setExpanded] = useState(null);

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1 tracking-tight">Block Explorer</h2>
          <p className="text-sm text-gray-500 mb-4">Each action becomes a new block chained by hashes.</p>
          <div className="space-y-4">
            {chain.map((b) => (
              <div key={b.hash} className="border border-gray-200 rounded-2xl p-4 bg-white">
                <div
                  className="flex flex-wrap gap-3 items-center text-sm mb-2 cursor-pointer"
                  onClick={() => setExpanded(expanded === b.hash ? null : b.hash)}
                >
                  <span className="px-3 py-1 rounded-full border border-gray-300 bg-green-50">Index: {b.index}</span>
                  <span className="px-3 py-1 rounded-full border border-gray-300 bg-green-50">Type: {b.data?.type || "—"}</span>
                  <span className="px-3 py-1 rounded-full border border-gray-300 bg-green-50">Time: {new Date(b.timestamp).toLocaleString()}</span>
                </div>
                {expanded === b.hash && (
                  <div className="grid md:grid-cols-2 gap-3 animate-fade-in">
                    <div className="text-sm">
                      <div className="text-gray-600 font-medium">Data</div>
                      <pre className="mt-1 bg-gray-50 p-4 rounded-xl overflow-auto text-[12px]">{JSON.stringify(b.data, null, 2)}</pre>
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-600 font-medium">Hash</div>
                      <code className="mt-1 block break-all bg-gray-50 p-4 rounded-xl text-[12px]">{b.hash}</code>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- Small Components -----------------------------------------------------
  function HelpBox({ title, items }) {
    return (
      <div>
        <div className="font-semibold text-gray-800 mb-2">{title}</div>
        <ul className="list-disc ml-5 space-y-1 text-sm text-gray-600">
          {items.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      </div>
    );
  }

  function SimpleTable({ columns, rows }) {
    return (
      <div className="overflow-auto border border-gray-200 rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-green-50">
            <tr>
              {columns.map((c) => (
                <th key={c} className="text-left px-4 py-3 font-medium text-gray-700 border-b border-gray-200">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-green-50 hover:bg-green-100 transition-all duration-150">
                  {r.map((cell, j) => (
                    <td key={j} className="px-4 py-3 border-b border-gray-200 align-top">{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={columns.length}>
                  No data available. Try listing a product or check your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function DetailRow({ label, value, mono = false }) {
    return (
      <div className="flex justify-between gap-3 py-1 text-sm">
        <div className="text-gray-600 font-medium">{label}</div>
        <div className={classNames("text-right", mono && "font-mono text-[12px] text-gray-700")}>{value}</div>
      </div>
    );
  }

  function Toast() {
    if (!toast) return null;
    return (
      <div className={classNames(
        "fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white animate-fade-in",
        toast.type === "success" ? "bg-green-600" : "bg-red-600"
      )}>
        {toast.message}
      </div>
    );
  }

  // --- Render ---------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }
        `}
      </style>
      <Nav />
      <Toast />
      {view === "login" && <Login />}
      {view === "landing" && <Landing />}
      {view === "farmer" && <Farmer />}
      {view === "broker" && <Broker />}
      {view === "consumer" && <Consumer />}
      {view === "admin" && <Admin />}
      {view === "explorer" && <Explorer />}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center text-xs text-gray-500">
        Built for SIH internal demo • Team Agronova — This is a prototype; hashes are simulated.
      </footer>
    </div>
  );
}