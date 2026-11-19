import React from 'react'

export const metadata = {
  title: "Customers",
};

const CustomerLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default CustomerLayout
