import SystemStatusCard from "../../../components/SystemStatusCard";
import {
  deleteStationAction,
  saveStationAction,
  toggleStationAction,
} from "../../../features/admin/admin-actions";
import AdminPageHeader from "../../../features/admin/AdminPageHeader";
import AdminStationManager from "../../../features/admin/AdminStationManager";
import { getAdminStationsData } from "../../../features/admin/server";
import { isDatabaseConfigured } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminStationsPage() {
  if (!(await isDatabaseConfigured())) {
    return (
      <SystemStatusCard
        title="المنظومة غير مهيأة بعد"
        description="إدارة المحطات تحتاج اتصالاً بقاعدة البيانات، لكن DATABASE_URL غير موجود."
        details="أضف DATABASE_URL ثم أعد النشر."
      />
    );
  }

  const stationsData = await getAdminStationsData();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="STATIONS"
        title="إدارة المحطات"
        description="أنشئ محطة جديدة أو عدّل أوقات العمل من صفحة مستقلة مخصصة للمحطات فقط، بدون تشتيت بباقي الجداول."
        metrics={[
          { label: "إجمالي المحطات", value: stationsData.totalStations },
          { label: "المحطات المفتوحة", value: stationsData.openStations, tone: "highlight" },
        ]}
      />

      <AdminStationManager
        stations={stationsData.stations}
        onSaveStation={saveStationAction}
        onToggleStation={toggleStationAction}
        onDeleteStation={deleteStationAction}
      />
    </div>
  );
}
