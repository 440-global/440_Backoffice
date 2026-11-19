import { useGetCategory } from "@/api/product";
import { useGetSubCategory } from "@/api/product";

export const ParentCategoryName = ({ id }: { id: number }) => {
  const { data, isPending } = useGetCategory(id);

  if (isPending) return <span className="text-xs text-(--muted)">Loading...</span>;

  return <span>{data?.name ?? "Unknown"}</span>;
};

export const ParentSubName = ({ id }: { id: number }) => {
  const { data, isPending } = useGetSubCategory(id);
  if (isPending) return <span className="text-xs text-(--muted)">Loading...</span>;

  return <span>{data?.name ?? "Unknown"}</span>;
}