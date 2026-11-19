"use client";

import { FormEvent, useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast/ToastContext";
import { Button, FileUpload, Input } from "@/components/ui";
import { useGetAdminRfq, useUpdateAdminRfq } from "@/api/rfqs";
import { rfqContact, rfqLines } from "@/lib/rfq-display";
import { AxiosError } from "axios";
import { RiAddLine, RiCloseLine } from "react-icons/ri";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  rfqOrderId: number;
  onClose?: () => void;
};

type ProductRow = {
  id?: number;
  name: string;
  description: string;
  quantity: number;
  existingImages: string[];
  newImages: string[];
};

const emptyProduct = (): ProductRow => ({
  name: "",
  description: "",
  quantity: 1,
  existingImages: [],
  newImages: [],
});

const EditRfq = ({ rfqOrderId, onClose }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: order } = useGetAdminRfq(rfqOrderId);
  const { mutateAsync: updateRfq, isPending } = useUpdateAdminRfq();

  const [client, setClient] = useState({ name: "", phone: "", email: "", address: "" });
  const [adminNotes, setAdminNotes] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([emptyProduct()]);

  useEffect(() => {
    if (!order) return;
    const contact = rfqContact(order);
    setClient({
      name: contact.name === "—" ? "" : contact.name,
      phone: contact.phone === "—" ? "" : contact.phone,
      email: contact.email === "—" ? "" : contact.email,
      address: contact.address === "—" ? "" : contact.address,
    });
    setAdminNotes(order.adminNotes ?? "");
    const lines = rfqLines(order);
    if (lines.length > 0) {
      setProducts(
        lines.map((l) => ({
          id: l.id,
          name: String(l.name ?? l.productName ?? ""),
          description: String(l.description ?? l.notes ?? ""),
          quantity: Number(l.quantity ?? 1),
          existingImages: (l.images ?? []).filter((img): img is string => typeof img === "string"),
          newImages: [],
        }))
      );
    }
  }, [order]);

  const updateProduct = (index: number, patch: Partial<ProductRow>) => {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const removeExistingImage = (productIndex: number, imgUrl: string) => {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === productIndex
          ? { ...p, existingImages: p.existingImages.filter((img) => img !== imgUrl) }
          : p
      )
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!client.name.trim() || !client.phone.trim()) {
      toast({ variant: "warning", title: "Warning", description: "Client name and phone are required", duration: 2000 });
      return;
    }

    if (products.some((p) => !p.name.trim())) {
      toast({ variant: "warning", title: "Warning", description: "All products must have a name", duration: 2000 });
      return;
    }

    try {
      const res = await updateRfq({
        rfqOrderId,
        body: {
          client: {
            name: client.name.trim(),
            phone: client.phone.trim(),
            email: client.email.trim(),
            address: client.address.trim(),
          },
          products: products.map((p) => ({
            ...(p.id ? { id: p.id } : {}),
            name: p.name.trim(),
            description: p.description.trim(),
            quantity: Number(p.quantity),
            images: [...p.existingImages, ...p.newImages],
          })),
          adminNotes: adminNotes.trim(),
        },
      });

      toast({ variant: "success", title: "Success", description: "RFQ updated", duration: 2000 });
      queryClient.invalidateQueries({ queryKey: ["admin", "rfqs"], exact: false });
      onClose?.();
    } catch (error: unknown) {
      const err = error as AxiosError;
      toast({ variant: "danger", title: "Error", description: err.message || "Something went wrong", duration: 2000 });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client */}
      <div>
        <p className="text-sm font-semibold text-(--muted) uppercase mb-3">Client Info</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input element="input" input_type="text" tag="Name" name="clientName" placeholder="Client name" value={client.name} handler={(e) => setClient((c) => ({ ...c, name: e.target.value }))} />
          <Input element="input" input_type="text" tag="Phone" name="clientPhone" placeholder="Phone number" value={client.phone} handler={(e) => setClient((c) => ({ ...c, phone: e.target.value }))} />
          <Input element="input" input_type="email" tag="Email" name="clientEmail" placeholder="Email address" value={client.email} handler={(e) => setClient((c) => ({ ...c, email: e.target.value }))} />
          <Input element="input" input_type="text" tag="Address" name="clientAddress" placeholder="Address" value={client.address} handler={(e) => setClient((c) => ({ ...c, address: e.target.value }))} />
        </div>
      </div>

      {/* Products */}
      <div>
        <p className="text-sm font-semibold text-(--muted) uppercase mb-3">Products</p>
        <div className="space-y-4">
          {products.map((product, i) => (
            <div key={i} className="rounded-lg border border-(--table-border) p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-(--text)">Item {i + 1}</span>
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setProducts((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-(--muted) hover:text-red-500 transition-colors"
                    aria-label="Remove item"
                  >
                    <RiCloseLine size={18} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Input element="input" input_type="text" tag="Product Name" name={`pname-${i}`} placeholder="Product name" value={product.name} handler={(e) => updateProduct(i, { name: e.target.value })} />
                <Input element="input" input_type="number" tag="Quantity" name={`qty-${i}`} placeholder="Qty" value={product.quantity} handler={(e) => updateProduct(i, { quantity: Number(e.target.value) })} />
              </div>
              <Input element="textarea" tag="Description" name={`desc-${i}`} placeholder="Product description" value={product.description} handler={(e) => updateProduct(i, { description: e.target.value })} />

              {product.existingImages.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">Current Images</p>
                  <div className="flex flex-wrap gap-2">
                    {product.existingImages.map((url) => (
                      <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-(--table-border)">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(i, url)}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                          aria-label="Remove image"
                        >
                          <RiCloseLine size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FileUpload
                label="Add Images"
                name={`images-${i}`}
                fileType="image"
                maxSizeMB={3}
                onFilesChange={(urls) => updateProduct(i, { newImages: urls })}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setProducts((prev) => [...prev, emptyProduct()])}
          className="mt-3 flex items-center gap-1 text-sm text-(--primary) hover:opacity-80 transition-opacity"
        >
          <RiAddLine />
          Add product
        </button>
      </div>

      {/* Admin Notes */}
      <Input
        element="textarea"
        tag="Admin Notes"
        name="adminNotes"
        placeholder="Internal notes (not visible to client)"
        value={adminNotes}
        handler={(e) => setAdminNotes(e.target.value)}
      />

      <Button primary isFullWidth disabled={isPending}>
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
};

export default EditRfq;
