import SystemStatusCard from "../../components/SystemStatusCard";
import {
  activateDriverAction,
  deleteDriverAction,
  suspendDriverAction,
  updateFuelLogLitersAction,
} from "../../features/admin/admin-actions";
import AdminDataTable from "../../features/admin/AdminDataTable";
import AdminPageHeader from "../../features/admin/AdminPageHeader";
import { getAdminOverviewData } from "../../features/admin/server";
import { isDatabaseConfigured } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  if (!(await isDatabaseConfigured())) {
    return (
      <SystemStatusCard
        title="المنظومة غير مهيأة بعد"
        description="لوحة الإدارة تحتاج اتصالاً بقاعدة البيانات، لكن DATABASE_URL غير موجود."
        details="أضف DATABASE_URL في Cloudflare Workers ثم أعد النشر."
      />
    );
  }

  const overview = await getAdminOverviewData();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="ADMIN OVERVIEW"
        title="ملخص التشغيل"
        description="هذه الصفحة مخصصة للقراءة السريعة: عدد السجلات اليوم، عدد السائقين، وعدد المحطات المفتوحة حالياً، مع سجل التعبئة الكامل أسفلها."
        metrics={[
          { label: "سجلات اليوم", value: overview.totalLogsToday, tone: "highlight" },
          { label: "إجمالي السائقين", value: overview.totalDrivers },
          { label: "المحطات", value: overview.totalStations },
          { label: "المحطات المفتوحة", value: overview.openStations },
        ]}
      />

      <AdminDataTable
        fuelLogs={overview.fuelLogs}
        exportDriverName="كل السائقين"
        onSuspendDriver={suspendDriverAction}
        onActivateDriver={activateDriverAction}
        onDeleteDriver={deleteDriverAction}
        onUpdateFuelLogLiters={updateFuelLogLitersAction}
      />
    </div>
  );
}
