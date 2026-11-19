import React from 'react'

export const metadata = {
  title: "Bales",
};

const BaleLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default BaleLayout
