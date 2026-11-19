import { CategoryDetails } from '@/types/types'
import React from 'react'
import { Card } from '../../ui'
import { RiArchive2Fill, RiBuilding3Fill, RiMoneyCnyBoxFill } from 'react-icons/ri'

type Props = {
  category: CategoryDetails
}

const ViewCategory = ({ category }: Props) => {
  return (
    <div className="overflow-auto">
      <div className="mb-4">
        <h3 className="text-2xl font-bold">{category.name}</h3>
        {/* <p className="text-(--muted)">{category.location}</p> */}
      </div>
      <img src={category.image} alt={category.name} width={0} height={0} className="w-full! h-50! object-cover rounded-xl" />
      <div className="my-4">
        <h4 className="text-xl font-bold">Description</h4>
        <p className="text-(--muted)">{category.description}</p>
      </div>
      <div className="my-4">
        <h4 className="text-xl font-bold">Metrics</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-2">
          <Card className="bg-(--elevated)! shadow-none! ">
            <RiBuilding3Fill className="text-(--primary)" size={36} />
            <h4 className="mt-2">categorys</h4>
            <h4 className="text-2xl font-bold">25</h4>
          </Card>
          <Card className="bg-(--elevated)! shadow-none! ">
            <RiArchive2Fill className="text-amber-600 dark:text-amber-400" size={36} />
            <h4 className="mt-2">Products</h4>
            <h4 className="text-2xl font-bold">1,248</h4>
          </Card>
          <Card className="bg-(--elevated)! shadow-none! ">
            <RiMoneyCnyBoxFill className="text-(--primary)" size={36} />
            <h4 className="mt-2">Units Sold</h4>
            <h4 className="text-2xl font-bold">1044</h4>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ViewCategory