import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
  title: {
    default: "Analytics",
    template: "%s | Dashboard | Merchant Back Office",
  },
};

const AnalyticsLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default AnalyticsLayout
