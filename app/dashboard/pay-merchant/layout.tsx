import React from 'react'

export const metadata = {
  title: "Pay Merchant",
};

const PayMerchantLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default PayMerchantLayout
