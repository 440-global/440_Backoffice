"use client"

import { useGetCategories } from '@/api/product'
import MyModal from '@/components/dashboard/Modal'
import AddCategory from '@/components/products/category/AddCategory'
import EditCategory from '@/components/products/category/EditCategory'
import ViewCategory from '@/components/products/category/ViewCategory'
import { ActionDropdown, Button } from '@/components/ui'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TablePagination, TableRow } from '@/components/ui/table/TableWrapper'
import { useCanCreate, useCanDelete, useCanManage, useCanUpdate, useCanView } from '@/hooks/use-can'
import { CategoryDetails } from '@/types/types'
import React, { useEffect, useMemo, useState } from 'react'
import { RiAddFill } from 'react-icons/ri'

const Categories = () => {
  // Fetching the categorys data
  const { data: getCategories = [], isPending: isGetCategoriesLoading, error } = useGetCategories();

  useEffect(() => {
    console.log(getCategories);
  }, [getCategories]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [addModalOpen, setAddModalOpen] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState<CategoryDetails | null>(null);
  const [modalType, setModalType] = useState<'view' | 'edit' | null>(null);

  const [query, setQuery] = useState("");
  const filteredData: CategoryDetails[] = useMemo(() => {
    if (!query) return getCategories;

    if (!getCategories.length) return [];

    type Row = typeof getCategories[number];

    const searchableKeys = (Object.keys(getCategories[0]) as (keyof Row)[])
      .filter((key) => typeof getCategories[0][key] === "string");

    return getCategories.filter((row: Row) =>
      searchableKeys.some((key) =>
        String(row[key]).toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [query, getCategories]);

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

  // Permissions
  const canView = useCanView("catalog");
  const canUpdate = useCanUpdate("catalog");
  const canCreate = useCanCreate("catalog");
  const canDelete = useCanDelete("catalog");
  const canManage = useCanManage("catalog");

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">Categories</h3>
        {
          canCreate && (
            <Button primary className='flex items-center gap-1' onClick={() => setAddModalOpen(true)}>
              <RiAddFill className='font-bold' />
              Add Category
            </Button>
          )
        }
      </div>

      {/* Categories Table */}
      <Table aria-label='category Table' filterable onFilter={handleFilter} pageSize={rowsPerPage} onPageSizeChange={handlePageSizeChange}>
        <TableHeader>
          <TableRow>
            <TableColumn>Name</TableColumn>
            <TableColumn>Category Slug</TableColumn>
            <TableColumn>Priority</TableColumn>
            <TableColumn>Image</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isGetCategoriesLoading}>
          {
            paginatedData.map((category, index) => (
              <TableRow className='bg-(--card)' key={index}>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  { 
                    category.categorySlug == null ? 
                    <span className='text-(--muted)'>No slug</span> : category.categorySlug 
                  }
                </TableCell>
                <TableCell>{category.priority}</TableCell>
                <TableCell>
                  <img src={category.image} alt={category.name} width={50} height={50} className='object-cover!' />
                </TableCell>
                <TableCell>
                  <ActionDropdown
                    actions={[
                      ...(canView ? [
                        {
                          label: "View",
                          onClick: () => {
                            setSelectedCategory(category);
                            setModalType('view');
                          },
                        },
                      ] : []),
                      ...(canUpdate ? [
                        {
                          label: "Edit",
                          onClick: () => {
                            setSelectedCategory(category);
                            setModalType('edit');
                          },
                        }
                      ] : [])
                    ]}
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
        itemLabel='categories'
      />

      {selectedCategory && modalType === 'view' && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedCategory(null)}
          title="Category Details"
        >
          <ViewCategory category={selectedCategory} />
        </MyModal>
      )}

      {selectedCategory && modalType === 'edit' && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedCategory(null)}
          title="Edit Category"
        >
          <EditCategory category={selectedCategory} />
        </MyModal>
      )}

      {/* Add category Modal */}
      <MyModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(!addModalOpen)}
        title='Add Category'
      >
        <AddCategory />
      </MyModal>
    </>
  )
}

export default Categories
