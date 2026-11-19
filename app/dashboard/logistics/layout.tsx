import React from 'react'

export const metadata = {
  title: "Logistics",
};

const LogLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default LogLayout
