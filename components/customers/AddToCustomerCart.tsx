"use client"
import { AdminAddToCart, SingleBale, SubCategoryDetails, SupplierDetails, TypeDetails } from '@/types/types'
import React, { useEffect, useState } from 'react'
import { useToast } from '../ui/toast/ToastContext'
import { Button, FileUpload, Input } from '../ui'
import { useAddToCart } from '@/api/cart'
import { useGetSuppliers } from '@/api/supplier'
import { useGetCategories, useGetProductTypes, useGetSubCategory } from '@/api/product'
import { currencies } from "@/lib/currencies";
import { useGetBales } from '@/api/bales'
import { truncateText } from '@/lib/funcs'
import { describeApiError, getApiError } from '@/lib/api-error'
import { useNestedForm } from '@/hooks/use-nested-form'
import { fmtNgn } from '@/lib/format'

type Props = {
  customerId: number;
  onSuccess: () => void;
  customerInfo: {
    phone?: string;
    email: string;
    name?: string
  };
};

const defaultValues = {
  customer: {
    email: "",
    phone: "",
  },
  productId: 0,
  quantity: 1,
  type: "",
  product: {
    name: "",
    description: "",
    currency: "",
    price: 0,
    oldPrice: 0,
    supplierId: 0,
    categoryId: 0,
    subCategoryId: 0,
    productTypeId: 0,
    images: [] as string[],
  },
  sizes: [],
};

type ColorType = {
  color: string;
  otherColor: string;
  images: string[];
};

export const COMMON_COLORS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Pink",
  "Purple",
  "Orange",
  "Brown",
  "Grey",
  "Silver",
  "Gold",
  "Beige",
  "Navy",
  "Maroon",
  "Olive",
  "Teal",
  "Cream",
  "Multicolor",
];

export const COMMON_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "One Size",
];

