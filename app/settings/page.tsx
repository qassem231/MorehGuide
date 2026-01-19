"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import ProfileAvatarSection from "@/components/settings/ProfileAvatarSection";
import ProfileFields from "@/components/settings/ProfileFields";
import SecurityTab from "@/components/settings/SecurityTab";
import PreferencesTab from "@/components/settings/PreferencesTab";
import SaveBar from "@/components/settings/SaveBar";
import MessageAlert from "@/components/settings/MessageAlert";

type Tab = "profile" | "security" | "preferences";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "" });
  const [profilePicture, setProfilePicture] = useState("");
  const [pictureInputKey, setPictureInputKey] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFormData({ name: parsed.name || "", email: parsed.email || "" });
      setProfilePicture(parsed.profilePicture || "");
    }
    setIsLoading(false);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handlePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5MB");
      setMessageType("error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        setProfilePicture(base64);
        setHasChanges(true);

        // Immediately save to database
        const token = localStorage.getItem("token");
        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            profilePicture: base64,
          }),
        });

        if (!res.ok) throw new Error("Failed to save profile picture");

        const userData = { ...user, profilePicture: base64 };
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setMessage("Profile picture updated!");
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      } catch (error: any) {
        setMessage("Failed to save picture: " + error.message);
        setMessageType("error");
      }
      setPictureInputKey(pictureInputKey + 1);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setProfilePicture("");
      setHasChanges(true);

      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          profilePicture: "",
        }),
      });

      if (!res.ok) throw new Error("Failed to remove picture");

      const userData = { ...user, profilePicture: "" };
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setMessage("Profile picture removed");
      setMessageType("success");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage("Failed: " + error.message);
      setMessageType("error");
    }
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          profilePicture,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const userData = { ...user, ...formData, profilePicture };
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      setHasChanges(false);
      setMessage("Changes saved successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage("Failed to save: " + error.message);
      setMessageType("error");
    }
  };

  const handleCancel = () => {
    setFormData({ name: user.name || "", email: user.email || "" });
    setProfilePicture(user.profilePicture || "");
    setHasChanges(false);
  };

  if (isLoading)
    return (
      <div className="p-8 text-gray-900 dark:text-brand-cream">Loading...</div>
    );
  if (!user)
    return (
      <div className="p-8 text-gray-900 dark:text-brand-cream">
        Please log in to access settings
      </div>
    );

  return (
    <div className="min-h-full bg-gray-50 dark:bg-brand-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/chat"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FiArrowLeft size={20} />
            Back
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-brand-cream">
            Settings
          </h1>
        </div>

        {/* Messages */}
        <MessageAlert message={message} type={messageType} />

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <ProfileAvatarSection
                  user={user}
                  profilePicture={profilePicture}
                  pictureInputKey={pictureInputKey}
                  onPictureUpload={handlePictureUpload}
                  onRemovePicture={handleRemoveProfilePicture}
                />
                <ProfileFields
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <SecurityTab
                formData={formData}
                onInputChange={handleInputChange}
              />
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && <PreferencesTab />}
          </div>
        </div>
      </div>

      {/* Floating Save Bar */}
      <SaveBar
        hasChanges={hasChanges}
        onSave={handleSaveChanges}
        onCancel={handleCancel}
      />
    </div>
  );
}
