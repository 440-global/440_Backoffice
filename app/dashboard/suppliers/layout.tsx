import React from 'react'

export const metadata = {
  title: "Suppliers",
};

const SupplierLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default SupplierLayout
