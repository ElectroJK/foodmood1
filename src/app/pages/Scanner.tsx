import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { useFoodMood } from "../context/FoodMoodContext";
import { api } from "../../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Camera, Upload, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

// Tenge-aware scanned item shape. The OCR service converts every price to
// integer KZT and (optionally) attaches the original value/currency so we can
// show e.g. "was $3.49" under the converted field.
interface ScannedItem {
  name: string;
  price: string;
  expiryDate: string;
  confidence: number;
  currency?: string;
  originalPrice?: string;
  originalCurrency?: string;
  category?: string;
  quantity?: number;
  unit?: string;
}

// Currency symbols for the "was X" hint under each converted price.
const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  RUB: "₽",
  EUR: "€",
  KZT: "₸",
};

export function Scanner() {
  const navigate = useNavigate();
  const { refresh } = useFoodMood();
  const { t } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Two hidden inputs: one for the camera (mobile), one for file picker.
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setScanning(true);
    try {
      const parsed: any = await api.scanReceipt(file);
      const arr = Array.isArray(parsed?.items)
        ? parsed.items
        : Array.isArray(parsed)
        ? parsed
        : [];
      if (arr.length === 0) {
        toast.error(parsed?.error || t("pages.scanner.couldNotRead", "Couldn't read any food items from the receipt. Try a clearer photo."));
        setScanning(false);
        return;
      }
      setItems(arr);
      setScanned(true);
      const filteredOut = Number(parsed.filteredOutCount) || 0;
      if (filteredOut > 0) {
        toast.success(t("pages.scanner.receiptScannedFiltered", "Receipt scanned. AI filtered out {count} non-food item(s) automatically.").replace("{count}", String(filteredOut)));
      } else {
        toast.success(t("pages.scanner.receiptScannedFound", "Receipt scanned — found {count} items").replace("{count}", String(parsed.items?.length || 0)));
      }
    } catch (err: any) {
      toast.error(err?.message || t("pages.scanner.scanFailed", "Scan failed"));
    } finally {
      setScanning(false);
    }
  };

  const onCameraClick = () => cameraInputRef.current?.click();
  const onUploadClick = () => fileInputRef.current?.click();

  const handleItemChange = (index: number, field: keyof ScannedItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as ScannedItem;
    setItems(newItems);
  };

  // Tenge prices are whole integers — sanitize on change.
  const handlePriceChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^\d]/g, "");
    handleItemChange(index, "price", cleaned);
  };

  // Default expiry — one week from today, so a freshly typed item still has
  // a sensible date until the user picks one explicitly.
  const defaultExpiryISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };

  const handleAddBlankItem = () => {
    setItems([
      ...items,
      {
        name: "",
        price: "0",
        expiryDate: defaultExpiryISO(),
        confidence: 100, // manual entry — full trust
        category: "Other",
        quantity: 1,
        unit: "pcs",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Empty-state shortcut: lets the user jump straight to manual entry without
  // scanning a receipt at all.
  const handleStartManualEntry = () => {
    setItems([
      {
        name: "",
        price: "0",
        expiryDate: defaultExpiryISO(),
        confidence: 100,
        category: "Other",
        quantity: 1,
        unit: "pcs",
      },
    ]);
    setScanned(true);
  };

  const handleAddToPantry = async () => {
    // Drop empty rows the user may have added but not filled in.
    const validItems = items.filter((it) => it.name.trim().length > 0);
    if (validItems.length === 0) {
      toast.error(t("pages.scanner.addNameBeforeSaving", "Add at least one item with a name before saving."));
      return;
    }
    setSaving(true);
    try {
      await api.addItemsBatch(
        validItems.map((item) => ({
          name: item.name.trim(),
          category: item.category || "Other",
          quantity: item.quantity || 1,
          unit: item.unit || "pcs",
          price: parseInt(item.price, 10) || 0,
          expiryDate: item.expiryDate,
          addedDate: new Date().toISOString().split("T")[0],
        })) as any
      );
      await refresh();
      toast.success(`${items.length} ${t("pages.scanner.itemsAdded", "items added to pantry!")}`);
      navigate("/pantry");
    } catch (err: any) {
      toast.error(err?.message || t("pages.scanner.saveFailed", "Failed to save items"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <BottomNav />

      {/* Hidden inputs — wired to the visible buttons */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <main className="lg:ml-64 pb-20 lg:pb-6">
        <div className="max-w-7xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-[#4A5568] mb-2">{t("pages.scanner.title")}</h1>
            <p className="text-[#4A5568]/60 mb-6">{t("pages.scanner.subtitle")}</p>
          </motion.div>

          {!scanned ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload/Scan Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-8">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-6 bg-[#B2D2A4]/10 rounded-full flex items-center justify-center">
                      {scanning ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Camera className="w-16 h-16 text-[#B2D2A4]" />
                        </motion.div>
                      ) : (
                        <Upload className="w-16 h-16 text-[#B2D2A4]" />
                      )}
                    </div>

                    <h2 className="text-2xl font-semibold text-[#4A5568] mb-4">
                      {scanning ? t("pages.scanner.scanningReceipt", "Scanning Receipt...") : t("pages.scanner.uploadReceipt", "Upload Receipt")}
                    </h2>

                    <p className="text-[#4A5568]/60 mb-6">
                      {scanning
                        ? t("pages.scanner.analyzing", "Our AI is analyzing your receipt...")
                        : t("pages.scanner.uploadHint", "Take a photo or upload an image of your grocery receipt")}
                    </p>

                    {!scanning && (
                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={onCameraClick}
                          className="bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568]"
                          size="lg"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          {t("pages.scanner.takePhoto", "Take Photo")}
                        </Button>
                        <Button
                          onClick={onUploadClick}
                          variant="outline"
                          size="lg"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          {t("pages.scanner.uploadImage", "Upload Image")}
                        </Button>
                        <Button
                          onClick={handleStartManualEntry}
                          variant="ghost"
                          size="lg"
                          className="text-[#4A5568]/70 hover:text-[#4A5568]"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          {t("pages.scanner.enterManually", "Enter Items Manually")}
                        </Button>
                      </div>
                    )}

                    {scanning && (
                      <div className="mt-6">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#B2D2A4]"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 8 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Info Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-8 h-full">
                  <h3 className="text-xl font-semibold text-[#4A5568] mb-4">
                    {t("pages.scanner.howItWorks", "How it works")}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#B2D2A4] text-white flex items-center justify-center flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium text-[#4A5568] mb-1">{t("pages.scanner.stepCaptureTitle", "Capture Receipt")}</h4>
                        <p className="text-sm text-[#4A5568]/60">
                          {t("pages.scanner.stepCaptureText", "Take a clear photo of your grocery receipt")}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#B2D2A4] text-white flex items-center justify-center flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium text-[#4A5568] mb-1">{t("pages.scanner.stepAiTitle", "AI Recognition")}</h4>
                        <p className="text-sm text-[#4A5568]/60">
                          {t("pages.scanner.stepAiText", "Our smart OCR extracts item names, prices, and dates")}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#B2D2A4] text-white flex items-center justify-center flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium text-[#4A5568] mb-1">{t("pages.scanner.stepConvertTitle", "Auto-converted to ₸")}</h4>
                        <p className="text-sm text-[#4A5568]/60">
                          {t("pages.scanner.stepConvertText", "Prices in USD or RUB are converted to tenge automatically using live rates")}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#B2D2A4] text-white flex items-center justify-center flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium text-[#4A5568] mb-1">{t("pages.scanner.stepTrackTitle", "Track Everything")}</h4>
                        <p className="text-sm text-[#4A5568]/60">
                          {t("pages.scanner.stepTrackText", "Items are automatically tracked with expiry reminders")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#4A5568]">
                    {t("pages.scanner.verifyItems", "Verify Scanned Items")}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleAddBlankItem}
                      variant="outline"
                      size="sm"
                      className="border-[#B2D2A4] text-[#4A5568] hover:bg-[#B2D2A4]/10"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t("pages.scanner.addItem", "Add Item")}
                    </Button>
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      {t("pages.scanner.scanComplete", "Scan Complete")}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {items.map((item, index) => {
                    const wasConverted =
                      !!item.originalCurrency &&
                      item.originalCurrency !== "KZT" &&
                      !!item.originalPrice;
                    const symbol = wasConverted
                      ? CURRENCY_SYMBOL[item.originalCurrency as string] || ""
                      : "";
                    return (
                      <div
                        key={index}
                        className="p-4 border rounded-xl hover:border-[#B2D2A4] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-[#4A5568]">
                            {t("pages.scanner.item", "Item")} {index + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                item.confidence < 85
                                  ? "border-amber-500 text-amber-500"
                                  : "border-green-500 text-green-500"
                              }
                            >
                              {item.confidence < 85 && (
                                <AlertCircle className="w-3 h-3 mr-1" />
                              )}
                              {item.confidence}% {t("pages.scanner.confidence", "confidence")}
                            </Badge>
                            <Button
                              onClick={() => handleRemoveItem(index)}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              aria-label={`Remove item ${index + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-[#4A5568]/60 mb-1 block">
                              {t("pages.scanner.itemName", "Item Name")}
                            </label>
                            <Input
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(index, "name", e.target.value)
                              }
                              className={
                                item.confidence < 85 ? "border-amber-500" : ""
                              }
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#4A5568]/60 mb-1 block">
                              {t("pages.scanner.priceKzt", "Price (₸)")}
                            </label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              step="1"
                              min="0"
                              value={item.price}
                              onChange={(e) =>
                                handlePriceChange(index, e.target.value)
                              }
                            />
                            {wasConverted && (
                              <p className="text-[10px] text-[#4A5568]/50 mt-1">
                                {t("pages.scanner.was", "was")} {symbol}
                                {item.originalPrice}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-[#4A5568]/60 mb-1 block">
                              {t("pages.scanner.expiryDate", "Expiry Date")}
                            </label>
                            <Input
                              type="date"
                              value={item.expiryDate}
                              onChange={(e) =>
                                handleItemChange(index, "expiryDate", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToPantry}
                    disabled={saving}
                    className="flex-1 bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568]"
                    size="lg"
                  >
                    {saving ? t("pages.scanner.saving", "Saving...") : t("pages.scanner.addItemsButton", "Add {count} Items to Pantry").replace("{count}", String(items.length))}
                  </Button>
                  <Button
                    onClick={() => { setScanned(false); setItems([]); }}
                    variant="outline"
                    size="lg"
                  >
                    {t("pages.scanner.scanAgain", "Scan Again")}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
