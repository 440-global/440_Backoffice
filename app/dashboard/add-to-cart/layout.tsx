import React from 'react'

export const metadata = {
  title: "Customer Cart",
};

const CartLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default CartLayout
