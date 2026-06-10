# Frontend integration

Three steps. After this, the React app talks to the real backend instead of localStorage mocks.

## 1. Drop in the API client

Copy `api.ts` to the frontend repo at:

```
src/lib/api.ts
```

Add to the frontend's `.env` (create if missing):

```
VITE_API_URL=http://localhost:4000
```

## 2. Login.tsx — replace `setTimeout` with real auth

In `src/app/pages/Login.tsx`, replace `handleLogin`:

```ts
import { api } from "../../lib/api";

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!loginEmail || !loginPassword) {
    toast.error("Please fill in all fields");
    return;
  }
  setLoginLoading(true);
  try {
    await api.login({ email: loginEmail, password: loginPassword });
    toast.success("Welcome back to FoodMood!");
    navigate("/dashboard");
  } catch (err: any) {
    toast.error(err.message || "Login failed");
  } finally {
    setLoginLoading(false);
  }
};
```

And `handleSignup`:

```ts
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  // ... validation unchanged ...
  setSignupLoading(true);
  try {
    await api.register({ name: signupName, email: signupEmail, password: signupPassword });
    toast.success("Account created! Welcome to FoodMood 🌿");
    navigate("/dashboard");
  } catch (err: any) {
    toast.error(err.message || "Sign up failed");
  } finally {
    setSignupLoading(false);
  }
};
```

## 3. FoodMoodContext.tsx — load from backend

Replace the `useState` initial-from-localStorage blocks with `useEffect` fetches:

```ts
import { api } from "../../lib/api";

const [inventory, setInventory] = useState<FoodItem[]>([]);
const [recipes, setRecipes] = useState<Recipe[]>([]);
const [userStats, setUserStats] = useState<UserStats>({
  foodSavedKg: 0, co2Offset: 0, moneySaved: 0, wasteWarriorLevel: 1,
});
const [userName, setUserName] = useState("");

useEffect(() => {
  if (!localStorage.getItem("foodmood_token")) return;
  Promise.all([api.me(), api.listInventory(), api.recommendRecipes(), api.stats()])
    .then(([me, inv, rec, st]) => {
      setUserName(me.user.name);
      setUserStats(st.stats);
      setInventory(inv.items as FoodItem[]);
      setRecipes(rec.recipes as Recipe[]);
    })
    .catch(console.error);
}, []);

const addItem = async (item: FoodItem) => {
  const { item: saved } = await api.addItem(item);
  setInventory((prev) => [...prev, saved as FoodItem]);
};

const updateItem = async (id: string, updates: Partial<FoodItem>) => {
  const { item: saved } = await api.updateItem(id, updates);
  setInventory((prev) => prev.map((i) => (i.id === id ? (saved as FoodItem) : i)));
};

const removeItem = async (id: string) => {
  await api.removeItem(id);
  setInventory((prev) => prev.filter((i) => i.id !== id));
};

const consumeItem = async (id: string) => {
  const { stats } = await api.consumeItem(id);
  setUserStats(stats);
  setInventory((prev) => prev.filter((i) => i.id !== id));
};

const discardItem = async (id: string) => {
  await api.discardItem(id);
  setInventory((prev) => prev.filter((i) => i.id !== id));
};

const shareItem = async (id: string) => {
  const { stats } = await api.shareItem(id);
  setUserStats(stats);
  setInventory((prev) => prev.filter((i) => i.id !== id));
};

const useRecipe = async (recipeId: string) => {
  const { stats } = await api.useRecipe(recipeId);
  setUserStats(stats);
  const { items } = await api.listInventory();
  setInventory(items as FoodItem[]);
};
```

You can delete both `localStorage.setItem` `useEffect`s — the backend is now the source of truth.

## 4. Scanner.tsx — real OCR

```ts
import { api } from "../../lib/api";

const fileInputRef = useRef<HTMLInputElement>(null);

const handleFile = async (file: File) => {
  setScanning(true);
  try {
    const { items: parsed } = await api.scanReceipt(file);
    setItems(parsed);
    setScanned(true);
    toast.success("Receipt scanned successfully!");
  } catch (err: any) {
    toast.error(err.message || "Scan failed");
  } finally {
    setScanning(false);
  }
};

// Wire up the existing buttons:
<Button onClick={() => fileInputRef.current?.click()}>Upload Image</Button>
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  capture="environment"
  hidden
  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
/>
```

And in `handleAddToPantry`, replace the loop of `addItem` with a single batch insert:

```ts
const handleAddToPantry = async () => {
  await api.addItemsBatch(items.map((it) => ({
    name: it.name,
    category: "Other",
    quantity: 1,
    unit: "pcs",
    price: parseFloat(it.price),
    expiryDate: it.expiryDate,
    addedDate: new Date().toISOString().split("T")[0],
  })));
  toast.success(`${items.length} items added to pantry!`);
  navigate("/pantry");
};
```

That's it. Defense-ready.
