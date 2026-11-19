import React from 'react'

export const metadata = {
  title: "Library",
};

const LibLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default LibLayout
