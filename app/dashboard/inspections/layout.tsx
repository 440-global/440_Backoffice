import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
  title: "Inspections",
};

type Props = {
  children: React.ReactNode
}

const InspectionLayout = ({ children }: Props) => {
  return (
    <div>{ children }</div>
  )
}

export default InspectionLayout