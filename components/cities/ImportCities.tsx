"use client";
import { ImportCity, ImportCityMarket } from "@/types/types";
import React, { FormEvent, useState } from "react";
import { Button, Input } from "../ui";
import { useImportCities } from "@/api/cities";
import { useToast } from "../ui/toast/ToastContext";
import { AxiosError } from "axios";

type Props = {
  onSuccess: () => void;
};

const emptyMarket: ImportCityMarket = {
  name: "",
  category: "",
  address: "",
  amap: "",
  appleMap: "",
};

const emptyCity: Omit<ImportCity, "markets"> = {
  city: "",
  province: "",
};

const ImportCities = ({ onSuccess }: Props) => {
  const [markets, setMarkets] = useState<ImportCityMarket[]>([]);
  const [cities, setCities] = useState<ImportCity[]>([]);
  const { mutateAsync: importCities, isPending: isImportPending, error: importError } = useImportCities();
  const { toast } = useToast();

  // draft inputs
  const [marketDraft, setMarketDraft] = useState<ImportCityMarket>(emptyMarket);
  const [cityDraft, setCityDraft] =
    useState<Omit<ImportCity, "markets">>(emptyCity);

  const handleMarketChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setMarketDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleCityChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setCityDraft((prev) => ({ ...prev, [name]: value }));
  };

  const isMarketComplete = Object.values(marketDraft).every(
    (v) => v.trim() !== "",
  );
  const isCityComplete = Object.values(cityDraft).every((v) => v.trim() !== "");

  const handleAddMarket = () => {
    if (!isMarketComplete) return;
    setMarkets((prev) => [...prev, marketDraft]);
    setMarketDraft(emptyMarket);
  };

  const handleRemoveMarket = (index: number) => {
    setMarkets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCity = () => {
    if (!isCityComplete || markets.length === 0) return;

    const newCity: ImportCity = {
      ...cityDraft,
      markets,
    };

    setCities((prev) => [...prev, newCity]);

    // reset for the next city
    setCityDraft(emptyCity);
    setMarkets([]);
  };

  const handleRemoveCity = (index: number) => {
    setCities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (cities.length === 0) return;

    try {
      const res = await importCities(cities);

      if (res.status === 200 || res.status === 201) {
        toast({
          title: "Success",
          description: "Cities imported successfully",
          variant: "success",
        });

        // reset everything on success
        setCities([]);
        setMarkets([]);
        setMarketDraft(emptyMarket);
        setCityDraft(emptyCity);
        onSuccess();
      } else {
        toast({
          title: "Warning",
          description: "Something went wrong",
          variant: "warning",
        });
      }
    } catch (error) {
      const err = error as AxiosError;

      toast({
        variant: "danger",
        title: "Error",
        description: err.message || "Something went wrong",
        duration: 2000,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset className="border border-(--table-border) px-4 rounded-md pb-3">
        <legend className="text-sm font-medium text-(--muted)">
          Market Details
        </legend>
        <Input
          input_type="text"
          element="input"
          placeholder="Enter Market name"
          tag="Market Name"
          name="name"
          value={marketDraft.name}
          handler={handleMarketChange}
          required
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter Market category"
          tag="Market Category"
          name="category"
          value={marketDraft.category}
          handler={handleMarketChange}
          required
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter Market address"
          tag="Market Address"
          name="address"
          value={marketDraft.address}
          handler={handleMarketChange}
          required
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter Market amap link"
          tag="Amap Link"
          name="amap"
          value={marketDraft.amap}
          handler={handleMarketChange}
          required
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter Market apple map link"
          tag="Apple Map Link"
          name="appleMap"
          value={marketDraft.appleMap}
          handler={handleMarketChange}
          required
        />
        <Button
          type="button"
          onClick={handleAddMarket}
          disabled={!isMarketComplete}
        >
          Add Market
        </Button>

        {/* markets queued for the current city */}
        {markets.length > 0 && (
          <ul className="space-y-1 pt-2">
            {markets.map((m, i) => (
              <li
                key={i}
                className="flex justify-between items-center text-sm bg-gray-100 rounded px-2 py-1"
              >
                <span>
                  {m.name} — {m.category}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveMarket(i)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <fieldset className="border border-(--table-border) px-4 rounded-md pb-3">
        <legend className="text-sm font-medium text-(--muted)">
          City Details
        </legend>
        <Input
          input_type="text"
          element="input"
          placeholder="Enter City name"
          tag="City Name"
          name="city"
          value={cityDraft.city}
          handler={handleCityChange}
          required
        />
        <Input
          input_type="text"
          element="input"
          placeholder="Enter Province name"
          tag="Province Name"
          name="province"
          value={cityDraft.province}
          handler={handleCityChange}
          required
        />

        <p className="text-xs text-gray-500 pb-3">
          {markets.length} market(s) will be attached to this city.
        </p>

        <Button
          type="button"
          onClick={handleAddCity}
          disabled={!isCityComplete || markets.length === 0}
        >
          Add City
        </Button>
      </fieldset>

      {cities.length > 0 && (
        <div className="border border-(--table-border) rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Cities Ready to Submit</h3>
          <ul className="space-y-2">
            {cities.map((c, i) => (
              <li
                key={i}
                className="flex justify-between items-start text-sm bg-gray-100 rounded px-2 py-1"
              >
                <span>
                  {c.city}, {c.province} — {c.markets.length} market(s)
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveCity(i)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button type="submit" primary disabled={cities.length === 0}>
        Submit All Cities
      </Button>
    </form>
  );
};

export default ImportCities;
