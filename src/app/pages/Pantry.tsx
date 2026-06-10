import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { useFoodMood } from "../context/FoodMoodContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Search, Check, Trash2, Gift, Plus } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

export function Pantry() {
  const { inventory, consumeItem, discardItem, shareItem } = useFoodMood();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = [
    { value: "All", label: t("pages.pantry.all", "All") },
    { value: "Dairy", label: t("pages.pantry.dairy", "Dairy") },
    { value: "Meat", label: t("pages.pantry.meat", "Meat") },
    { value: "Veggies", label: t("pages.pantry.veggies", "Veggies") },
    { value: "Fruits", label: t("pages.pantry.fruits", "Fruits") },
    { value: "Grains", label: t("pages.pantry.grains", "Grains") },
  ];

  const getFreshnessPercentage = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 0;
    if (daysUntilExpiry <= 3) return 33;
    if (daysUntilExpiry <= 7) return 66;
    return 100;
  };

  const getFreshnessColor = (percentage: number) => {
    if (percentage <= 33) return "bg-red-500";
    if (percentage <= 66) return "bg-amber-500";
    return "bg-[#B2D2A4]";
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConsume = (id: string, name: string) => {
    consumeItem(id);
    toast.success(`${name} ${t("pages.pantry.consumedToast", "marked as consumed!")}`);
  };

  const handleDiscard = (id: string, name: string) => {
    discardItem(id);
    toast.error(`${name} ${t("pages.pantry.discardedToast", "discarded")}`);
  };

  const handleShare = (id: string, name: string) => {
    shareItem(id);
    toast.success(`${name} ${t("pages.pantry.sharedToast", "shared with community!")}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <BottomNav />
      
      <main className="lg:ml-64 pb-20 lg:pb-6">
        <div className="max-w-7xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-[#4A5568] mb-6">{t("pages.pantry.title")}</h1>
          </motion.div>

          {/* Search & Filter Bar */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4A5568]/40" />
                  <Input
                    placeholder={t("pages.pantry.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category.value)}
                      className={selectedCategory === category.value ? "bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568]" : ""}
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredInventory.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-[#4A5568]/60">{t("pages.pantry.noItems")}</p>
              </Card>
            ) : (
              filteredInventory.map((item, index) => {
                const freshness = getFreshnessPercentage(item.expiryDate);
                const daysLeft = getDaysUntilExpiry(item.expiryDate);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-[#4A5568] mb-1">
                                {item.name}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-[#4A5568]/60">
                                <span>{item.quantity} {item.unit}</span>
                                <span>•</span>
                                <Badge variant="outline">{item.category}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-[#4A5568]">
                                {Math.round(item.price).toLocaleString('ru-RU')} ₸
                              </p>
                            </div>
                          </div>

                          {/* Freshness Indicator */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#4A5568]/60">{t("pages.pantry.freshness", "Freshness")}</span>
                              <span className={`font-medium ${
                                daysLeft < 0 ? 'text-red-500' : 
                                daysLeft <= 3 ? 'text-amber-500' : 
                                'text-[#B2D2A4]'
                              }`}>
                                {daysLeft < 0 ? t("pages.pantry.expired", "Expired") : 
                                 daysLeft === 0 ? t("pages.pantry.expiresToday", "Expires today") : 
                                 `${daysLeft} ${t("pages.pantry.daysLeft", "days left")}`}
                              </span>
                            </div>
                            <Progress 
                              value={freshness} 
                              className="h-2"
                              style={{
                                // @ts-ignore
                                '--progress-background': getFreshnessColor(freshness)
                              }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex md:flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConsume(item.id, item.name)}
                            className="flex-1 md:flex-none border-[#B2D2A4] text-[#B2D2A4] hover:bg-[#B2D2A4] hover:text-white"
                          >
                            <Check className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">{t("pages.pantry.consumed", "Consumed")}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShare(item.id, item.name)}
                            className="flex-1 md:flex-none border-[#4A5568] text-[#4A5568] hover:bg-[#4A5568] hover:text-white"
                          >
                            <Gift className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">{t("pages.pantry.share", "Share")}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDiscard(item.id, item.name)}
                            className="flex-1 md:flex-none border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">{t("pages.pantry.discard", "Discard")}</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Empty State with Add Button */}
          {inventory.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Card className="p-12">
                <Plus className="w-16 h-16 text-[#4A5568]/20 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-[#4A5568] mb-2">
                  {t("pages.pantry.emptyTitle", "Your pantry is empty")}
                </h2>
                <p className="text-[#4A5568]/60 mb-6">
                  {t("pages.pantry.emptyText", "Start by scanning a receipt or adding items manually")}
                </p>
                <Button className="bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568]">
                  {t("pages.pantry.addFirstItem", "Add First Item")}
                </Button>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
