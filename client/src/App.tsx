import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { Toaster } from "./components/ui/sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Lazy load semua pages
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const ManageAccountsPage = lazy(() =>
  import("./pages/ManageAccountsPage").then((m) => ({
    default: m.ManageAccountsPage,
  }))
);
const AkademikJurusanPage = lazy(() =>
  import("./pages/AkademikJurusanPage").then((m) => ({
    default: m.AkademikJurusanPage,
  }))
);
const AkademikProdiPage = lazy(() =>
  import("./pages/AkademikProdiPage").then((m) => ({
    default: m.AkademikProdiPage,
  }))
);
const JabatanKajurPage = lazy(() =>
  import("./pages/JabatanKajurPage").then((m) => ({
    default: m.JabatanKajurPage,
  }))
);
const JabatanKaprodiPage = lazy(() =>
  import("./pages/JabatanKaprodiPage").then((m) => ({
    default: m.JabatanKaprodiPage,
  }))
);
const ActivitiesPage = lazy(() =>
  import("./pages/ActivitiesPage").then((m) => ({ default: m.ActivitiesPage }))
);
const ActivityFormPage = lazy(() =>
  import("./pages/ActivityFormPage").then((m) => ({
    default: m.ActivityFormPage,
  }))
);
const ActivityDetailPage = lazy(() =>
  import("./pages/ActivityDetailPage").then((m) => ({
    default: m.ActivityDetailPage,
  }))
);
const DocumentsPage = lazy(() =>
  import("./pages/DocumentsPage").then((m) => ({ default: m.DocumentsPage }))
);
const DocumentPreviewPage = lazy(() =>
  import("./pages/DocumentPreviewPage").then((m) => ({
    default: m.DocumentPreviewPage,
  }))
);
const DocumentDistributionPage = lazy(() =>
  import("./pages/DocumentDistributionPage").then((m) => ({
    default: m.DocumentDistributionPage,
  }))
);
const FileManagementPage = lazy(() =>
  import("./pages/FileManagementPage").then((m) => ({
    default: m.FileManagementPage,
  }))
);
const AMIRecapPage = lazy(() =>
  import("./pages/AMIRecapPage").then((m) => ({ default: m.AMIRecapPage }))
);
const AMIActivityDetailPage = lazy(() =>
  import("./pages/AMIActivityDetailPage").then((m) => ({
    default: m.AMIActivityDetailPage,
  }))
);
const NotificationsPage = lazy(() =>
  import("./pages/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  }))
);
const AcademicRoleActivitiesPage = lazy(() =>
  import("./pages/AcademicRoleActivitiesPage").then((m) => ({
    default: m.AcademicRoleActivitiesPage,
  }))
);
const LaporanRekapitulasiPage = lazy(() =>
  import("./pages/LaporanRekapitulasiPage").then((m) => ({
    default: m.LaporanRekapitulasiPage,
  }))
);
const RekapLaporanDetailPage = lazy(() =>
  import("./pages/RekapLaporanDetailPage").then((m) => ({
    default: m.RekapLaporanDetailPage,
  }))
);
const RekapLaporanEditPage = lazy(() =>
  import("./pages/RekapLaporanEditPage").then((m) => ({
    default: m.RekapLaporanEditPage,
  }))
);

// ─── Loading Spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}

// ─── Route Guards ─────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Accounts */}
        <Route
          path="/manage-accounts"
          element={
            <ProtectedRoute>
              <ManageAccountsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Akademik */}
        <Route
          path="/admin/akademik/jurusan"
          element={
            <ProtectedRoute>
              <AkademikJurusanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/akademik/prodi"
          element={
            <ProtectedRoute>
              <AkademikProdiPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Jabatan */}
        <Route
          path="/admin/jabatan/kajur"
          element={
            <ProtectedRoute>
              <JabatanKajurPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jabatan/kaprodi"
          element={
            <ProtectedRoute>
              <JabatanKaprodiPage />
            </ProtectedRoute>
          }
        />

        {/* Activities */}
        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <ActivitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities/new"
          element={
            <ProtectedRoute>
              <ActivityFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities/:id"
          element={
            <ProtectedRoute>
              <ActivityDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities/:id/edit"
          element={
            <ProtectedRoute>
              <ActivityFormPage />
            </ProtectedRoute>
          }
        />

        {/* Documents */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id/preview"
          element={
            <ProtectedRoute>
              <DocumentPreviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/document-distribution"
          element={
            <ProtectedRoute>
              <DocumentDistributionPage />
            </ProtectedRoute>
          }
        />

        {/* Files */}
        <Route
          path="/file-management"
          element={
            <ProtectedRoute>
              <FileManagementPage />
            </ProtectedRoute>
          }
        />

        {/* AMI */}
        <Route
          path="/ami-recap"
          element={
            <ProtectedRoute>
              <AMIRecapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ami-recap/activity/:id"
          element={
            <ProtectedRoute>
              <AMIActivityDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Academic Role Monitoring */}
        <Route
          path="/monitoring/jurusan"
          element={
            <ProtectedRoute>
              <AcademicRoleActivitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring/jurusan/rekap"
          element={
            <ProtectedRoute>
              <LaporanRekapitulasiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring/jurusan/rekap/:id"
          element={
            <ProtectedRoute>
              <RekapLaporanDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring/jurusan/rekap/:id/edit"
          element={
            <ProtectedRoute>
              <RekapLaporanEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring/prodi"
          element={
            <ProtectedRoute>
              <AcademicRoleActivitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring/prodi/rekap"
          element={
            <ProtectedRoute>
              <LaporanRekapitulasiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring/prodi/rekap/:id"
          element={
            <ProtectedRoute>
              <RekapLaporanDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring/prodi/rekap/:id/edit"
          element={
            <ProtectedRoute>
              <RekapLaporanEditPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

function AppWithProviders() {
  const { user } = useAuth();

  return (
    <NotificationProvider userRoles={user?.roles}>
      <AppRoutes />
      <Toaster />
    </NotificationProvider>
  );
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <AppWithProviders />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}