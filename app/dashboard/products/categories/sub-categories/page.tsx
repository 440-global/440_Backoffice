"use client"

import { useGetSubCategories } from '@/api/product'
import MyModal from '@/components/dashboard/Modal'
import AddSubCategory from '@/components/products/subcategory/AddSubCategory'
import { ParentCategoryName } from '@/components/products/subcategory/ParentCategoryName'
import ViewSubCategory from '@/components/products/subcategory/ViewSubCategory'
import { ActionDropdown, Button } from '@/components/ui'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TablePagination, TableRow } from '@/components/ui/table/TableWrapper'
import { SubCategoryDetails } from '@/types/types'
import React, { useEffect, useMemo, useState } from 'react'
import { RiAddFill } from 'react-icons/ri'

const SubCategories = () => {
  // Fetching the categorys data
  const { data: getSubCategories = [], isPending: isgetSubCategoriesLoading, error } = useGetSubCategories();

  useEffect(() => {
    console.log(getSubCategories);
  }, [getSubCategories]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategoryDetails | null>(null);
  const [modalType, setModalType] = useState<'view' | 'edit' | null>(null);

  const [query, setQuery] = useState("");
  const filteredData: SubCategoryDetails[] = useMemo(() => {
    if (!query) return getSubCategories;

    if (!getSubCategories.length) return [];

    type Row = typeof getSubCategories[number];

    const searchableKeys = (Object.keys(getSubCategories[0]) as (keyof Row)[])
      .filter((key) => typeof getSubCategories[0][key] === "string");

    return getSubCategories.filter((row: Row) =>
      searchableKeys.some((key) =>
        String(row[key]).toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [query, getSubCategories]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);

  const paginatedData = filteredData.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleFilter = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setRowsPerPage(size);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Sub-Categories</h3>
        <Button primary className='flex items-center gap-1' onClick={() => setAddModalOpen(true)}>
          <RiAddFill className='font-bold' />
          Add Sub-Category
        </Button>
      </div>

      {/* Categories Table */}
      <Table aria-label='Sub-Category Table' filterable onFilter={handleFilter} pageSize={rowsPerPage} onPageSizeChange={handlePageSizeChange}>
        <TableHeader>
          <TableRow>
            <TableColumn>Name</TableColumn>
            <TableColumn>Parent Category</TableColumn>
            <TableColumn>Category Slug</TableColumn>
            <TableColumn>Description</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isgetSubCategoriesLoading}>
          {
            paginatedData.map((category, index) => (
              <TableRow className='bg-(--card)' key={index}>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <ParentCategoryName id={category.categoryId} />
                </TableCell>
                <TableCell>
                  {
                    category.slug == null ?
                      <span className='text-(--muted)'>No slug</span> : category.slug
                  }
                </TableCell>
                <TableCell>
                  <span>{ category.description }</span>
                </TableCell>
                <TableCell>
                  <ActionDropdown
                    actions={[
                      {
                        label: "View",
                        onClick: () => {
                          setSelectedSubCategory(category);
                          setModalType('view');
                        },
                      },
                      {
                        label: "Edit",
                        onClick: () => {
                          setSelectedSubCategory(category);
                          setModalType('edit');
                        },
                      }
                    ]}
                    position={(rect) => ({
                      top: rect.bottom,
                      left: rect.left - 60
                    })}
                  />
                </TableCell>
              </TableRow>

            ))
          }
        </TableBody>
      </Table>
      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        startIndex={startIndex + 1}
        endIndex={endIndex}
        totalItems={filteredData.length}
        itemLabel='sub-categories'
      />

      {selectedSubCategory && modalType === 'view' && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedSubCategory(null)}
          title="Sub-Category Details"
        >
          <ViewSubCategory category={selectedSubCategory} />
        </MyModal>
      )}

      {selectedSubCategory && modalType === 'edit' && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedSubCategory(null)}
          title="Edit Category"
        >
          Hello
          {/* <EditCategory category={selectedSubCategory} /> */}
        </MyModal>
      )}

      {/* Add category Modal */}
      <MyModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(!addModalOpen)}
        title='Add Sub Category'
      >
        <AddSubCategory />
      </MyModal>
    </>
  )
}

export default SubCategories
