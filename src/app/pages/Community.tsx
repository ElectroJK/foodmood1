import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { BottomNav } from "../components/BottomNav";
import { useFoodMood } from "../context/FoodMoodContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { MapPin, Navigation, User, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

export function Community() {
  const { communityListings } = useFoodMood();
  const { t } = useLanguage();
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRequestItem = (itemName: string) => {
    toast.success(`${t("pages.community.requestSent", "Request sent for")} ${itemName}!`);
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
            <h1 className="text-3xl font-bold text-[#4A5568] mb-2">{t("pages.community.title")}</h1>
            <p className="text-[#4A5568]/60 mb-6">
              {t("pages.community.subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden h-[500px]">
                <div className="relative w-full h-full bg-gray-100">
                  {/* Embedded Map - Using Google Maps iframe */}
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.15830869428!2d-74.11976373946234!3d40.69766374874431!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1647887654321!5m2!1sen!2s"
                  ></iframe>
                  
                  {/* Map Overlay with Pins */}
                  <div className="absolute top-4 left-4 right-4">
                    <Card className="p-3 bg-white/95 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-sm text-[#4A5568]">
                        <MapPin className="w-4 h-4 text-[#B2D2A4]" />
                        <span className="font-medium">{communityListings.length} {t("pages.community.itemsNearby", "items available nearby")}</span>
                      </div>
                    </Card>
                  </div>

                  <div className="absolute bottom-4 right-4">
                    <Button className="bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568] shadow-lg">
                      <Navigation className="w-4 h-4 mr-2" />
                      {t("pages.community.myLocation", "My Location")}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Listing Feed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {communityListings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card 
                      className={`overflow-hidden cursor-pointer hover:shadow-lg transition-all ${
                        selectedListing === listing.id ? 'ring-2 ring-[#B2D2A4]' : ''
                      }`}
                      onClick={() => setSelectedListing(listing.id)}
                    >
                      <div className="flex gap-4 p-4">
                        <img 
                          src={listing.image} 
                          alt={listing.itemName}
                          className="w-24 h-24 object-cover rounded-xl"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-[#4A5568] text-lg">
                                {listing.itemName}
                              </h3>
                              <p className="text-sm text-[#4A5568]/60">
                                {listing.quantity}
                              </p>
                            </div>
                            <Badge className="bg-[#B2D2A4]/20 text-[#4A5568]">
                              <MapPin className="w-3 h-3 mr-1" />
                              {listing.distance}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-[#B2D2A4] flex items-center justify-center text-white text-xs font-semibold">
                              {listing.userName[0]}
                            </div>
                            <span className="text-sm text-[#4A5568]/60">
                              {listing.userName}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestItem(listing.itemName);
                              }}
                              className="flex-1 bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568]"
                            >
                              {t("pages.community.requestItem", "Request Item")}
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info(t("pages.community.messageComingSoon", "Message feature coming soon!"));
                              }}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Share Your Food Section */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-8 bg-gradient-to-br from-[#B2D2A4]/10 to-white">
              <div className="max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 rounded-full bg-[#B2D2A4] mx-auto mb-4 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#4A5568] mb-3">
                  {t("pages.community.shareSurplus", "Share Your Surplus Food")}
                </h2>
                <p className="text-[#4A5568]/60 mb-6">
                  {t("pages.community.shareText", "Have food items you won't use? Share them with your community and help reduce waste while helping neighbors.")}
                </p>
                <Button 
                  size="lg"
                  className="bg-[#B2D2A4] hover:bg-[#9BC18A] text-[#4A5568]"
                  onClick={() => navigate('/share-food')}
                >
                  {t("pages.community.shareFromPantry", "Share from Pantry")}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Community Impact Stats */}
          <motion.div
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 text-center">
              <p className="text-3xl font-bold text-[#B2D2A4] mb-2">247</p>
              <p className="text-sm text-[#4A5568]/60">{t("pages.community.itemsSharedWeek", "Items Shared This Week")}</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-3xl font-bold text-[#B2D2A4] mb-2">1,432</p>
              <p className="text-sm text-[#4A5568]/60">{t("pages.community.activeMembers", "Active Community Members")}</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-3xl font-bold text-[#B2D2A4] mb-2">3.2 km</p>
              <p className="text-sm text-[#4A5568]/60">{t("pages.community.averageDistance", "Average Sharing Distance")}</p>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
