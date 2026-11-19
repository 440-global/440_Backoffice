"use client"

import { useDeleteProduct, useGetAllProducts, useGetProductBySupplier } from '@/api/product'
import MyModal from '@/components/dashboard/Modal'
import AddProduct from '@/components/products/AddProduct'
import EditProduct from '@/components/products/EditProduct'
import BaleForm from '@/components/products/BaleForm'
import { ParentSubName } from '@/components/products/subcategory/ParentCategoryName'
import ViewProduct from '@/components/products/ViewProduct'
import { ActionDropdown, Badge, Button, Card, Dropdown, Input } from '@/components/ui'
import { useConfirm } from '@/components/ui/confirm'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TablePagination, TableRow } from '@/components/ui/table/TableWrapper'
import { useToast } from '@/components/ui/toast/ToastContext'
import { ProductFilters, SingleProduct } from '@/types/types'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { RiAddFill, RiDeleteBinLine, RiEdit2Line, RiEye2Line, RiGlobalFill, RiMore2Fill, RiStackFill, RiTelegram2Fill } from 'react-icons/ri'
import { TbBoxOff } from "react-icons/tb";

const defaultFilters: ProductFilters = {
  page: 1,
  limit: 20,
  search: '',
}

const Products = () => {
  const searchParams = useSearchParams();
  const supplierId = useMemo(() => {
    const raw = searchParams.get("supplierId");
    if (!raw) return null;

    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : null;
  }, [searchParams]);

  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [tempFilters, setTempFilters] = useState<ProductFilters>(defaultFilters);
  const { mutate: deleteProduct } = useDeleteProduct();

 const filterBySupplier = supplierId !== null;

 // Only fire the "all products" request when we're not filtering by supplier
 const allProductsQuery = useGetAllProducts(filters, !filterBySupplier);
 const bySupplierQuery = useGetProductBySupplier(supplierId);

 const activeQuery = filterBySupplier ? bySupplierQuery : allProductsQuery;

 const products: SingleProduct[] = useMemo(
   () => activeQuery.data?.data ?? [],
   [activeQuery.data],
 );

 const total = activeQuery.data?.meta?.total ?? products.length;
 const totalPages = activeQuery.data?.meta?.totalPages;
 const page = activeQuery.data?.meta?.page;
 const limit = activeQuery.data?.meta.limit;
 const isProductsPending = activeQuery.isPending;

  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [modalType, setModalType] = useState<
    "view" | "edit" | "add" | "create-bale" | null
  >(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "true" | "false">(
    "all",
  );

  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  const filteredData = useMemo(() => {
    return products
      .filter((product: any) => {
        if (statusFilter === "all") return true;
        return product.isSpecial === (statusFilter === "true");
      })
      .filter((product: any) => {
        if (!query) return true;
        return product.name.toLowerCase().includes(query.toLowerCase());
      });
  }, [products, statusFilter, query]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: query, page: 1 }));
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);

  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageSizeChange = (size: number) => {
    setRowsPerPage(size);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const truncateText = (str: string, words: number) =>
    str.slice(0, words) + "...";

  const confirm = useConfirm();
  const { toast } = useToast();

  const handleDelete = async (product: { id: number | string; name?: string }) => {
    const ok = await confirm({
      title: "Delete this product?",
      message: `${product.name ? `"${product.name}"` : "This product"} will be removed. Customers will no longer see it.`,
    });
    if (!ok) return;
    // The failure toast (with the backend's reason) comes from the mutation itself.
    deleteProduct(String(product.id));
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Products</h3>
        <Button
          primary
          className="flex items-center gap-1"
          onClick={() => setModalType("add")}
          // disabled={!supplierId}
        >
          <RiAddFill className="font-bold" />
          Add Product
        </Button>
      </div>

      {!filterBySupplier && (
        <p className="mb-4 text-sm text-(--muted)">
          Showing all products.{" "}
          <Link
            href="/dashboard/suppliers"
            className="text-(--primary) underline"
          >
            Pick a supplier
          </Link>{" "}
          to filter the list or add a product for that supplier.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          className={`shadow-none ${isProductsPending ? "bg-(--elevated) animate-pulse" : "bg-(--primary)"} text-white py-6!`}
        >
          <div
            className={`p-3 w-fit rounded-xl ${isProductsPending ? "bg-(--primary)/50" : "bg-white/50"} mb-2`}
          >
            <RiStackFill />
          </div>
          <h1
            className={`text-sm font-medium ${
              isProductsPending ? "text-(--muted)" : "text-white/90"
            }`}
          >
            Total Products
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isProductsPending ? "—" : total}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-(--primary)/20 mb-2`}>
            <RiTelegram2Fill className="text-(--primary)" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>
            Telegram Products
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isProductsPending
              ? "—"
              : (
                  products.filter(
                    (product: any) => product.platform == "telegram",
                  ).length ?? 0
                ).toLocaleString()}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-(--primary)/20 mb-2`}>
            <RiGlobalFill className="text-(--primary)" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>
            1688 Products
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isProductsPending
              ? "—"
              : (
                  products.filter((product: any) => product.platform == "1688")
                    .length ?? 0
                ).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Products Table */}
      <Table
        aria-label="product Table"
        pageSize={rowsPerPage}
        onPageSizeChange={handlePageSizeChange}
        title="All Products"
        filter_placeholder="Filter by product name..."
        customFilter={
          <div className="flex gap-3 items-center">
            <div className="flex gap-1 items-center">
              <p className="font-semibold">Special:</p>
              <Dropdown
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val as any);
                  setCurrentPage(1);
                }}
                options={["all", "true", "false"]}
              />
            </div>
            <Input
              name="query"
              value={query}
              handler={(e) => setQuery(e.target.value)}
              element="input"
              placeholder="Search...."
              genStyle="my-0!"
              styling="p-2!"
            />
          </div>
        }
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Image</TableColumn>
            <TableColumn>Name</TableColumn>
            <TableColumn>Price</TableColumn>
            <TableColumn>Sub-Category</TableColumn>
            <TableColumn>Supplier</TableColumn>
            <TableColumn>Platform</TableColumn>
            <TableColumn>Special</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody
          isLoading={isProductsPending}
          emptyContent={
            <div className="min-h-75 flex justify-center items-center flex-col gap-4 text-center">
              <TbBoxOff size={48} className="text-(--primary)" />
              <div className="w-3/4">
                <h2 className="text-xl font-bold">No products</h2>
                <p>
                  {filterBySupplier
                    ? "This supplier does not currently have any products registered."
                    : "No products returned from the server."}
                </p>
                {!filterBySupplier && (
                  <Link
                    href="/dashboard/suppliers"
                    className="mt-3 inline-block"
                  >
                    <Button primary>Browse suppliers</Button>
                  </Link>
                )}
              </div>
            </div>
          }
        >
          {paginatedData.map((product: any) => (
            <TableRow className="bg-(--card)" key={product.id}>
              <TableCell>{product.id}</TableCell>
              <TableCell>
                <img
                  src={product.images?.[0]}
                  alt={String(product.price)}
                  width={50}
                  height={50}
                  className="object-cover"
                />
              </TableCell>
              <TableCell>{truncateText(product.name, 30)}</TableCell>
              <TableCell>&#8358;{product.price.toLocaleString()}</TableCell>

              <TableCell>
                <ParentSubName id={product.subCategoryId} />
              </TableCell>
              <TableCell>{product.supplierId}</TableCell>
              <TableCell className="capitalize">{product.platform}</TableCell>
              <TableCell>
                {product.isSpecial && (
                  <Badge
                    variant={`${product.isSpecial == true ? "success" : "danger"}`}
                  >
                    {product.isSpecial == true ? "Special" : "Not Special"}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {product.status && (
                  <Badge variant="success" className="lowercase">
                    Active
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    {
                      label: "View",
                      onClick: () => {
                        setModalType("view");
                        setSelectedProductId(product.id);
                      },
                    },
                    {
                      label: "Edit",
                      onClick: () => {
                        setSelectedProductId(product.id);
                        setModalType("edit");
                      },
                    },
                    {
                      label: "Create Bale",
                      onClick: () => {
                        setSelectedProductId(product.id);
                        setModalType("create-bale");
                      },
                    },
                    {
                      label: "Delete",
                      danger: true,
                      onClick: () => handleDelete(product),
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        page={page!}
        totalPages={totalPages!}
        onPageChange={handlePageChange}
        startIndex={(filters.page! - 1) * filters.limit! + 1}
        endIndex={(filters.page! - 1) * filters.limit! + filteredData.length}
        totalItems={total}
        itemLabel="product(s)"
        className="mb-10"
      />

      {selectedProductId && modalType === "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedProductId(null)}
          title="Product Details"
        >
          <ViewProduct productId={selectedProductId} />
        </MyModal>
      )}

      {selectedProductId && modalType === "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedProductId(null)}
          title="Edit Product Details"
        >
          <EditProduct
            productId={selectedProductId}
            onClose={() => setSelectedProductId(null)}
          />
        </MyModal>
      )}

      {selectedProductId && modalType === "create-bale" && (
        <MyModal
          isOpen={true}
          onXClose={() => setSelectedProductId(null)}
          onClose={() => {}}
          title="Create bale"
        >
          <BaleForm
            productId={selectedProductId}
            onSuccess={() => setSelectedProductId(null)}
          />
        </MyModal>
      )}

      {/* Add product Modal */}
      {modalType == "add" && (
        <MyModal
          isOpen={true}
          onClose={() => {}}
          onXClose={() => setModalType(null)}
          title="Add product"
        >
          <AddProduct
            onComplete={() => setModalType(null)}
            onCreated={(product) => {
              setSelectedProductId(product.id)
              setModalType("create-bale")
            }}
          />
        </MyModal>
      )}
    </>
  );
}

export default Products
