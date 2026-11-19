"use client"

import { useGetMarkets } from '@/api/market'
import MyModal from '@/components/dashboard/Modal'
import AddMarket from '@/components/markets/AddMarket'
import EditMarket from '@/components/markets/EditMarket'
import ViewMarket from '@/components/markets/ViewMarket'
import { ActionDropdown, Badge, Button, Card, Dropdown } from '@/components/ui'
import { Table, TableBody, TableCell, TableColumn, TableHeader, TablePagination, TableRow } from '@/components/ui/table/TableWrapper'
import { truncateText } from '@/lib/funcs'
import { MarketDetails } from '@/types/types'
import { useEffect, useMemo, useState } from 'react'
import { RiAddFill, RiDeleteBinLine, RiEdit2Line, RiEye2Line, RiLoader5Line, RiMore2Fill, RiStore2Fill } from 'react-icons/ri'

const Markets = () => {
  // Fetching the markets data
  const { data: markets, isPending: isGetMarketsLoading, error } = useGetMarkets();

  useEffect(() => {
    console.log(markets);
  }, [markets]);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const [selectedMarket, setSelectedMarket] = useState<MarketDetails | null>(null);
  const [modalType, setModalType] = useState<'view' | 'edit' | null>(null);
  
  const [query, setQuery] = useState("");
  
  const filteredData: MarketDetails[] = useMemo(() => {
    if (!markets) return [];

    if (!query) return markets;

    type Row = typeof markets[number];

    const searchableKeys = (Object.keys(markets[0]) as (keyof Row)[])
      .filter((key) => typeof markets[0][key] === "string");

    return markets.filter((row: Row) =>
      searchableKeys.some((key) =>
        String(row[key]).toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [query, markets]);
  
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">Markets</h3>
        <Button
          primary
          className="flex items-center gap-1"
          onClick={() => setAddModalOpen(true)}
        >
          <RiAddFill className="font-bold" />
          Add Market
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card
          className={`shadow-none ${isGetMarketsLoading ? "bg-(--elevated) animate-pulse" : "bg-(--primary)"} text-white py-6!`}
        >
          <div
            className={`p-3 w-fit rounded-xl ${isGetMarketsLoading ? "bg-(--primary)/50" : "bg-white/50"} mb-2`}
          >
            <RiStore2Fill />
          </div>
          <h1
            className={`text-sm font-medium ${
              isGetMarketsLoading ? "text-(--muted)" : "text-white/90"
            }`}
          >
            Total Markets
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isGetMarketsLoading ? "—" : (markets.length ?? 0).toLocaleString()}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-(--primary)/20 mb-2`}>
            <RiStore2Fill className="text-(--primary)" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>
            Active Markets
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isGetMarketsLoading
              ? "—"
              : (
                  markets.filter(
                    (market: MarketDetails) => market.status == true,
                  ).length ?? 0
                ).toLocaleString()}
          </p>
        </Card>
        <Card className={`shadow-none bg-(--elevated) py-6!`}>
          <div className={`p-3 w-fit rounded-xl bg-red-200 mb-2`}>
            <RiStore2Fill className="text-red-500" />
          </div>
          <h1 className={`text-sm font-medium text-(--muted)`}>
            Inactive Markets
          </h1>
          <p className={`mt-2 text-3xl font-bold tabular-nums`}>
            {isGetMarketsLoading
              ? "—"
              : (
                  markets.filter(
                    (market: MarketDetails) => market.status != true,
                  ).length ?? 0
                ).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Markets Table */}
      <Table
        aria-label="Market Table"
        filterable
        onFilter={handleFilter}
        pageSize={rowsPerPage}
        onPageSizeChange={handlePageSizeChange}
        title="All Markets"
      >
        <TableHeader>
          <TableRow>
            <TableColumn>ID</TableColumn>
            <TableColumn>Name</TableColumn>
            <TableColumn>Country</TableColumn>
            <TableColumn>Image</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isGetMarketsLoading}>
          {paginatedData.map((market) => (
            <TableRow className="bg-(--card)" key={market.id}>
              <TableCell>{market.id}</TableCell>
              <TableCell>{market.name}</TableCell>
              <TableCell>{market.country}</TableCell>
              <TableCell>
                <img
                  src={market.image}
                  alt={truncateText(market.name, 10)}
                  width={50}
                  height={50}
                  className="object-contain"
                />
              </TableCell>

              <TableCell>
                {market.status && (
                  <Badge variant="success" className="lowercase">
                    Active
                  </Badge>
                )}
              </TableCell>

              <TableCell>
                <ActionDropdown
                  actions={[
                    {
                      label: "View",
                      onClick: () => {
                        setSelectedMarket(market);
                        setModalType("view");
                      },
                    },
                    {
                      label: "Edit",
                      onClick: () => {
                        setSelectedMarket(market);
                        setModalType("edit");
                      },
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        startIndex={startIndex + 1}
        endIndex={endIndex}
        totalItems={filteredData.length}
        itemLabel="markets"
      />

      {selectedMarket && modalType === "view" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedMarket(null)}
          title="Market Details"
        >
          <ViewMarket market={selectedMarket} />
        </MyModal>
      )}

      {selectedMarket && modalType === "edit" && (
        <MyModal
          isOpen={true}
          onClose={() => setSelectedMarket(null)}
          title="Edit Market Details"
        >
          <EditMarket
            market={selectedMarket}
            onSuccess={() => setSelectedMarket(null)}
          />
        </MyModal>
      )}

      {/* Add Market Modal */}
      <MyModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(!addModalOpen)}
        title="Add Market"
      >
        <AddMarket onSuccess={() => setAddModalOpen(!addModalOpen)} />
      </MyModal>
    </>
  );
}

export default Markets
