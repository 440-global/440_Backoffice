import React from 'react'

export const metadata = {
  title: "Raw Data",
};

const RawLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default RawLayout
