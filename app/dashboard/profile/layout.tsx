import React from 'react'

export const metadata = {
  title: "Admin Profile",
};

const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      { children }
    </div>
  )
}

export default ProfileLayout
