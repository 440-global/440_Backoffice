import React from 'react'

export const metadata = {
  title: "Admins",
};

const AdminsLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default AdminsLayout
