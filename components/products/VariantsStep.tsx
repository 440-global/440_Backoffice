"use client";

import React, { useState } from "react";
import { Button, Input } from "../ui";

export type ColorType = {
  color: string;
  otherColor: string;
  images: string[];
};

export const COMMON_COLORS = [
  "Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Orange", "Brown",
  "Grey", "Silver", "Gold", "Beige", "Navy", "Maroon", "Olive", "Teal", "Cream", "Multicolor",
];

export const COMMON_SIZES = [
  "XS", "S", "M", "L", "XL", "XXL", "XXXL", "28", "30", "32", "34", "36", "38", "40", "42", "44", "One Size",
];

type Props = {
  /** The product's images; each can be given to one colour. */
  images: string[];
  colors: ColorType[];
  onColorsChange: (colors: ColorType[]) => void;
  sizes: string[];
  onSizesChange: (sizes: string[]) => void;
};

/**
 * Colours (at least one) and sizes (optional). A colour can be given the product images that show it: pick the
 * colour next to each image. That replaces the old pop-up asking for a name, which allowed typos that made a
 * second, empty colour.
 */
const VariantsStep = ({ images, colors, onColorsChange, sizes, onSizesChange }: Props) => {
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [sizeChecked, setSizeChecked] = useState(false);

  const addColor = () => {
    const name = colorInput.trim();
    if (!name || colors.some((c) => c.color.toLowerCase() === name.toLowerCase())) return;
    onColorsChange([...colors, { color: name, otherColor: "", images: [] }]);
    setColorInput("");
  };

  const colorOf = (url: string) => colors.find((c) => c.images.includes(url))?.color ?? "";

  /** One image belongs to one colour: moving it takes it off the colour that had it. */
  const assign = (url: string, colorName: string) =>
    onColorsChange(
      colors.map((c) => {
        const without = c.images.filter((img) => img !== url);
        return c.color === colorName ? { ...c, images: [...without, url] } : { ...c, images: without };
      }),
    );

  const sizeToAdd = (sizeChecked ? customSize : sizeInput).trim();
  const addSize = () => {
    if (!sizeToAdd) return;
    if (!sizes.includes(sizeToAdd)) onSizesChange([...sizes, sizeToAdd]);
    if (sizeChecked) setCustomSize("");
    else setSizeInput("");
  };

  return (
    <>
      <div className="mb-3">
        <p className="mb-2 text-sm font-medium">
          Colours<span className="text-red-500 ml-1" aria-hidden="true">*</span>
        </p>
        {colors.length === 0 && <p className="mb-2 text-xs text-(--muted)">Add at least one colour.</p>}
        <div className="mb-2 flex flex-wrap gap-4">
          {colors.map((c) => (
            <div key={c.color} className="flex items-center gap-2">
              {c.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.images[0]} alt="" className="w-4 h-4 object-cover rounded" />
              ) : (
                <span className="inline-block h-4 w-4 rounded border border-(--table-border)" />
              )}
              <span>{c.color}</span>
              <button
                type="button"
                onClick={() => onColorsChange(colors.filter((x) => x.color !== c.color))}
                className="bg-red-500 p-1 rounded text-white text-[8px]"
                aria-label={`Remove colour ${c.color}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <Input
          element="select"
          placeholder="Select a colour"
          tag="Colour"
          name="color"
          value={colorInput}
          handler={(e) => setColorInput(e.target.value)}
          selectOptions={COMMON_COLORS.map((color) => ({ label: color, value: color }))}
        />
        <Button type="button" primary disabled={!colorInput} onClick={addColor}>
          Add colour
        </Button>

        {colors.length > 0 && images.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">
              Which colour does each image show? <span className="text-xs font-normal text-(--muted)">(optional)</span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {images.map((url, idx) => (
                <div key={`${url}-${idx}`} className="overflow-hidden rounded-md border border-(--table-border)">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Product image ${idx + 1}`} className="h-24 w-full object-cover" />
                  <select
                    aria-label={`Colour for image ${idx + 1}`}
                    value={colorOf(url)}
                    onChange={(e) =>
                      e.target.value
                        ? assign(url, e.target.value)
                        : onColorsChange(colors.map((c) => ({ ...c, images: c.images.filter((img) => img !== url) })))
                    }
                    className="w-full bg-(--card) p-1 text-xs"
                  >
                    <option value="">Not assigned</option>
                    {colors.map((c) => (
                      <option key={c.color} value={c.color}>
                        {c.color}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex gap-2 flex-wrap mb-2">
          {sizes.map((size) => (
            <span key={size} className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-800 rounded">
              {size}
              <button
                type="button"
                onClick={() => onSizesChange(sizes.filter((s) => s !== size))}
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
          placeholder="Select a size"
          tag="Sizes"
          name="sizeInput"
          value={sizeInput}
          handler={(e) => setSizeInput(e.target.value)}
          selectOptions={COMMON_SIZES.map((size) => ({ label: size, value: size }))}
          disabled={sizeChecked}
          optional
        />
        <label className="flex gap-1 items-center -mt-3 text-xs text-(--muted)">
          <input type="checkbox" checked={sizeChecked} onChange={(e) => setSizeChecked(e.target.checked)} />
          Add a custom size
        </label>
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
        <Button type="button" primary disabled={!sizeToAdd} onClick={addSize} className="mt-2">
          Add size
        </Button>
      </div>
    </>
  );
};

export default VariantsStep;
