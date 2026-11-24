"use client";

import React, { useState } from "react";
import { RiErrorWarningFill, RiLoader5Line } from "react-icons/ri";
import { AmountInput, Button, FileUpload, Input, Switch } from "../ui";
import { currencies } from "@/lib/currencies";
import { useEditProduct, useGetPurchaseOptions, useSavePurchaseOptions, type SavedPurchaseOptions, useGetSingleProduct, useGetSubCategories, useGetProductTypes } from "@/api/product";
import { useGetSuppliers } from "@/api/supplier";
import PurchaseOptionsStep from "./PurchaseOptionsStep";
import { useCan } from "@/hooks/use-can";
import { getApiError, issuesByField } from "@/lib/api-error";
import { PRODUCT_VISIBILITIES } from "@/lib/enums";
import type { EditProductForm, ProductPurchaseOptions, ProductVisibility, SingleProduct, SubCategoryDetails, SupplierDetails, TypeDetails } from "@/types/types";

type Props = {
  productId: number;
  onClose?: () => void;
};

const toFormValues = (product: SingleProduct): EditProductForm => ({
  name: product.name ?? "",
  description: product.description ?? "",
  // The admin API returns the price and currency the product is stored in, so saving puts back what was loaded.
  price: product.price ?? 0,
  oldPrice: product.oldPrice ?? 0,
  currency: product.currency ?? "",
  isSpecial: product.isSpecial ?? false,
  subCategoryId: product.subCategoryId ?? 0,
  productTypeId: product.productTypeId ?? 0,
  images: product.images ?? [],
  visibility: product.visibility ?? "PUBLIC",
});

/**
 * Built once the product has loaded, so the image box starts with the product's real images (it only reads
 * them when it first appears), and a background refetch cannot wipe what is being typed.
 */
const stripVersion = ({ version: _version, ...rest }: ProductPurchaseOptions & { version?: number | null }): ProductPurchaseOptions => rest;

/**
 * Built once the product (and, for roles that may set them, its purchase options) has loaded, so the image box
 * starts with the product's real images (it only reads them when it first appears) and a background refetch
 * cannot wipe what is being typed. Looks and steps like AddProduct, with everything prefilled.
 */
