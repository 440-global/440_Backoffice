import { useGetSupplier } from "@/api/supplier";

export const SupplierName = ({ id }: { id: number }) => {
  const { data, isPending } = useGetSupplier(id);

  if (isPending) return <span className="text-xs text-(--muted)">Loading...</span>;

  const display = data?.name
    ? data.clubCode
      ? `${data.name} (${data.clubCode})`
      : data.name
    : "Unknown";

  return <span>{display}</span>;
};