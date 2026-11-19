"use client";

import { SupplierVerificationFindings } from '@/types/types';
import React, { useState } from 'react'

type Props = {
  verificationId: number;
}

const UpdateFindings = ({ verificationId }: Props) => {
  const [findings, setFindings] = useState<SupplierVerificationFindings>({});

  return (
    <div>UpdateFindings</div>
  )
}

export default UpdateFindings