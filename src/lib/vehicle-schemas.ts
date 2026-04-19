import { z } from "zod";

const trimString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const decimalField = (fieldLabel: string) =>
  z.preprocess((value) => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.trim();
      return normalized === "" ? Number.NaN : Number(normalized);
    }

    return value;
  }, z.number())
    .refine(Number.isFinite, {
      message: `يجب إدخال ${fieldLabel} كرقم صالح.`,
    })
    .refine((value) => value > 0, {
      message: `${fieldLabel} يجب أن تكون أكبر من صفر.`,
    });

export const vehicleMutationSchema = z.object({
  plates_number: z.preprocess(
    trimString,
    z
      .string()
      .min(1, "رقم لوحة الشاحنة مطلوب.")
      .max(50, "رقم لوحة الشاحنة أطول من المسموح."),
  ),
  trailer_plates: z.preprocess((value) => {
    const normalized = trimString(value);
    return normalized === "" ? null : normalized;
  }, z.string().max(50, "رقم لوحة المقطورة أطول من المسموح.").nullable()),
  capacity_liters: decimalField("سعة التانك باللتر"),
  cubic_capacity: decimalField("تكعيب الشاحنة"),
});

export const vehicleMutationListSchema = z
  .array(vehicleMutationSchema)
  .min(1, "يجب إدخال بيانات شاحنة واحدة على الأقل.");

export type VehicleMutationInput = z.infer<typeof vehicleMutationSchema>;

export const getVehicleValidationError = (error: z.ZodError): string =>
  error.issues[0]?.message ?? "تعذر التحقق من بيانات المركبة.";
