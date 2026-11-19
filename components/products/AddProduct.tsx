"use client";

import React, { useEffect, useState } from "react";
import { AmountInput, Button, FileUpload, Input } from "../ui";
import { useGetSuppliers } from "@/api/supplier";
import {
  useCreateProduct,
  useCreateTelegramProduct,
  useGetProductTypes,
  useGetCategories,
  useGetSubCategory,
} from "@/api/product";
import type {
  AddProductForm,
  DuplicateMatch,
  ProductPurchaseOptions,
  ProductVisibility,
  SubCategoryDetails,
  SupplierDetails,
  TypeDetails,
} from "@/types/types";
import { currencies } from "@/lib/currencies";
import { getApiError, issuesByField } from "@/lib/api-error";
import { PRODUCT_VISIBILITIES } from "@/lib/enums";
import { useCan } from "@/hooks/use-can";
import PurchaseOptionsStep from "./PurchaseOptionsStep";
import VariantsStep, { type ColorType } from "./VariantsStep";

export type AddProductInitialDraft = {
  name?: string;
  description?: string;
  currency?: string;
  price?: number;
  oldPrice?: number;
  supplierId?: number;
  categoryId?: number;
  subCategoryId?: number;
  productTypeId?: number;
  images?: string[];
  sizes?: string[];
  link?: string;
};

type AddProductProps = {
  initialDraft?: AddProductInitialDraft | null;
  /** Called when the whole flow is over: the product is saved and the bale step has been dealt with. */
  onComplete?: () => void;
  /** Called with the new product. The parent opens the bale form itself, so no dialog is nested in this one. */
  onCreated?: (product: { id: number; name: string }) => void;
};

type GeneralValues = {
  name: string;
  description: string;
  currency: string;
  price: number;
  oldPrice: number;
  supplierId: string;
  categoryId: string;
  subCategoryId: string;
  productTypeId: string;
  link: string;
  images: string[];
  visibility: ProductVisibility;
};

const emptyGeneral: GeneralValues = {
  name: "",
  description: "",
  currency: "",
  price: 0,
  oldPrice: 0,
  supplierId: "",
  categoryId: "",
  subCategoryId: "",
  productTypeId: "",
  link: "",
  images: [],
  visibility: "PUBLIC",
};

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

