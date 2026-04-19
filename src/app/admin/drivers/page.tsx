import SystemStatusCard from "../../../components/SystemStatusCard";
import {
  activateDriverAction,
  deleteDriverAction,
  suspendDriverAction,
  updateVehicleAction,
} from "../../../features/admin/admin-actions";
import AdminDriversPanel from "../../../features/admin/AdminDriversPanel";
import AdminPageHeader from "../../../features/admin/AdminPageHeader";
import { getAdminDriversData } from "../../../features/admin/server";
import { isDatabaseConfigured } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDriversPage() {
  if (!(await isDatabaseConfigured())) {
    return (
      <SystemStatusCard
        title="المنظومة غير مهيأة بعد"
        description="إدارة السائقين تحتاج اتصالاً بقاعدة البيانات، لكن DATABASE_URL غير موجود."
        details="أضف DATABASE_URL ثم أعد النشر."
      />
    );
  }

  const driversData = await getAdminDriversData();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="DRIVERS"
        title="إدارة السائقين"
        description="جدول مختصر ومنظّم لبيانات السائقين الأساسية، مع نافذة منفصلة لعرض الشاحنات بدل تكديسها داخل نفس الخلية."
        metrics={[
          { label: "إجمالي السائقين", value: driversData.totalDrivers },
          { label: "النشطون", value: driversData.activeDrivers, tone: "highlight" },
          { label: "الموقوفون", value: driversData.suspendedDrivers },
        ]}
      />

      <AdminDriversPanel
        drivers={driversData.drivers}
        onSuspendDriver={suspendDriverAction}
        onActivateDriver={activateDriverAction}
        onDeleteDriver={deleteDriverAction}
        onUpdateVehicle={updateVehicleAction}
      />
    </div>
  );
}