const AddToCustomerCart = ({ onSuccess, customerInfo, customerId }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>({});
  const [isFetchSups, setIsFetchSups] = useState(false);
  const [isFetchCats, setIsFetchCats] = useState(false);
  const { formValues, setFormValues, handleChange } = useNestedForm(defaultValues);

  useEffect(() => {
    if (!searchTerm) {
      setDebouncedSearch("");
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (customerInfo) {
      // @ts-ignore
      setFormValues((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          phone: customerInfo.phone,
          email: customerInfo.email,
        },
      }));
    }
  }, [customerInfo]);
  

  const { mutateAsync: addToCart, isPending: addToCartPending, error: addToCartError } = useAddToCart();
  const { data: suppliers, isPending: isSuppliersPending } = useGetSuppliers({enabled: isFetchSups});
  const { data: cats, isPending: isCatPending } = useGetCategories({enabled: isFetchCats});
  const { data: subCats, isPending: isSubCatPending } = useGetSubCategory(formValues.product.categoryId);
  const { data: productTypes, isPending: isTypesPending } = useGetProductTypes(formValues.product.subCategoryId);
  const { data: bales, isPending: isBalesPending, error: baleError } = useGetBales({search: searchTerm});

  const baleData = bales?.data ?? [];

  const [colors, setColors] = useState<ColorType[]>([]);
  const [currentColor, setCurrentColor] = useState({
    color: "",
    otherColor: "",
  });

  const [sizes, setSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState(""); 
  const [sizeInput, setSizeInput] = useState("");
  const [sizeChecked, setSizeChecked] = useState(false);
  const [step, setStep] = useState(1);

  const { toast } = useToast();

  const options = [
    { label: 'Existing', value: 'existing' },
    { label: 'New', value: 'new' },
  ];

  const filterSuppliers = suppliers?.map((supplier: SupplierDetails) => ({
    label: supplier.clubCode
      ? `${supplier.name} (${supplier.clubCode})`
      : supplier.name,
    value: supplier.id,
  }));
  const filterCats = cats?.map((cat: SubCategoryDetails) => ({
    label: cat.name,
    value: cat.id,
  }));
  const filterSubCats = subCats?.map((subcat: SubCategoryDetails) => ({
    label: subcat.name,
    value: subcat.id,
  }));
  const filterTypes = productTypes?.map((type: TypeDetails) => ({
    label: type.name,
    value: type.id,
  }));
  
  const handleAddColor = () => {
    const colorName = currentColor.color.trim();
    if (!colorName) return;

    // prevent duplicates (optional but useful)
    const exists = colors.some(
      (c) => c.color.toLowerCase() === colorName.toLowerCase(),
    );
    if (exists) return;

    const newColor = {
      color: colorName,
      otherColor: currentColor.otherColor,
      images: [],
    };

    setColors((prev) => [...prev, newColor]);

    // reset form
    setCurrentColor({
      color: "",
      otherColor: "",
    });
  };

  const getAssignedColorName = (imageUrl: string): string | null => {
    const assigned = colors.find((c) => c.images.includes(imageUrl));
    return assigned?.color ?? null;
  };

  const assignImageToColor = (imageUrl: string, rawColorName: string) => {
    const colorName = rawColorName.trim();
    if (!colorName) return;
    setColors((prev) => {
      // ensure one image belongs to only one color
      const detached = prev.map((c) => ({
        ...c,
        images: c.images.filter((img) => img !== imageUrl),
      }));
      const targetIndex = detached.findIndex(
        (c) => c.color.toLowerCase() === colorName.toLowerCase(),
      );
      if (targetIndex >= 0) {
        const target = detached[targetIndex];
        const nextTarget = target.images.includes(imageUrl)
          ? target
          : { ...target, images: [...target.images, imageUrl] };
        return detached.map((c, i) => (i === targetIndex ? nextTarget : c));
      }
      return [
        ...detached,
        { color: colorName, otherColor: "", images: [imageUrl] },
      ];
    });
  };

  const removeImageFromColors = (imageUrl: string) => {
    setColors((prev) =>
      prev.map((c) => ({
        ...c,
        images: c.images.filter((img) => img !== imageUrl),
      })),
    );
  };

  const handleToggleColorImage = (imageUrl: string, checked: boolean) => {
    if (!checked) {
      removeImageFromColors(imageUrl);
      return;
    }
    const existingName = getAssignedColorName(imageUrl) ?? "";
    const promptName = window.prompt(
      "Enter color name for this image",
      existingName,
    );
    if (!promptName || !promptName.trim()) return;
    assignImageToColor(imageUrl, promptName);
  };

  const isObjectComplete = (obj: Record<string, unknown>): boolean => {
    return Object.values(obj).every((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "number") return value !== 0;
      if (typeof value === "string") return value.trim() !== "";
      return value !== null && value !== undefined;
    });
  };

  const nextStep = () => {
    if (!isObjectComplete(formValues.product)) {
      toast({
        title: "Error",
        description: "Please fill in all product fields",
        variant: "danger",
      });
      return;
    }
    setStep(step + 1);
  }

  const stepLabels = ["General", "Variants", "Quantity"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = formValues.customer.email.trim();
    const phone = formValues.customer.phone.trim();
    if (!email && !phone) {
      toast({ title: "Who is this for?", description: "Enter the customer's email or phone.", variant: "warning" });
      return;
    }
    const customer = { ...(email && { email }), ...(phone && { phone }) };

    const fail = (error: unknown) => {
      const parsed = getApiError(error);
      toast({
        title: "Could not add to the cart",
        description: describeApiError(parsed),
        variant: "danger",
        duration: 6000,
      });
    };
    const done = () => {
      toast({ title: "Success", description: "Added to the customer's cart", variant: "success" });
      setFormValues(defaultValues);
      setColors([]);
      setSizes([]);
      setSelectedProduct({});
      setDisplayValue("");
      setStep(1);
      onSuccess();
    };

    if (formValues.type == "existing") {
      if (!(Number(formValues.productId) > 0)) {
        toast({ title: "Pick a product", description: "Search for the product to add first.", variant: "warning" });
        return;
      }
      try {
        await addToCart({
          type: formValues.type,
          customer,
          productId: Number(formValues.productId),
          quantity: Number(formValues.quantity),
        } as AdminAddToCart);
        done();
      } catch (error) {
        fail(error);
      }
      return;
    }

    if (formValues.type == "new") {
      // The new product is only complete after the last step; earlier steps use their own buttons.
      if (step !== 3) return;
      const resolvedImages = formValues.product.images.map((img) => img.trim()).filter(Boolean);
      const payload = {
        type: formValues.type,
        customer,
        quantity: Number(formValues.quantity),
        product: {
          product: {
            name: formValues.product.name,
            description: formValues.product.description,
            price: Number(formValues.product.price),
            oldPrice: Number(formValues.product.oldPrice),
            currency: formValues.product.currency,
            supplierId: Number(formValues.product.supplierId),
            subCategoryId: Number(formValues.product.subCategoryId),
            productTypeId: Number(formValues.product.productTypeId),
            images: resolvedImages,
          },
          colors: colors,
          sizes: sizes,
        },
      };
      try {
        await addToCart(payload as AdminAddToCart);
        done();
      } catch (error) {
        fail(error);
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <fieldset className="border border-(--table-border) px-4 rounded-md">
          <legend className="text-sm font-medium text-(--muted)">
            Customer Information
          </legend>
          <Input
            input_type="text"
            element="input"
            placeholder="Enter customer email"
            tag="Customer Email"
            name="customer.email"
            value={customerInfo.email}
            handler={handleChange}
            optional
            helperText="Give the customer's email, their phone, or both."
            disabled
          />
          <Input
            input_type="tel"
            element="input"
            placeholder="Enter customer phone"
            tag="Customer Phone"
            name="customer.phone"
            value={customerInfo.phone!}
            handler={handleChange}
            optional
            disabled
          />
        </fieldset>
        <fieldset className="border border-(--table-border) px-4 rounded-md mt-4">
          <legend className="text-sm font-medium text-(--muted)">
            Product Information
          </legend>
          <Input
            element="select"
            placeholder="Select product type"
            tag="Product"
            name="type"
            value={formValues.type}
            handler={handleChange}
            selectOptions={options}
            required
          />

          {formValues.type === "new" && (
            <>
              <div className="flex flex-row items-center justify-center gap-3 sm:gap-6 mb-6 pt-5">
                {stepLabels.map((label, idx) => {
                  const n = idx + 1;
                  const active = step >= n;
                  return (
                    <div
                      key={label}
                      className="flex items-center"
                    >
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-sm font-bold ${
                          active
                            ? "bg-(--primary) text-(--surface)"
                            : "bg-(--elevated) text-(--muted)"
                        }`}
                      >
                        {n}
                      </div>
                      {idx < 2 && (
                        <div
                          className={`hidden sm:block w-8 h-0.5 ${
                            step > n ? "bg-(--primary)" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {step === 1 && (
                <div>
                  <Input
                    input_type="text"
                    element="input"
                    placeholder="Enter product name"
                    tag="Product Name"
                    name="product.name"
                    value={formValues.product.name}
                    handler={handleChange}
                  />

                  <FileUpload
                    label="Product Images"
                    name="image"
                    fileType="image"
                    maxSizeMB={3}
                    initialUrls={formValues.product.images}
                    onFilesChange={(urls) => {
                      setFormValues((prev) => ({
                        ...prev,
                        product: {
                          ...prev.product,
                          images: urls,
                        },
                      }));
                    }}
                  />

                  <Input
                    element="select"
                    placeholder="Enter currency"
                    tag="Currency"
                    name="product.currency"
                    value={formValues.product.currency}
                    handler={handleChange}
                    selectOptions={currencies}
                  />

                  <Input
                    input_type="number"
                    element="input"
                    placeholder="Enter price"
                    tag="Product Price"
                    name="product.price"
                    value={formValues.product.price}
                    handler={handleChange}
                  />

                  <Input
                    input_type="number"
                    element="input"
                    placeholder="Enter old price"
                    tag="Old Price"
                    name="product.oldPrice"
                    value={formValues.product.oldPrice}
                    handler={handleChange}
                  />

                  <Input
                    element="select"
                    placeholder="Enter your supplier"
                    tag="Supplier"
                    name="product.supplierId"
                    value={formValues.product.supplierId}
                    handler={handleChange}
                    selectOptions={filterSuppliers}
                    onFocus={() => setIsFetchSups(true)}
                  />

                  <Input
                    element="select"
                    placeholder="Enter your category"
                    tag="Category"
                    name="product.categoryId"
                    value={formValues.product.categoryId}
                    handler={handleChange}
                    selectOptions={filterCats}
                    onFocus={() => setIsFetchCats(true)}
                  />

                  <Input
                    element="select"
                    placeholder="Enter your sub-category"
                    tag="Sub-category"
                    name="product.subCategoryId"
                    value={formValues.product.subCategoryId}
                    handler={handleChange}
                    selectOptions={filterSubCats}
                  />

                  <Input
                    element="select"
                    placeholder="Enter product type"
                    tag="Product Type"
                    name="product.productTypeId"
                    value={formValues.product.productTypeId}
                    handler={handleChange}
                    selectOptions={filterTypes}
                  />

                  <Input
                    element="textarea"
                    placeholder="Enter description"
                    tag="Product Description"
                    name="product.description"
                    value={formValues.product.description}
                    handler={handleChange}
                  />

                  <Button
                    type="button"
                    primary
                    className="justify-self-end mb-2"
                    disabled={!isObjectComplete(formValues.product)}
                    onClick={nextStep}
                  >
                    Next
                  </Button>
                </div>
              )}

              {step === 2 && (
                <>
                  <div className="mb-3">
                    <div className="mb-2 flex flex-wrap gap-4">
                      {colors.map((c, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {c.images[0] ? (
                            <img
                              src={c.images[0]}
                              className="w-4 h-4 object-cover rounded"
                            />
                          ) : (
                            <span className="inline-block h-4 w-4 rounded border border-(--table-border)" />
                          )}
                          <span>{c.color}</span>

                          <button
                            type="button"
                            onClick={() =>
                              setColors((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                            className="bg-red-500 p-1 rounded text-white text-[8px]"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <p className="mb-2 text-sm font-medium">
                        Select images for colors
                      </p>
                      {formValues.product.images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                          {formValues.product.images.map((url, idx) => {
                            const assignedColor = getAssignedColorName(url);
                            return (
                              <label
                                key={`${url}-${idx}`}
                                className="relative overflow-hidden rounded-md border border-(--table-border)"
                              >
                                <img
                                  src={url}
                                  alt={`Product image ${idx + 1}`}
                                  className="h-24 w-full object-cover"
                                />
                                <div className="absolute left-0 right-0 top-0 flex items-center justify-between bg-black/55 px-2 py-1 text-xs text-white">
                                  <span>
                                    {assignedColor
                                      ? assignedColor
                                      : "Unassigned"}
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={!!assignedColor}
                                    onChange={(e) =>
                                      handleToggleColorImage(
                                        url,
                                        e.target.checked,
                                      )
                                    }
                                    className="h-3.5 w-3.5 accent-sky-500"
                                  />
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-(--muted)">
                          Add product images first, then assign selected images
                          to colors here.
                        </p>
                      )}
                    </div>

                    <Input
                      element="select"
                      placeholder="Enter color name"
                      tag="Color"
                      name="color"
                      value={currentColor.color}
                      handler={(e) =>
                        setCurrentColor({
                          ...currentColor,
                          color: e.target.value,
                        })
                      }
                      selectOptions={COMMON_COLORS.map((color) => ({
                        label: color,
                        value: color,
                      }))}
                    />

                    <Button
                      type="button"
                      primary
                      disabled={!currentColor.color}
                      onClick={handleAddColor}
                    >
                      Add Color
                    </Button>
                  </div>

                  <div>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {sizes.map((size, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-200 rounded"
                        >
                          {size}
                          <button
                            type="button"
                            onClick={() =>
                              setSizes((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                            className="ml-1 text-gray-500 hover:text-red-500 leading-none"
                            aria-label={`Remove size ${size}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                    <Input
                      element="select"
                      placeholder="Enter size"
                      tag="Sizes"
                      name="sizeInput"
                      value={sizeInput}
                      handler={(e) => setSizeInput(e.target.value)}
                      selectOptions={COMMON_SIZES.map((size) => ({
                        label: size,
                        value: size,
                      }))}
                      disabled={sizeChecked}
                    />
                    <div className="flex gap-1 items-center -mt-3">
                      <input
                        type="checkbox"
                        checked={sizeChecked}
                        onChange={(e) => setSizeChecked(e.target.checked)}
                      />
                      <span className="text-(--muted) text-xs">
                        Add custom size
                      </span>
                    </div>

                    {sizeChecked && (
                      <Input
                        input_type="text"
                        element="input"
                        placeholder="Enter custom size"
                        name="customSize"
                        value={customSize}
                        handler={(e) => setCustomSize(e.target.value)}
                      />
                    )}

                    <Button
                      type="button"
                      primary
                      disabled={
                        sizeChecked ? customSize === "" : sizeInput === ""
                      }
                      onClick={() => {
                        const valueToAdd = sizeChecked
                          ? customSize.trim()
                          : sizeInput.trim();
                        if (!valueToAdd) return;

                        setSizes((prev) =>
                          prev.includes(valueToAdd)
                            ? prev
                            : [...prev, valueToAdd],
                        );

                        sizeChecked ? setCustomSize("") : setSizeInput("");
                      }}
                      className="mt-2"
                    >
                      Add Size
                    </Button>
                  </div>

                  <div className="flex gap-2 justify-end mb-2">
                    <Button type="button" onClick={() => setStep((prev) => prev - 1)}>
                      Previous
                    </Button>
                    <Button
                      type="button"
                      primary
                      disabled={sizes.length == 0 || colors.length == 0}
                      onClick={() => setStep((prev) => prev + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <Input
                    input_type="number"
                    element="input"
                    placeholder="Enter quantity"
                    tag="Quantity"
                    name="quantity"
                    value={formValues.quantity}
                    handler={handleChange}
                  />
                  <Button type="button" onClick={() => setStep((prev) => prev - 1)}>
                    Previous
                  </Button>
                </>
              )}
            </>
          )}
          {formValues.type === "existing" && (
            <>
              <div className="relative">
                <Input
                  element="input"
                  name="searchTerm"
                  value={searchTerm}
                  handler={(e) => setSearchTerm(e.target.value)}
                  tag="Add a product"
                  placeholder="Search for a product"
                  helperText="Prices are in naira and are kept exactly as typed on the order."
                />

                {searchTerm.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-(--table-border) bg-(--background) shadow-lg">
                    {isBalesPending ? (
                      <p className="p-3 text-sm text-(--muted)">Searching products...</p>
                    ) : baleError ? (
                      <p className="p-3 text-sm text-red-500">Failed to search products. Try again.</p>
                    ) : baleData.length > 0 ? (
                      baleData.map((bale) => (
                        <button
                          key={bale.id}
                          type="button"
                          onClick={() => {
                            setFormValues((prev) => ({
                              ...prev,
                              productId: bale.product.id,
                            }));
                            setSearchTerm("");
                            setDisplayValue("");
                            setSelectedProduct(bale);
                          }}
                          className="flex w-full items-center gap-3 p-3 text-left hover:bg-(--elevatedHover) cursor-pointer"
                        >
                          {bale.product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={bale.product.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-(--table-border)" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{bale.product.name}</p>
                            <p className="text-xs text-(--muted)">{fmtNgn(Number(bale.price))}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="p-3 text-sm text-(--muted)">No products found.</p>
                    )}
                  </div>
                )}

                {Object.keys(selectedProduct).length !== 0 && (
                  <div className="flex items-center gap-2 bg-(--elevated) p-2 rounded -mt-3 ">
                    <img
                      src={selectedProduct?.product?.images?.[0]}
                      alt={selectedProduct?.product?.name}
                      className="w-10 h-10 rounded-sm aspect-square object-cover"
                    />
                    <div>
                      <p className='text-sm'>
                        {truncateText(selectedProduct?.product?.name, 45)}
                      </p>
                      <p className="text-xs text-(--muted)">{fmtNgn(Number(selectedProduct?.price * formValues.quantity))} for {formValues.quantity} units</p>
                    </div>
                  </div>
                )}
              </div>

              <Input
                input_type="number"
                element="input"
                placeholder="Enter quantity"
                tag="Quantity"
                name="quantity"
                value={formValues.quantity}
                handler={handleChange}
              />
            </>
          )}
        </fieldset>
        {(formValues.type === "existing" || (formValues.type === "new" && step === 3)) && (
          <Button primary className="mt-4" type="submit" isLoading={addToCartPending}>
            Add to cart
          </Button>
        )}
      </form>
    </div>
  );
}

export default AddToCustomerCart