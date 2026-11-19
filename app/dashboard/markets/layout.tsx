import React from 'react'

export const metadata = {
  title: "Markets",
};

const MarketLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default MarketLayout
