"use client"

import AddToCustomerCart from '@/components/customers/AddToCustomerCart';
import MyModal from '@/components/dashboard/Modal';
import { Button } from '@/components/ui';
import React, { useState } from 'react'
import { RiAddFill } from 'react-icons/ri';

type Props = {}

const AddToCart = (props: Props) => {
  const [modalType, setModalType] = useState<"add" | "view" | "edit" | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Add Customer Cart</h3>
        <Button
          primary
          className="flex items-center gap-1"
          onClick={() => setModalType("add")}
          // disabled={!supplierId}
        >
          <RiAddFill className="font-bold" />
          Add Customer Cart
        </Button>
      </div>

      {modalType === "add" && 
        <MyModal
          title="Add Customer Cart"
          onClose={() => setModalType(null)}
          isOpen={true}
        >
          <AddToCustomerCart
            onSuccess={() => setModalType(null)}
          />
        </MyModal>
      }
    </>
  );
}

export default AddToCart