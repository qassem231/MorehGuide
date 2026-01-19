"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FileStatsCards from "@/components/admin/FileStatsCards";
import FilesTable from "@/components/admin/FilesTable";
import ErrorAlert from "@/components/admin/ErrorAlert";

interface PdfFile {
  _id: string;
  name?: string;
  fileName?: string;
  audience?: "student" | "lecturer" | "everyone";
  uploadDate?: string;
  createdAt?: string;
}

export default function AdminFilesPage() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAudience, setEditingAudience] = useState<
    "student" | "lecturer" | "everyone" | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const checkAuthorization = () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
        return;
      }

      try {
        const user = JSON.parse(userData);
        if (!user.isAdmin) {
          console.warn("❌ Unauthorized: User is not admin");
          setError("You do not have permission to access this page");
          setTimeout(() => router.push("/chat"), 2000);
          return;
        }
        setIsAuthorized(true);
      } catch (err) {
        console.error("Error parsing user data:", err);
        router.push("/login");
      }
    };

    checkAuthorization();

    // Listen for file upload events
    const handleFilesUpdated = () => {
      loadFiles();
    };
    window.addEventListener("filesUpdated", handleFilesUpdated);
    return () => window.removeEventListener("filesUpdated", handleFilesUpdated);
  }, [router]);

  const loadFiles = async () => {
    if (!isAuthorized) return;

    try {
      setIsLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      console.log("🔄 [FRONTEND]: Loading files...");

      const res = await fetch("/api/admin/files", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log(`📥 [FRONTEND]: API Response Status: ${res.status}`);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ [FRONTEND]: API Error Response:", errorData);
        throw new Error(errorData.error || "Failed to fetch data");
      }

      const data = await res.json();
      console.log("📥 [FRONTEND]: Files Response:", data);
      console.log(`📊 [FRONTEND]: Retrieved ${data.length || 0} files`);

      if (data.length > 0) {
        console.log("📋 [FRONTEND]: Sample file structure:", data[0]);
      }

      setFiles(Array.isArray(data) ? data : data.files || []);
    } catch (err: any) {
      console.error("❌ [FRONTEND]: Error loading files:", err);
      setError(err.message);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [isAuthorized]);

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      setDeleting(fileId);
      const res = await fetch(`/api/admin/files/${fileId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      console.log("Delete response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete file");
      }

      alert("File deleted successfully!");
      loadFiles(); // Refresh the list
    } catch (err: any) {
      alert(`Error deleting file: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleEditAudience = async (
    fileId: string,
    newAudience: "student" | "lecturer" | "everyone",
  ) => {
    try {
      console.log(
        `🔄 [FRONTEND]: Updating audience for file ${fileId} to ${newAudience}`,
      );

      const token = localStorage.getItem("token");
      const requestBody = { audience: newAudience };
      console.log("📤 [FRONTEND]: Request body:", requestBody);

      const res = await fetch(`/api/admin/files/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await res.json();
      console.log("📥 [FRONTEND]: API Response:", responseData);
      console.log(
        "🎯 [FRONTEND]: Response audience field:",
        responseData.audience,
      );

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to update audience");
      }

      const finalAudience = responseData.audience || newAudience;
      console.log(`✅ [FRONTEND]: Using audience: ${finalAudience}`);

      // Update the file in local state with the response audience
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file._id === fileId ? { ...file, audience: finalAudience } : file,
        ),
      );

      setEditingId(null);
      setEditingAudience(null);
      alert("Audience updated successfully!");
    } catch (err: any) {
      console.error("❌ [FRONTEND]: Error updating audience:", err);
      alert(`Error updating audience: ${err.message}`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("📤 Upload response:", data);

      if (response.ok) {
        alert("PDF uploaded successfully!");
        loadFiles(); // Refresh the list
      } else {
        alert(`Failed to upload PDF: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Error uploading PDF: ${error.message}`);
    }

    // Reset the input
    event.target.value = "";
  };

  return (
    // FIX: Main Background
    <div className="min-h-full bg-gray-50 dark:bg-brand-dark p-4 sm:p-6 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Authorization Check */}
        {!isAuthorized && (
          <div className="p-4 bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-lg text-red-700 dark:text-red-400 mb-6">
            <p className="font-semibold">Access Denied</p>
            <p className="text-sm mt-2">
              {error || "Checking authorization..."}
            </p>
            {error && (
              <p className="text-xs mt-2 text-red-600 dark:text-red-300">
                Redirecting to chat in 2 seconds...
              </p>
            )}
          </div>
        )}

        {isAuthorized && (
          <>
            {/* Header */}
            <AdminPageHeader onUploadClick={handleUploadClick} />

            {/* Stats Cards */}
            <FileStatsCards totalFiles={files.length} />

            {/* Error Message */}
            {error && <ErrorAlert message={error} />}

            {/* Files Table */}
            <FilesTable
              files={files}
              isLoading={isLoading}
              editingId={editingId}
              editingAudience={editingAudience}
              deletingId={deleting}
              onEditStart={(fileId, audience) => {
                setEditingId(fileId);
                setEditingAudience(audience);
              }}
              onEditCancel={() => {
                setEditingId(null);
                setEditingAudience(null);
              }}
              onEditSave={handleEditAudience}
              onEditChange={setEditingAudience}
              onDelete={handleDeleteFile}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload PDF file"
              title="Upload PDF file"
            />
          </>
        )}
      </div>
    </div>
  );
}
