import { lazy, Suspense } from "react";
import { motion } from "motion/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import { Toaster } from "./components/ui/sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { isTokenExpired } from "./lib/api";

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
const DocumentDistributionDetailPage = lazy(() =>
  import("./pages/DocumentDistributionDetailPage").then((m) => ({
    default: m.DocumentDistributionDetailPage,
  }))
);
const DocumentDistributionEditPage = lazy(() =>
  import("./pages/DocumentDistributionEditPage").then((m) => ({
    default: m.DocumentDistributionEditPage,
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
const AcademicRoleActivitiesPage = lazy(() =>
  import("./pages/AcademicRoleActivitiesPage").then((m) => ({
    default: m.AcademicRoleActivitiesPage,
  }))
);
const MonitoringActivityDetailPage = lazy(() =>
  import("./pages/MonitoringActivityDetailPage").then((m) => ({
    default: m.MonitoringActivityDetailPage,
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
const PublicActivityPage = lazy(() =>
  import("./pages/PublicActivityPage").then((m) => ({
    default: m.PublicActivityPage,
  }))
);
const PublicDocumentPage = lazy(() =>
  import("./pages/PublicDocumentPage").then((m) => ({
    default: m.PublicDocumentPage,
  }))
);
const UnauthorizedPage = lazy(() =>
  import("./pages/UnauthorizedPage").then((m) => ({
    default: m.UnauthorizedPage,
  }))
);


// ─── Loading Spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-3"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-10 w-10 border-2 border-primary border-t-transparent"
        />
        <p className="text-sm text-muted-foreground">Memuat...</p>
      </motion.div>
    </div>
  );
}

// ─── Route Guards ─────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (isTokenExpired()) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

/**
 * RoleProtectedRoute — memastikan user sudah login DAN memiliki
 * setidaknya satu dari role yang diizinkan. Jika tidak, redirect ke /dashboard.
 */
function RoleProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (isTokenExpired()) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  if (!user) return <Navigate to="/login" replace />;

  const hasAccess = user.roles?.some((r) => allowedRoles.includes(r));
  if (!hasAccess) return <UnauthorizedPage />;

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
        <Route
          path="/public/kegiatan/:id"
          element={<PublicActivityPage />}
        />
        <Route
          path="/public/kegiatan/:id/entry/:txId"
          element={<PublicActivityPage />}
        />
        <Route
          path="/public/kegiatan/:id/dokumen"
          element={<PublicActivityPage />}
        />
        <Route
          path="/public/kegiatan/:id/dokumen/entry/:txId"
          element={<PublicActivityPage />}
        />
        <Route
          path="/public/dokumen/:id"
          element={<PublicDocumentPage />}
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
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <ManageAccountsPage />
            </RoleProtectedRoute>
          }
        />

        {/* Admin Akademik */}
        <Route
          path="/admin/akademik/jurusan"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AkademikJurusanPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/akademik/prodi"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AkademikProdiPage />
            </RoleProtectedRoute>
          }
        />

        {/* Admin Jabatan */}
        <Route
          path="/admin/jabatan/kajur"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <JabatanKajurPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/jabatan/kaprodi"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <JabatanKaprodiPage />
            </RoleProtectedRoute>
          }
        />

        {/* Activities */}
        <Route
          path="/activities"
          element={
            <RoleProtectedRoute allowedRoles={["dosen"]}>
              <ActivitiesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/activities/new"
          element={
            <RoleProtectedRoute allowedRoles={["dosen"]}>
              <ActivityFormPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/activities/:id"
          element={
            <RoleProtectedRoute allowedRoles={["dosen"]}>
              <ActivityDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/activities/:id/edit"
          element={
            <RoleProtectedRoute allowedRoles={["dosen"]}>
              <ActivityFormPage />
            </RoleProtectedRoute>
          }
        />

        {/* Documents */}
        <Route
          path="/documents"
          element={
            <RoleProtectedRoute allowedRoles={["dosen"]}>
              <DocumentsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/documents/:id/preview"
          element={
            <RoleProtectedRoute allowedRoles={["dosen", "staf_tu"]}>
              <DocumentPreviewPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/document-distribution"
          element={
            <RoleProtectedRoute allowedRoles={["staf_tu"]}>
              <DocumentDistributionPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/document-distribution/:id"
          element={
            <RoleProtectedRoute allowedRoles={["staf_tu"]}>
              <DocumentDistributionDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/document-distribution/:id/edit"
          element={
            <RoleProtectedRoute allowedRoles={["staf_tu"]}>
              <DocumentDistributionEditPage />
            </RoleProtectedRoute>
          }
        />

        {/* Files */}
        <Route
          path="/file-management"
          element={
            <RoleProtectedRoute allowedRoles={["dosen"]}>
              <FileManagementPage />
            </RoleProtectedRoute>
          }
        />

        {/* AMI */}
        <Route
          path="/ami-recap"
          element={
            <RoleProtectedRoute allowedRoles={["staf_tu", "kajur", "kaprodi"]}>
              <AMIRecapPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/ami-recap/activity/:id"
          element={
            <RoleProtectedRoute allowedRoles={["staf_tu", "kajur", "kaprodi"]}>
              <AMIActivityDetailPage />
            </RoleProtectedRoute>
          }
        />

        {/* Academic Role Monitoring */}
        <Route
          path="/monitoring/jurusan"
          element={
            <RoleProtectedRoute allowedRoles={["kajur"]}>
              <AcademicRoleActivitiesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/monitoring/jurusan/kegiatan/:id"
          element={
            <RoleProtectedRoute allowedRoles={["kajur"]}>
              <MonitoringActivityDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/monitoring/jurusan/rekap"
          element={
            <RoleProtectedRoute allowedRoles={["kajur"]}>
              <LaporanRekapitulasiPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/monitoring/jurusan/rekap/:id"
          element={
            <RoleProtectedRoute allowedRoles={["kajur"]}>
              <RekapLaporanDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/monitoring/jurusan/rekap/:id/edit"
          element={
            <RoleProtectedRoute allowedRoles={["kajur"]}>
              <RekapLaporanEditPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/monitoring/prodi"
          element={
            <RoleProtectedRoute allowedRoles={["kaprodi"]}>
              <AcademicRoleActivitiesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/monitoring/prodi/kegiatan/:id"
          element={
            <RoleProtectedRoute allowedRoles={["kaprodi"]}>
              <MonitoringActivityDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/monitoring/prodi/rekap"
          element={
            <RoleProtectedRoute allowedRoles={["kaprodi"]}>
              <LaporanRekapitulasiPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/monitoring/prodi/rekap/:id"
          element={
            <RoleProtectedRoute allowedRoles={["kaprodi"]}>
              <RekapLaporanDetailPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/monitoring/prodi/rekap/:id/edit"
          element={
            <RoleProtectedRoute allowedRoles={["kaprodi"]}>
              <RekapLaporanEditPage />
            </RoleProtectedRoute>
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
  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" />
    </>
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
