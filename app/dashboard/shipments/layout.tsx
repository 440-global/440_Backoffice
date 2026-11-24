import React from 'react'

export const metadata = {
  title: "Shipments",
};

const ShipmentLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default ShipmentLayout
