import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import PlatformAdminLayout from "../layouts/PlatformAdminLayout";
import PlatformAdminDashboard from "../features/platform-admin/Dashboard";
import PlatformAdminUniversities from "../features/platform-admin/Universities";
import PlatformAdminLicenses from "../features/platform-admin/Licenses";
import PlatformAdminSupport from "../features/platform-admin/SupportTickets";
import PlatformAdminSystem from "../features/platform-admin/SystemHealth";
import PlatformAdminAudit from "../features/platform-admin/AuditLogs";
import PlatformAdminSettings from "../features/platform-admin/Settings";
import AuthLayout from "../layouts/AuthLayout";
import StudentAttendance from "../features/student/Attendance";
import UniversityAdminLayout from "../layouts/UniversityAdminLayout";
import UniversityAdminDashboard from "../features/university-admin/Dashboard";
import UniversityAdminFaculties from "../features/university-admin/Faculties";
import UniversityAdminDepartments from "../features/university-admin/Departments";
import UniversityAdminHods from "../features/university-admin/Hods";
import UniversityAdminAcademicCalendar from "../features/university-admin/AcademicCalendar";
import UniversityAdminDepartmentReports from "../features/university-admin/DepartmentReports";
import UniversityAdminTechnicalCenter from "../features/university-admin/TechnicalCenter";
import UniversityAdminIntegrations from "../features/university-admin/Integrations";
import UniversityAdminSettings from "../features/university-admin/Settings";
import UniversityAdminSubscription from "../features/university-admin/Subscription";
import HodLayout from "../layouts/HodLayout";
import HodDashboard from "../features/hod/Dashboard";
import HodLecturers from "../features/hod/Lecturers";
import HodStudents from "../features/hod/Students";
import HodProgrammes from "../features/hod/Programmes";
import HodUnits from "../features/hod/Units";
import HodAcademicStructure from "../features/hod/AcademicStructure";
import HodClassRecords from "../features/hod/ClassRecords";
import HodReports from "../features/hod/Reports";
import HodAnalytics from "../features/hod/Analytics";
import LecturerLayout from "../layouts/LecturerLayout";
import LecturerDashboard from "../features/lecturer/Dashboard";
import LecturerMyUnits from "../features/lecturer/MyUnits";
import LecturerStart from "../features/lecturer/StartAttendance";
import LecturerLive from "../features/lecturer/LiveSession";
import LecturerHistory from "../features/lecturer/AttendanceHistory";
import LecturerStudentSearch from "../features/lecturer/StudentSearch";
import LecturerReports from "../features/lecturer/Reports";
import LecturerAnalytics from "../features/lecturer/Analytics";

import UniversityAdminSignup from "../features/auth/UniversityAdminSignup";

import LoginPlatformAdmin from "../features/auth/LoginPlatformAdmin";
import LoginUniversityAdmin from "../features/auth/LoginUniversityAdmin";
import LoginHOD from "../features/auth/LoginHOD";
import LoginLecturer from "../features/auth/LoginLecturer";
import SessionsAnalytics from "../features/lecturer/SessionsAnalytics";

const ProtectedRoute = ({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: JSX.Element;
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to the correct login page based on the role they were trying to access
    const role = allowedRoles[0]?.toLowerCase() || "platform-admin";
    const roleMap: Record<string, string> = {
      platform_admin: "platform-admin",
      university_admin: "university-admin",
      hod: "hod",
      lecturer: "lecturer",
    };
    const loginPath = roleMap[role] || "platform-admin";
    return <Navigate to={`/login/${loginPath}`} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const role = user.role?.toLowerCase() || "platform-admin";
    const roleMap: Record<string, string> = {
      platform_admin: "platform-admin",
      university_admin: "university-admin",
      hod: "hod",
      lecturer: "lecturer",
    };
    const loginPath = roleMap[role] || "platform-admin";
    return <Navigate to={`/login/${loginPath}`} replace />;
  }

  return children;
};

