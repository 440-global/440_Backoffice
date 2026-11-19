import { useGetSingleProduct } from "@/api/product";
import React, { useState } from "react";
import BuyingSummaryView from "./BuyingSummaryView";
import { FiInfo } from "react-icons/fi";
import { RiErrorWarningFill, RiLoader5Line } from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "../ui/table/TableWrapper";

type Props = {
  productId: number;
};

const EmptyState = ({ title, message }: { title: string; message: string }) => (
  <div className="my-16 flex flex-col justify-center items-center gap-4">
    <FiInfo size={40} className="text-red-400" />
    <div className="text-center">
      <h2 className="mb-1 text-lg font-bold">{title}</h2>
      <p>{message}</p>
    </div>
  </div>
);

const ViewProduct = ({ productId }: Props) => {
  const { data: product, isPending, error } = useGetSingleProduct(productId);
  const [activeImage, setActiveImage] = useState(0);

  const formatPrice = (price?: number | null) => {
    if (price == null) return "-";
    return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  if (isPending) {
    return (
      <div className="h-full flex justify-center items-center">
        <RiLoader5Line className="animate-spin text-(--primary)" size={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col gap-2 justify-center items-center">
        <RiErrorWarningFill className="text-red-500" size={60} />
        <p>Error occurred while fetching product data.</p>
      </div>
    );
  }

  if (!product) return null;

  const currencySymbol = product.currency || "\u20a6";
  const activeImageSrc = product.images?.[activeImage] ?? product.images?.[0];

  return (
    <div>
      {/* Title + price */}
      <div className="mb-4">
        <h3 className="text-3xl font-bold">{product.name}</h3>
        <div className="flex flex-wrap items-end gap-2 my-4">
          <p className="text-2xl md:text-3xl text-(--primary) font-bold">
            {currencySymbol}
            {formatPrice(product.price)}
          </p>
          {product.oldPrice != null && (
            <p className="text-(--muted) line-through">
              {currencySymbol}
              {formatPrice(product.oldPrice)}
            </p>
          )}
          {product.originalPrice != null && (
            <p className="text-(--muted) text-sm">
              Original: {currencySymbol}
              {formatPrice(product.originalPrice)}
            </p>
          )}
          {!!product.isSpecial && (
            <span className="text-xs px-2 py-1 rounded-full bg-(--primary)/10 text-(--primary)">
              Special
            </span>
          )}
        </div>
      </div>

      {/* Main image + thumbnails */}
      {product.images == null || product.images.length === 0 ? (
        <EmptyState
          title="No Product Images"
          message="There are no images available for this product"
        />
      ) : (
        <div>
          <img
            src={activeImageSrc}
            alt={product.name}
            className="w-full! h-70! object-cover rounded-xl"
          />
          {product.images.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {product.images.map((img, index) => (
                <button
                  key={img + index}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border ${
                    index === activeImage
                      ? "border-(--primary)"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="my-4">
        <h4 className="text-xl font-bold mb-2">Meta Data</h4>
        <div className="text-xs text-(--muted) flex flex-wrap gap-y-2 gap-x-4">
          <span>Product ID: {product.id}</span>
          <span>Supplier ID: {product.supplierId}</span>
          <span>Sub-category ID: {product.subCategoryId}</span>
          <span>Product Type ID: {product.productTypeId}</span>
          {product.createdAt && (
            <span>
              Created: {new Date(product.createdAt).toLocaleDateString()}
            </span>
          )}
          {product.updatedAt && (
            <span>
              Updated: {new Date(product.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="my-4">
        <h4 className="text-xl font-bold">Description</h4>
        <p className="text-(--muted) whitespace-pre-line">
          {product.description}
        </p>
      </div>

      {/* Status / stock info */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <span>
          Status:{" "}
          <span className={product.status ? "text-green-600" : "text-red-500"}>
            {product.status ? "Active" : "Inactive"}
          </span>
        </span>
        {product.rate != null && <span>Rate: {product.rate}</span>}
        {product.positiveFeedbackRate != null && (
          <span>Positive Feedback: {product.positiveFeedbackRate}%</span>
        )}
        {product.reviewsNumber != null && (
          <span>Reviews: {product.reviewsNumber}</span>
        )}
      </div>

      <BuyingSummaryView buying={product.buying} />

      {/* Colors */}
      <div className="mb-4">
        <h4 className="text-xl font-bold">Color</h4>
        {product.Colors == null || product.Colors.length === 0 ? (
          <EmptyState
            title="No Product Colors"
            message="There are no colors available for this product"
          />
        ) : (
          <div className="flex flex-wrap gap-4 mt-2">
            {product.Colors.map((color) => (
              <div
                key={color.id}
                className="w-fit rounded-full text-center flex items-center gap-2"
              >
                <img
                  src={color.images?.[0]}
                  alt={color.color}
                  className="w-12 h-12 object-cover rounded-lg border border-(--primary) p-1"
                />
                <div className="text-start">
                  <span className="text-sm">
                    {color.color}
                    {color.otherColor ? ` (${color.otherColor})` : ""}
                  </span>
                  <div className="text-xs text-(--muted)">
                    Qty: {color.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sizes */}
      <div className="mb-4">
        <h4 className="text-xl font-bold">Sizes</h4>
        {product.ProductSizes == null || product.ProductSizes.length === 0 ? (
          <EmptyState
            title="No Product Sizes"
            message="There are no sizes available for this product"
          />
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {product.ProductSizes.map((size) => (
              <span
                key={size.id}
                className={`px-3 py-1 rounded-full border text-sm ${
                  size.status
                    ? "border-(--primary) text-(--primary)"
                    : "border-(--muted) text-(--muted) line-through"
                }`}
              >
                {size.sizeId}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Variants */}
      <div className="mb-4">
        <h4 className="text-xl font-bold">Variants</h4>
        {product.Variants == null || product.Variants.length === 0 ? (
          <EmptyState
            title="No Product Variants"
            message="There are no variants for this product"
          />
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {product.Variants.map((variant, index) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full border border-(--muted) text-sm"
              >
                {JSON.stringify(variant)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="mb-4">
        <h4 className="text-xl font-bold">Tags</h4>
        {product.ProductTags == null || product.ProductTags.length === 0 ? (
          <p className="text-(--muted) text-sm mt-2">
            No tags for this product
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {product.ProductTags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded bg-(--bg-muted) text-xs"
              >
                {JSON.stringify(tag)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Package info */}
      {product.packageInfo != null && (
        <div className="mb-4">
          <h4 className="text-xl font-bold">Package Info</h4>
          <pre className="text-sm text-(--muted) whitespace-pre-wrap mt-2">
            {JSON.stringify(product.packageInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Prices */}
      {product.prices != null && (
        <div className="mb-4">
          <h4 className="text-xl font-bold">Pricing Details</h4>
          <pre className="text-sm text-(--muted) whitespace-pre-wrap mt-2">
            {JSON.stringify(product.prices, null, 2)}
          </pre>
        </div>
      )}

      {/* Evaluate panel summary */}
      {product.evaluatePanelSummary != null && (
        <div className="mb-4">
          <h4 className="text-xl font-bold">Evaluation Summary</h4>
          <pre className="text-sm text-(--muted) whitespace-pre-wrap mt-2">
            {JSON.stringify(product.evaluatePanelSummary, null, 2)}
          </pre>
        </div>
      )}

      {/* Specifications */}
      <div className="mb-4">
        <h4 className="text-xl font-bold mb-2">Specifications</h4>
        {product.productAttributes == null ? (
          <EmptyState
            title="No Product Specifications"
            message="There are no specifications for this product"
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <Table
              title={`${product.productAttributes.title ?? "Specifications"}`}
            >
              <TableHeader>
                <TableRow>
                  {product.productAttributes.headers?.map((header: string) => (
                    <TableColumn key={header} className="px-4 py-2 text-left">
                      {header}
                    </TableColumn>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.productAttributes.rows?.map(
                  (row: Record<string, unknown>, rowIndex: number) => (
                    <TableRow
                      key={rowIndex}
                      className="odd:bg-(--bg-surface) even:bg-(--bg-muted)"
                    >
                      {product.productAttributes!.headers?.map(
                        (header: string) => (
                          <TableCell key={header} className="px-4 py-2">
                            {(row[header] as React.ReactNode) ?? "-"}
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewProduct;
