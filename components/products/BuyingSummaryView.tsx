import type { BuyingSummary } from "@/types/types";

const MODE_LABEL = { DIRECT: "Direct purchase", POOL: "Pooled purchase" } as const;

/**
 * How a product can be bought, as products and bales both show it. A product that never had purchase
 * options saved has none, and a mode that is switched off has no limits to show.
 */
const BuyingSummaryView = ({ buying }: { buying: BuyingSummary | null | undefined }) => (
  <div className="my-4">
    <h4 className="text-xl font-bold">Purchase Options</h4>
    {buying == null ? (
      <p className="text-sm text-(--muted) mt-1">
        No purchase options have been saved for this product, so it is sold on the default rules.
      </p>
    ) : (
      <>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <h4 className="text-lg font-bold">Modes</h4>
            {buying.modes.map((mode) => (
              <span className="text-xs text-(--muted) mr-2" key={mode}>
                {MODE_LABEL[mode]}
              </span>
            ))}
          </div>
          <div>
            <h4 className="text-lg font-bold">Default Mode</h4>
            <span className="text-xs text-(--muted) mr-2">{MODE_LABEL[buying.defaultMode]}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <h4 className="text-lg font-bold">Direct Purchase</h4>
            {buying.direct ? (
              <ul>
                <li className="text-sm">Minimum quantity: {buying.direct.minQty}</li>
                <li className="text-sm">Maximum quantity: {buying.direct.maxQty ?? "no limit"}</li>
              </ul>
            ) : (
              <p className="text-sm text-(--muted)">Switched off</p>
            )}
          </div>
          <div>
            <h4 className="text-lg font-bold">Pooled Purchase</h4>
            {buying.pool ? (
              <ul>
                <li className="text-sm">Minimum slots: {buying.pool.minSlotsPerBuyer}</li>
                <li className="text-sm">Maximum slots: {buying.pool.maxSlotsPerBuyer ?? "no limit"}</li>
              </ul>
            ) : (
              <p className="text-sm text-(--muted)">Switched off</p>
            )}
          </div>
        </div>
      </>
    )}
  </div>
);

export default BuyingSummaryView;
