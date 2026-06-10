import { useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { useFoodMood } from "../context/FoodMoodContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Gift, MapPin, Clock, Users, Camera,
  CheckCircle2, ArrowLeft, Package, Search, Leaf
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

export function ShareFood() {
  const navigate = useNavigate();
  const { inventory } = useFoodMood();
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pickupTime, setPickupTime] = useState("flexible");
  const [pickupAddress, setPickupAddress] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = () => {
    if (!pickupAddress) {
      toast.error("Please provide a pickup address");
      return;
    }
    toast.success(`${selectedItems.length} item(s) listed on community marketplace!`);
    setSubmitted(true);
  };

  const pickupOptions = [
    { value: "flexible", label: "Flexible", icon: "🕐" },
    { value: "morning", label: "Morning (8-12)", icon: "🌅" },
    { value: "afternoon", label: "Afternoon (12-17)", icon: "☀️" },
    { value: "evening", label: "Evening (17-20)", icon: "🌆" },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <BottomNav />
        <main className="lg:ml-64 pb-20 lg:pb-6 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 max-w-md"
          >
            <div className="w-24 h-24 bg-[#B2D2A4]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-[#B2D2A4]" />
            </div>
            <h2 className="text-2xl font-bold text-[#4A5568] mb-3">
              Food Listed Successfully! 🎉
            </h2>
            <p className="text-[#4A5568]/60 mb-2">
              Your {selectedItems.length} item(s) are now visible to your community.
            </p>
            <p className="text-[#4A5568]/60 mb-8">
              You'll be notified when someone requests pickup.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568] rounded-xl"
                onClick={() => navigate("/community")}
              >
                View on Marketplace
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <BottomNav />

      <main className="lg:ml-64 pb-20 lg:pb-6">
        <div className="max-w-3xl mx-auto p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => (step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : navigate(-1))}
              className="flex items-center gap-2 text-[#4A5568]/60 hover:text-[#4A5568] mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <h1 className="text-3xl font-bold text-[#4A5568] mb-1">{t("pages.shareFood.title")}</h1>
            <p className="text-[#4A5568]/60">{t("pages.shareFood.subtitle")}</p>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { n: 1, label: "Select Items" },
              { n: 2, label: "Pickup Details" },
              { n: 3, label: "Review" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step === s.n
                        ? "bg-[#B2D2A4] text-[#4A5568]"
                        : step > s.n
                        ? "bg-[#4A5568] text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                  </div>
                  <span
                    className={`text-sm font-medium hidden md:block ${
                      step === s.n ? "text-[#4A5568]" : "text-[#4A5568]/40"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-gray-200" />}
              </div>
            ))}
          </div>

          {/* Step 1: Select items */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                <h2 className="font-bold text-[#4A5568] mb-4">Select items to share</h2>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]/40" />
                  <Input
                    placeholder="Search pantry items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 rounded-xl"
                  />
                </div>

                {filteredInventory.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-[#4A5568]/20 mx-auto mb-3" />
                    <p className="text-[#4A5568]/60">No items in your pantry</p>
                    <Button
                      className="mt-4 bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568] rounded-xl"
                      onClick={() => navigate("/scanner")}
                    >
                      Add Items via Scanner
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {filteredInventory.map((item) => {
                      const daysLeft = getDaysUntilExpiry(item.expiryDate);
                      const isSelected = selectedItems.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#B2D2A4] bg-[#B2D2A4]/5"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isSelected ? "bg-[#B2D2A4] border-[#B2D2A4]" : "border-gray-300"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className="font-medium text-[#4A5568]">{item.name}</p>
                              <p className="text-sm text-[#4A5568]/50">
                                {item.quantity} {item.unit} • {Math.round(item.price).toLocaleString('ru-RU')} ₸
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`${
                              daysLeft <= 2
                                ? "bg-red-100 text-red-500"
                                : daysLeft <= 5
                                ? "bg-amber-100 text-amber-600"
                                : "bg-[#B2D2A4]/20 text-[#4A5568]"
                            }`}
                          >
                            {daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Today" : `${daysLeft}d`}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-[#4A5568]/60">
                  {selectedItems.length > 0
                    ? `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} selected`
                    : "Select items to continue"}
                </p>
                <Button
                  onClick={() => setStep(2)}
                  disabled={selectedItems.length === 0}
                  className="bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568] rounded-xl px-8 disabled:opacity-40"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Pickup details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                <h2 className="font-bold text-[#4A5568] mb-6">Pickup Details</h2>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-[#4A5568] mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#B2D2A4]" />
                      Pickup Address
                    </label>
                    <Input
                      placeholder="123 Green Street, New York, NY"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-[#4A5568]/40 mt-1">
                      Only the neighborhood will be shown to other users
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#4A5568] mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#B2D2A4]" />
                      Available for Pickup
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {pickupOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setPickupTime(opt.value)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            pickupTime === opt.value
                              ? "border-[#B2D2A4] bg-[#B2D2A4]/10"
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <span className="text-lg mb-1 block">{opt.icon}</span>
                          <span className="text-sm font-medium text-[#4A5568]">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#4A5568] mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#B2D2A4]" />
                      Note for Requesters (optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Please bring your own bag, call before pickup..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#B2D2A4]/30 focus:border-[#B2D2A4] resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#4A5568] mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#B2D2A4]" />
                      Add Photo (optional)
                    </label>
                    <div
                      onClick={() => toast.info("Photo upload coming soon!")}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#B2D2A4] transition-colors"
                    >
                      <Camera className="w-8 h-8 text-[#4A5568]/30 mx-auto mb-2" />
                      <p className="text-sm text-[#4A5568]/50">Click to add a photo</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setStep(3)}
                  className="bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568] rounded-xl px-8"
                >
                  Review Listing
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="p-6 rounded-[24px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
                <h2 className="font-bold text-[#4A5568] mb-6">Review Your Listing</h2>

                <div className="space-y-5">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-xs font-semibold text-[#4A5568]/50 uppercase tracking-wide mb-3">
                      Items to Share ({selectedItems.length})
                    </p>
                    <div className="space-y-2">
                      {inventory
                        .filter((i) => selectedItems.includes(i.id))
                        .map((item) => (
                          <div key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Leaf className="w-4 h-4 text-[#B2D2A4]" />
                              <span className="text-sm font-medium text-[#4A5568]">{item.name}</span>
                            </div>
                            <span className="text-sm text-[#4A5568]/60">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <p className="text-xs font-semibold text-[#4A5568]/50 uppercase tracking-wide mb-3">
                      Pickup Details
                    </p>
                    <div className="space-y-2 text-sm text-[#4A5568]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#B2D2A4]" />
                        <span>{pickupAddress || "Address not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#B2D2A4]" />
                        <span>{pickupOptions.find((o) => o.value === pickupTime)?.label}</span>
                      </div>
                      {note && (
                        <div className="flex items-start gap-2">
                          <Users className="w-4 h-4 text-[#B2D2A4] mt-0.5" />
                          <span className="text-[#4A5568]/70">{note}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-[#B2D2A4]/10 rounded-2xl border border-[#B2D2A4]/20">
                    <p className="text-sm text-[#4A5568]">
                      🌿 By sharing this food, you'll help reduce waste and earn{" "}
                      <span className="font-semibold">+{selectedItems.length * 10} eco points</span>{" "}
                      in the community ranking!
                    </p>
                  </div>
                </div>
              </Card>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-xl flex-1"
                >
                  Edit Details
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568] rounded-xl flex-1"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  List on Marketplace
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
