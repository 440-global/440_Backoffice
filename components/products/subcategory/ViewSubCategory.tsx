"use client"
import { useGetProductTypes } from '@/api/product'
import MyModal from '@/components/dashboard/Modal'
import { SubCategoryDetails, TypeDetails } from '@/types/types'
import { useState } from 'react'
import { RiAddFill, RiLoader5Fill } from 'react-icons/ri'
import AddType from '../types/AddType'
import { Button } from '@/components/ui'

type Props = {
  category: SubCategoryDetails
}

const ViewSubCategory = ({ category }: Props) => {
  const { data: catTypes, isPending: isTypePending } = useGetProductTypes(Number(category.id));
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <div className="overflow-auto">
      <div className="mb-4">
        <h3 className="text-2xl font-bold">{category.name}</h3>
        {/* <p className="text-(--muted)">{category.location}</p> */}
      </div>
      <div className="my-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xl font-bold">Product Types</h4>
          <Button primary disabled={!category.id} className='flex items-center gap-1' onClick={() => setAddModalOpen(true)}>
            <RiAddFill className='font-bold' />
            Add Types
          </Button>
        </div>
        {
          isTypePending ?
          <div className='py-20 flex justify-center items-center'>
            <RiLoader5Fill size={48} className='text-(--primary)' />
          </div>:
          <ul className='list-decimal list-inside'>
            {
              catTypes.map((cat: TypeDetails, idx: number) => (
                <li key={idx} className='py-4 border-b border-(--table-border)'>
                  { cat.name }
                </li>
              ))
            }
          </ul>
        }
      </div>

      <MyModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(!addModalOpen)}
        title='Add Product Type'
      >
        <AddType subCategoryId={Number(category.id)} />
      </MyModal>
    </div>
  )
}

export default ViewSubCategory