const AppRoutes = () => (
  <AuthProvider>
    <Routes>
      {/* ROOT - redirect to platform admin login (or change to any) */}
      <Route
        path="/"
        element={<Navigate to="/login/university-admin" replace />}
      />

      <Route path="/attendance/:token" element={<StudentAttendance />} />

      {/* 4 Separate Login Pages */}
      <Route path="/login/platform-admin" element={<LoginPlatformAdmin />} />
      <Route
        path="/login/university-admin"
        element={<LoginUniversityAdmin />}
      />
      <Route path="/login/hod" element={<LoginHOD />} />
      <Route path="/login/lecturer" element={<LoginLecturer />} />
      <Route path="/attend/:token" element={<StudentAttendance />} />

      {/* Signup */}
      <Route
        path="/signup/university-admin"
        element={<UniversityAdminSignup />}
      />

      {/* PLATFORM ADMIN */}
      <Route
        path="/platform-admin"
        element={
          <ProtectedRoute allowedRoles={["PLATFORM_ADMIN"]}>
            <PlatformAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PlatformAdminDashboard />} />
        <Route path="universities" element={<PlatformAdminUniversities />} />
        <Route path="licenses" element={<PlatformAdminLicenses />} />
        <Route path="support" element={<PlatformAdminSupport />} />
        <Route path="system" element={<PlatformAdminSystem />} />
        <Route path="audit" element={<PlatformAdminAudit />} />
        <Route path="settings" element={<PlatformAdminSettings />} />
      </Route>

      {/* UNIVERSITY ADMIN */}
      <Route
        path="/university-admin"
        element={
          <ProtectedRoute allowedRoles={["UNIVERSITY_ADMIN"]}>
            <UniversityAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UniversityAdminDashboard />} />
        <Route path="faculties" element={<UniversityAdminFaculties />} />
        <Route path="departments" element={<UniversityAdminDepartments />} />
        <Route path="hods" element={<UniversityAdminHods />} />
        <Route
          path="academic-calendar"
          element={<UniversityAdminAcademicCalendar />}
        />
        <Route path="reports" element={<UniversityAdminDepartmentReports />} />
        <Route path="technical" element={<UniversityAdminTechnicalCenter />} />
        <Route path="integrations" element={<UniversityAdminIntegrations />} />
        <Route path="subscription" element={<UniversityAdminSubscription />} />
        <Route path="settings" element={<UniversityAdminSettings />} />
      </Route>

      {/* HOD */}
      <Route
        path="/hod"
        element={
          <ProtectedRoute allowedRoles={["HOD"]}>
            <HodLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HodDashboard />} />
        <Route path="lecturers" element={<HodLecturers />} />
        <Route path="students" element={<HodStudents />} />
        <Route path="programmes" element={<HodProgrammes />} />
        <Route path="units" element={<HodUnits />} />
        <Route path="class-records" element={<HodClassRecords />} />
        <Route path="academic-structure" element={<HodAcademicStructure />} />
        <Route path="reports" element={<HodReports />} />
        <Route path="analytics" element={<HodAnalytics />} />
      </Route>

      {/* LECTURER */}
      <Route
        path="/lecturer"
        element={
          <ProtectedRoute allowedRoles={["LECTURER"]}>
            <LecturerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LecturerDashboard />} />
        <Route path="units" element={<LecturerMyUnits />} />
        <Route path="start" element={<LecturerStart />} />
        <Route path="live" element={<LecturerLive />} />
        <Route path="history" element={<LecturerHistory />} />
        <Route path="students" element={<LecturerStudentSearch />} />
        <Route path="reports" element={<LecturerReports />} />
        <Route path="analytics" element={<LecturerAnalytics />} />
        <Route path="sessions-analytics" element={<SessionsAnalytics />} />
      </Route>

      {/* FALLBACK */}
      <Route
        path="*"
        element={<Navigate to="/login/university-admin" replace />}
      />
    </Routes>
  </AuthProvider>
);

export default AppRoutes;
