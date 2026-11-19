import React from 'react'

export const metadata = {
  title: "Orders",
};

const OrderLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default OrderLayout
