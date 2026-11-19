import React, { Suspense } from 'react'
import { RiLoader5Fill } from 'react-icons/ri';

export const metadata = {
  title: "Exchange Rates",
};

const RatesLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center flex-col">
          <RiLoader5Fill size={48} className="text-(--primary) animate-spin" />
          Loading rates...
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

export default RatesLayout