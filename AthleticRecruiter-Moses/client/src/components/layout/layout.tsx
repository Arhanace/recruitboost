import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import TopNav from "./top-nav";
import { useAuth } from "@/hooks/use-auth-provider";
import { AthleteInfoDialog } from "@/components/auth/athlete-info-dialog";
import { apiRequest } from "@/lib/queryClient";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAthleteInfo, setShowAthleteInfo] = useState(false);
  const [dialogClosed, setDialogClosed] = useState(false);
  const { user, isProfileFetched } = useAuth();

  // fetch gmail emails
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        // 🚀 Import any new Gmail replies
        const importRes = await apiRequest(
          "POST",
          "/api/emails/import-gmail-responses",
        );
        if (importRes.ok) {
          const importResult = await importRes.json();
          console.log("Imported Gmail replies:", importResult);
        } else {
          console.warn(
            "Failed to import Gmail replies:",
            await importRes.text(),
          );
        }
      } catch (error) {
        console.error("Error importing Gmail replies:", error);
      }
    };

    if (user) {
      fetchEmails(); // ← call it here
    }
  }, [user?.email]);

  // Check if this is a user's first login
  useEffect(() => {
    if (user) {
      // console.log("User profile check:", user?.profile);
      // If user exists but profile is incomplete and the dialog hasn't been manually closed
      if (!dialogClosed) {
        // Check if profile doesn't exist or required fields are not set
        const isMissingProfile = !user.profile;
        const isMissingSport =
          !user.profile?.sport || user.profile.sport.trim() === "";
        const isMissingFirstName =
          !user.profile?.firstName || user.profile.firstName.trim() === "";
        const isMissingLastName =
          !user.profile?.lastName || user.profile.lastName.trim() === "";

        if (
          isMissingProfile ||
          isMissingSport ||
          isMissingFirstName ||
          isMissingLastName
        ) {
          console.log(
            "First login detected or incomplete profile, showing athlete info dialog",
          );
          console.log("Missing fields:", {
            profile: isMissingProfile,
            sport: isMissingSport,
            firstName: isMissingFirstName,
            lastName: isMissingLastName,
          });
          setShowAthleteInfo(true);
        }
      }
    }
  }, [user, dialogClosed]);

  // Handle clicks outside of sidebar on mobile to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check if we're on mobile and sidebar is open
      if (window.innerWidth < 768 && sidebarOpen) {
        // Check if the click is not within the sidebar
        const sidebar = document.getElementById("sidebar");
        if (sidebar && !sidebar.contains(target)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  // Close sidebar when clicking on a link (mobile)
  const handleSidebarLinkClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Athlete Info Dialog for new users */}
      {isProfileFetched && !user?.profile?.sport && (
        <AthleteInfoDialog
          open={showAthleteInfo}
          onOpenChange={(open) => {
            setShowAthleteInfo(open);
            if (!open) {
              setDialogClosed(true);
            }
          }}
        />
      )}

      <div id="sidebar">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>

      <div className="flex-1 md:ml-64">
        <TopNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