const AddProduct = ({ initialDraft, onComplete, onCreated }: AddProductProps) => {
  // A Telegram draft arrives with image links. That create endpoint takes no visibility or purchase options.
  const isTelegramDraft = (initialDraft?.images?.length ?? 0) > 0;
  const canSetPurchaseOptions = useCan("product.purchaseOptions");
  const showPurchaseStep = !isTelegramDraft && canSetPurchaseOptions;
  const stepKeys = showPurchaseStep ? (["general", "purchase", "variants"] as const) : (["general", "variants"] as const);
  const stepLabels = { general: "General info", purchase: "Purchase options", variants: "Variants" } as const;

  const [stepIndex, setStepIndex] = useState(0);
  const step = stepKeys[stepIndex];
  const [general, setGeneral] = useState<GeneralValues>(emptyGeneral);
  const [purchaseOptions, setPurchaseOptions] = useState<ProductPurchaseOptions[]>([]);
  const [colors, setColors] = useState<ColorType[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);

  const [isFetchSups, setIsFetchSups] = useState(false);
  const [isFetchCats, setIsFetchCats] = useState(false);


  const { data: suppliers } = useGetSuppliers({ enabled: isFetchSups });
  const { data: cats } = useGetCategories({ enabled: isFetchCats });
  const { data: subCats } = useGetSubCategory(Number(general.categoryId));
  const { data: productTypes } = useGetProductTypes(Number(general.subCategoryId));
  const create = useCreateProduct();
  const createTelegram = useCreateTelegramProduct();
  const submitting = create.isPending || createTelegram.isPending;
  const submitError = create.error ?? createTelegram.error;
  const parsedError = submitError ? getApiError(submitError) : null;
  const fieldErrors = parsedError ? issuesByField(parsedError) : {};

  // A draft from the Telegram thread fills the form once when it arrives.
  useEffect(() => {
    if (!initialDraft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStepIndex(0);
    setGeneral((prev) => ({
      ...prev,
      name: initialDraft.name ?? prev.name,
      description: initialDraft.description ?? prev.description,
      currency: initialDraft.currency ?? prev.currency,
      price: Number.isFinite(initialDraft.price) ? (initialDraft.price as number) : prev.price,
      oldPrice: Number.isFinite(initialDraft.oldPrice) ? (initialDraft.oldPrice as number) : prev.oldPrice,
      supplierId: initialDraft.supplierId != null ? String(initialDraft.supplierId) : prev.supplierId,
      categoryId: initialDraft.categoryId != null ? String(initialDraft.categoryId) : prev.categoryId,
      subCategoryId: initialDraft.subCategoryId != null ? String(initialDraft.subCategoryId) : prev.subCategoryId,
      productTypeId: initialDraft.productTypeId != null ? String(initialDraft.productTypeId) : prev.productTypeId,
      link: initialDraft.link ?? prev.link,
      images: Array.isArray(initialDraft.images) && initialDraft.images.length > 0 ? initialDraft.images : prev.images,
    }));
    if (Array.isArray(initialDraft.sizes)) {
      setSizes(Array.from(new Set(initialDraft.sizes.map((item) => String(item).trim()).filter(Boolean))));
    }
  }, [initialDraft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGeneral((prev) => {
      const next = { ...prev, [name]: value };
      // A different category has different sub-categories, and so on down.
      if (name === "categoryId") {
        next.subCategoryId = "";
        next.productTypeId = "";
      }
      if (name === "subCategoryId") next.productTypeId = "";
      return next;
    });
  };

  /** What still has to be filled in before the first step can be left, by the backend's own rules. */
  const missingGeneral = [
    !general.name.trim() && "name",
    general.images.length === 0 && "at least one image",
    !general.currency && "currency",
    !(general.price > 0) && "price",
    !(general.oldPrice > 0) && "old price",
    !general.supplierId && "supplier",
    !general.categoryId && "category",
    !general.subCategoryId && "sub-category",
    !general.productTypeId && "product type",
  ].filter(Boolean) as string[];
  const oldPriceTooLow = general.oldPrice > 0 && general.oldPrice <= general.price;
  const generalReady = missingGeneral.length === 0 && !oldPriceTooLow;

  const buildBody = (allowDuplicate: boolean): AddProductForm => {
    const images = general.images.map((img) => img.trim()).filter(Boolean);
    return {
      product: {
        name: general.name.trim(),
        description: general.description.trim() || undefined,
        currency: general.currency,
        price: Number(general.price),
        oldPrice: Number(general.oldPrice),
        supplierId: Number(general.supplierId),
        subCategoryId: Number(general.subCategoryId),
        productTypeId: Number(general.productTypeId),
        images,
        // The telegram endpoint takes neither visibility nor purchase options.
        ...(isTelegramDraft
          ? { platform: "telegram", status: true, link: general.link.trim() || undefined }
          : { visibility: general.visibility }),
      } as unknown as AddProductForm["product"],
      colors,
      sizes,
      ...(allowDuplicate && { allowDuplicate: true }),
      ...(!isTelegramDraft && purchaseOptions.length > 0 && { purchaseOptions }),
    };
  };

  const resetAll = () => {
    setGeneral(emptyGeneral);
    setPurchaseOptions([]);
    setColors([]);
    setSizes([]);
    setDuplicates(null);
    setStepIndex(0);
  };

  const submit = (allowDuplicate: boolean) => {
    if (colors.length === 0) return;

    if (isTelegramDraft) {
      const images = general.images.map((img) => img.trim()).filter(Boolean);
      if (images.length === 0 || images.some((url) => !isHttpUrl(url))) return;
      if (colors.some((c) => c.images.some((img) => !isHttpUrl(img)))) return;
    }

    setDuplicates(null);
    const run = isTelegramDraft ? createTelegram : create;
    run.mutate(buildBody(allowDuplicate), {
      onSuccess: (res) => {
        const product = res.data?.data?.product;
        resetAll();
        if (product && onCreated) onCreated({ id: product.id, name: product.name });
        else onComplete?.();
      },
      onError: (raw) => {
        const error = getApiError(raw);
        if (error.code === "DUPLICATE_PRODUCT") {
          const matches = (error.details as { matches?: DuplicateMatch[] } | undefined)?.matches;
          setDuplicates(Array.isArray(matches) ? matches : []);
        }
      },
    });
  };

  const supplierOptions = suppliers?.map((supplier: SupplierDetails) => ({
    label: supplier.clubCode ? `${supplier.name} (${supplier.clubCode})` : supplier.name,
    value: String(supplier.id),
  }));
  const categoryOptions = cats?.map((cat: SubCategoryDetails) => ({ label: cat.name, value: String(cat.id) }));
  const subCategoryOptions = subCats?.map((sub: SubCategoryDetails) => ({ label: sub.name, value: String(sub.id) }));
  const typeOptions = productTypes?.map((type: TypeDetails) => ({ label: type.name, value: String(type.id) }));

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
        onSubmit={(e) => {
          e.preventDefault();
          // Pressing Enter in an earlier step must not create the product; only the last step does.
          if (step === "variants") submit(false);
        }}
      >
        {step === "general" && (
          <div>
            <Input input_type="text" element="input" placeholder="Enter product name" tag="Product name" name="name" value={general.name} handler={handleChange} required maxLength={500} />

            {isTelegramDraft ? (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium">Selected images</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {general.images.map((url, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={`${url}-${idx}`} src={url} alt={`Selected media ${idx + 1}`} className="h-24 w-full rounded-md border border-(--table-border) object-cover" />
                  ))}
                </div>
                <p className="mt-2 text-xs text-(--muted)">These links are used as they are for the Telegram product.</p>
              </div>
            ) : (
              <FileUpload
                label="Product images"
                name="image"
                fileType="image"
                maxSizeMB={3}
                initialUrls={general.images}
                onFilesChange={(urls) => {
                  setGeneral((prev) => ({ ...prev, images: urls }));
                  // An image that was removed can no longer belong to a colour.
                  setColors((prev) => prev.map((c) => ({ ...c, images: c.images.filter((img) => urls.includes(img)) })));
                }}
              />
            )}

            {isTelegramDraft && (
              <Input input_type="text" element="input" placeholder="https://t.me/channel/post" tag="Telegram source link" name="link" value={general.link} handler={handleChange} optional />
            )}

            <Input element="select" placeholder="Select currency" tag="Currency" name="currency" value={general.currency} handler={handleChange} selectOptions={currencies} helperText="The currency the prices below are in." required />
            <AmountInput tag="Product price" name="price" placeholder="Enter price" value={general.price} onChange={(n) => setGeneral((p) => ({ ...p, price: n }))} required error={fieldErrors["product.price"]} />
            <AmountInput
              tag="Old price"
              name="oldPrice"
              placeholder="Enter old price"
              value={general.oldPrice}
              onChange={(n) => setGeneral((p) => ({ ...p, oldPrice: n }))}
              helperText="Shown crossed out next to the price, so it should be higher."
              required
              error={fieldErrors["product.oldPrice"] ?? (oldPriceTooLow ? "Old price must be higher than the price." : undefined)}
            />

            <Input element="select" placeholder="Select a supplier" tag="Supplier" name="supplierId" value={general.supplierId} handler={handleChange} selectOptions={supplierOptions} onFocus={() => setIsFetchSups(true)} required error={fieldErrors["product.supplierId"]} />
            <Input element="select" placeholder="Select a category" tag="Category" name="categoryId" value={general.categoryId} handler={handleChange} selectOptions={categoryOptions} onFocus={() => setIsFetchCats(true)} required />
            <Input element="select" placeholder="Select a sub-category" tag="Sub-category" name="subCategoryId" value={general.subCategoryId} handler={handleChange} selectOptions={subCategoryOptions} required error={fieldErrors["product.subCategoryId"]} />
            <Input element="select" placeholder="Select a product type" tag="Product type" name="productTypeId" value={general.productTypeId} handler={handleChange} selectOptions={typeOptions} required error={fieldErrors["product.productTypeId"]} />
            <Input element="textarea" placeholder="Enter description" tag="Product description" name="description" value={general.description} handler={handleChange} optional />

            {!isTelegramDraft && (
              <Input element="input" input_type="radio" tag="Who can see it" name="visibility" value={general.visibility} radioOptions={[...PRODUCT_VISIBILITIES]} handler={handleChange} required />
            )}

            {!generalReady && missingGeneral.length > 0 && (
              <p className="mb-2 text-xs text-(--muted)">Still needed: {missingGeneral.join(", ")}.</p>
            )}
            <div className="flex justify-end">
              <Button type="button" primary disabled={!generalReady} onClick={() => setStepIndex(1)}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === "purchase" && (
          <>
            <PurchaseOptionsStep options={purchaseOptions} onChange={setPurchaseOptions} />
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={() => setStepIndex(0)}>
                Previous
              </Button>
              <Button type="button" primary onClick={() => setStepIndex(2)}>
                Next
              </Button>
            </div>
          </>
        )}

        {step === "variants" && (
          <>
            <VariantsStep images={general.images} colors={colors} onColorsChange={setColors} sizes={sizes} onSizesChange={setSizes} />

            {duplicates && (
              <div role="alert" className="my-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm">
                <p className="font-semibold">This looks like a product that already exists.</p>
                <ul className="mt-2 space-y-1">
                  {duplicates.map((m) => (
                    <li key={m.productId}>
                      #{m.productId} {m.name ?? "(no name)"}{" "}
                      <span className="text-(--muted)">
                        {m.reasons.map((r) => r.toLowerCase().replace(/_/g, " ")).join(", ")}
                        {m.visibility ? `, ${m.visibility.toLowerCase()}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-(--muted)">Open the existing product instead, or confirm this one is different.</p>
                <div className="mt-2 flex gap-2">
                  <Button type="button" onClick={() => setDuplicates(null)}>
                    Go back and check
                  </Button>
                  <Button type="button" primary isLoading={submitting} onClick={() => submit(true)}>
                    It is different, create it
                  </Button>
                </div>
              </div>
            )}

            {parsedError && !duplicates && (
              <p role="alert" className="my-3 text-sm text-red-500">
                {parsedError.message}
                {parsedError.issues.length > 0 ? ": " + parsedError.issues.map((i) => i.message).join("; ") : ""}
              </p>
            )}

            {colors.length === 0 && <p className="mt-3 text-xs text-(--muted)">Add at least one colour to create the product.</p>}
            <div className="mt-4 flex gap-2 justify-end">
              <Button type="button" onClick={() => setStepIndex(stepKeys.length - 2)}>
                Previous
              </Button>
              <Button type="submit" primary isLoading={submitting} disabled={colors.length === 0}>
                {submitting ? "Adding product..." : "Add product"}
              </Button>
            </div>
          </>
        )}
      </form>

    </div>
  );
};

export default AddProduct;