const EditProductFields = ({
  product,
  saved,
  onClose,
}: {
  product: SingleProduct;
  saved?: SavedPurchaseOptions;
  onClose?: () => void;
}) => {
  const canSetPurchaseOptions = useCan("products:manage");
  const stepKeys = canSetPurchaseOptions ? (["general", "purchase"] as const) : (["general"] as const);
  const stepLabels = { general: "General info", purchase: "Purchase options" } as const;
  const [stepIndex, setStepIndex] = useState(0);
  const step = stepKeys[stepIndex];

  const [values, setValues] = useState<EditProductForm>(() => toFormValues(product));
  // Options worked out from the price are not saved ones, so they are not copied into the form.
  const [options, setOptions] = useState<ProductPurchaseOptions[]>(() =>
    saved?.source === "SAVED" ? saved.options.map((o) => stripVersion(o)) : [],
  );
  const edit = useEditProduct();
  const saveOptions = useSavePurchaseOptions();
  const isPending = edit.isPending || saveOptions.isPending;
  const parsed = edit.error || saveOptions.error ? getApiError(edit.error ?? saveOptions.error) : null;
  const fieldErrors = parsed ? issuesByField(parsed) : {};

  const { data: suppliers } = useGetSuppliers({ enabled: true });
  const { data: subCategories } = useGetSubCategories();
  const { data: productTypes } = useGetProductTypes(values.subCategoryId);
  const supplier = suppliers?.find((sup: SupplierDetails) => sup.id === product.supplierId);
  const supplierOptions = supplier
    ? [{ label: supplier.clubCode ? `${supplier.name} (${supplier.clubCode})` : supplier.name, value: String(supplier.id) }]
    : [{ label: `Supplier #${product.supplierId}`, value: String(product.supplierId) }];
  const subCategoryOptions = subCategories?.map((sub: SubCategoryDetails) => ({ label: sub.name, value: String(sub.id) }));
  const typeOptions = productTypes?.map((type: TypeDetails) => ({ label: type.name, value: String(type.id) }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const oldPriceTooLow = values.oldPrice > 0 && values.oldPrice <= values.price;
  const noImages = values.images.length === 0;
  const missingGeneral = [
    !values.name.trim() && "product name",
    noImages && "an image",
    !values.currency && "currency",
    values.price <= 0 && "price",
    !values.subCategoryId && "sub-category",
    !values.productTypeId && "product type",
  ].filter((m): m is string => !!m);
  const generalReady = missingGeneral.length === 0 && !oldPriceTooLow;
  const isLast = stepIndex === stepKeys.length - 1;

  const submit = () => {
    if (!generalReady) return;
    edit.mutate(
      {
        id: product.id,
        body: {
          ...values,
          name: values.name.trim(),
          description: values.description.trim(),
          price: Number(values.price),
          oldPrice: Number(values.oldPrice),
          subCategoryId: Number(values.subCategoryId),
          productTypeId: Number(values.productTypeId),
          visibility: values.visibility as ProductVisibility,
        },
      },
      {
        onSuccess: () => {
          if (!canSetPurchaseOptions || options.length === 0) return onClose?.();
          const expectedVersions: Partial<Record<"DIRECT" | "POOL", number>> = {};
          if (saved?.source === "SAVED") for (const o of saved.options) if (o.version != null) expectedVersions[o.mode] = o.version;
          saveOptions.mutate({ productId: product.id, options, expectedVersions }, { onSuccess: () => onClose?.() });
        },
      },
    );
  };

  return (
    <div className="pb-8">
      <ol className="flex flex-row items-center justify-center gap-3 sm:gap-4 mb-6 pt-5" aria-label="Steps">
        {stepKeys.map((key, idx) => {
          const active = stepIndex >= idx;
          return (
            <li key={key} className="flex items-center" aria-current={stepIndex === idx ? "step" : undefined}>
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-sm font-bold ${
                  active ? "bg-(--primary) text-(--surface)" : "bg-(--elevated) text-(--muted)"
                }`}
              >
                {idx + 1}
              </div>
              <span className={`ml-2 mr-3 text-sm hidden sm:inline ${stepIndex === idx ? "font-semibold text-(--primary)" : "text-(--muted)"}`}>
                {stepLabels[key]}
              </span>
              {idx < stepKeys.length - 1 && <div className={`hidden sm:block w-12 h-0.5 ${stepIndex > idx ? "bg-(--primary)" : "bg-gray-300"}`} />}
            </li>
          );
        })}
      </ol>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          // Pressing Enter in an earlier step must not save; only the last step does.
          if (isLast) submit();
        }}
      >
        <div hidden={step !== "general"}>
          <Input input_type="text" element="input" placeholder="Enter product name" tag="Product name" name="name" value={values.name} handler={handleChange} required maxLength={255} error={fieldErrors.name} />
          <FileUpload
            label="Product images"
            name="image"
            fileType="image"
            maxSizeMB={3}
            initialUrls={values.images}
            onFilesChange={(urls) => setValues((prev) => ({ ...prev, images: urls }))}
          />
          <Input element="select" placeholder="Select currency" tag="Currency" name="currency" value={values.currency} handler={handleChange} selectOptions={currencies} helperText="Changing the currency does not convert the prices below." required error={fieldErrors.currency} />
          <AmountInput tag="Product price" name="price" placeholder="Enter price" value={values.price} onChange={(n) => setValues((p) => ({ ...p, price: n }))} required error={fieldErrors.price} />
          <AmountInput
            tag="Old price"
            name="oldPrice"
            placeholder="Enter old price"
            value={values.oldPrice}
            onChange={(n) => setValues((p) => ({ ...p, oldPrice: n }))}
            helperText="Shown crossed out next to the price, so it should be higher."
            optional
            error={fieldErrors.oldPrice ?? (oldPriceTooLow ? "Old price must be higher than the price." : undefined)}
          />
          <Input element="select" placeholder="Supplier" tag="Supplier" name="supplierId" value={String(product.supplierId)} handler={() => {}} selectOptions={supplierOptions} disabled helperText="A product's supplier cannot be changed." />
          <Input element="select" placeholder="Select a sub-category" tag="Sub-category" name="subCategoryId" value={String(values.subCategoryId || "")} handler={handleChange} selectOptions={subCategoryOptions} required error={fieldErrors.subCategoryId} />
          <Input element="select" placeholder="Select a product type" tag="Product type" name="productTypeId" value={String(values.productTypeId || "")} handler={handleChange} selectOptions={typeOptions} required error={fieldErrors.productTypeId} />
          <Input element="textarea" placeholder="Enter description" tag="Product description" name="description" value={values.description} handler={handleChange} optional error={fieldErrors.description} />

          <div className="flex items-center justify-between mb-4 py-2">
            <span className="text-sm font-medium">Special product</span>
            <Switch label="Special product" checked={values.isSpecial} onChange={(v) => setValues((prev) => ({ ...prev, isSpecial: v }))} />
          </div>

          <Input element="input" input_type="radio" tag="Who can see it" name="visibility" value={values.visibility} radioOptions={[...PRODUCT_VISIBILITIES]} handler={handleChange} required />

          {!generalReady && missingGeneral.length > 0 && <p className="mb-2 text-xs text-(--muted)">Still needed: {missingGeneral.join(", ")}.</p>}
        </div>

        {step === "purchase" && <PurchaseOptionsStep options={options} onChange={setOptions} />}

        {parsed && (
          <p role="alert" className="my-3 text-sm text-red-500">
            {parsed.message}
            {parsed.issues.length > 0 && Object.keys(fieldErrors).length === 0 ? ": " + parsed.issues.map((i) => i.message).join("; ") : ""}
          </p>
        )}

        <div className="mt-4 flex gap-2 justify-end">
          {stepIndex > 0 && (
            <Button type="button" onClick={() => setStepIndex(stepIndex - 1)}>
              Previous
            </Button>
          )}
          {isLast ? (
            // The keys make these two different buttons. Without them React reuses one button and flips its type to
            // "submit" while the Next click is still being handled, which saves and closes the dialog.
            <Button key="save" type="submit" primary isLoading={isPending} disabled={!generalReady}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          ) : (
            <Button key="next" type="button" primary disabled={!generalReady} onClick={() => setStepIndex(stepIndex + 1)}>
              Next
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

const EditProduct = ({ productId, onClose }: Props) => {
  const { data: product, isPending: productPending, error } = useGetSingleProduct(productId);
  const canSetPurchaseOptions = useCan("products:manage");
  const { data: saved, isPending: optionsPending } = useGetPurchaseOptions(productId, canSetPurchaseOptions);
  const isPending = productPending || (canSetPurchaseOptions && optionsPending);

  if (isPending) {
    return (
      <div className="h-full flex justify-center items-center">
        <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="h-full flex flex-col gap-2 justify-center items-center">
        <RiErrorWarningFill className="text-red-500" size={60} />
        <p>Could not load this product.</p>
      </div>
    );
  }

  return <EditProductFields key={product.id} product={product} saved={saved} onClose={onClose} />;
};

export default EditProduct;
