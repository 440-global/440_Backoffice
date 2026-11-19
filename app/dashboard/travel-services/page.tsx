"use client";

import {
  useContactPersons,
  useCreateTravelService,
  usePatchTravelService,
  usePutTravelServiceContacts,
  useTravelServices,
} from "@/api/travel";
import MyModal from "@/components/dashboard/Modal";
import { ActionDropdown, Badge, Button, Input } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { useToast } from "@/components/ui/toast/ToastContext";
import type {
  CreateTravelServiceBody,
  TravelService,
  TravelServiceType,
} from "@/types/travel";
import { TRAVEL_SERVICE_TYPES } from "@/types/travel";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RiAddFill, RiMore2Fill } from "react-icons/ri";

const emptyCreate: CreateTravelServiceBody = {
  name: "",
  description: "",
  type: "hotel",
  price: 0,
  currency: "NGN",
  isActive: true,
  address: "",
  amap: "",
  appleMap: "",
};

export default function TravelServicesCatalogPage() {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<TravelServiceType | "">("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");

  const listParams = useMemo(
    () => ({
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(activeFilter === ""
        ? {}
        : { isActive: activeFilter === "true" }),
    }),
    [typeFilter, activeFilter]
  );

  const { data: services, isPending } = useTravelServices(listParams);
  const { data: allContacts } = useContactPersons();
  const createMut = useCreateTravelService();
  const patchMut = usePatchTravelService();
  const putContactsMut = usePutTravelServiceContacts();

  const [addOpen, setAddOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TravelService | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateTravelServiceBody>>({});

  const [contactsOpen, setContactsOpen] = useState(false);
  const [contactService, setContactService] = useState<TravelService | null>(
    null
  );
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const openEdit = (s: TravelService) => {
    setEditing(s);
    setEditForm({
      name: s.name,
      description: s.description ?? "",
      type: s.type,
      price: s.price,
      currency: s.currency,
      isActive: s.isActive,
      address: s.address ?? "",
      amap: s.amap ?? "",
      appleMap: s.appleMap ?? "",
    });
    setEditOpen(true);
  };

  const openContacts = (s: TravelService) => {
    setContactService(s);
    setSelectedContactIds(
      (s.contactPersons ?? []).map((c) => c.id).filter(Boolean)
    );
    setContactsOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMut.mutateAsync({
        ...createForm,
        description: createForm.description || null,
        address: createForm.address || null,
        amap: createForm.amap || null,
        appleMap: createForm.appleMap || null,
      });
      toast({ title: "Service created", description: "", variant: "success" });
      setAddOpen(false);
      setCreateForm(emptyCreate);
    } catch {
      toast({
        title: "Failed to create service",
        description: "",
        variant: "danger",
      });
    }
  };

  const handlePatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await patchMut.mutateAsync({
        serviceId: editing.id,
        body: {
          ...editForm,
          description:
            editForm.description === "" ? null : editForm.description,
          address: editForm.address === "" ? null : editForm.address,
          amap: editForm.amap === "" ? null : editForm.amap,
          appleMap: editForm.appleMap === "" ? null : editForm.appleMap,
        },
      });
      toast({ title: "Service updated", description: "", variant: "success" });
      setEditOpen(false);
      setEditing(null);
    } catch {
      toast({
        title: "Update failed",
        description: "",
        variant: "danger",
      });
    }
  };

  const handleSaveContacts = async () => {
    if (!contactService) return;
    try {
      await putContactsMut.mutateAsync({
        serviceId: contactService.id,
        contactPersonIds: selectedContactIds,
      });
      toast({ title: "Contacts updated", description: "", variant: "success" });
      setContactsOpen(false);
      setContactService(null);
    } catch {
      toast({
        title: "Failed to update contacts",
        description: "",
        variant: "danger",
      });
    }
  };

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Travel catalog</h2>
          <p className="mt-1 text-sm text-(--muted)">
            Hotels, SIM, VPN, flights —{" "}
            <Link
              href="/dashboard/travel-services/contacts"
              className="text-sky-600 underline underline-offset-2"
            >
              Contact persons
            </Link>
            {" · "}
            <Link
              href="/dashboard/travel-services/orders"
              className="text-sky-600 underline underline-offset-2"
            >
              Orders
            </Link>
          </p>
        </div>
        <Button primary onClick={() => setAddOpen(true)} className="gap-1">
          <RiAddFill />
          Add service
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as TravelServiceType | "")
          }
          className="rounded-xl border border-(--table-border) bg-(--card) px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {TRAVEL_SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) =>
            setActiveFilter(e.target.value as "" | "true" | "false")
          }
          className="rounded-xl border border-(--table-border) bg-(--card) px-3 py-2 text-sm"
        >
          <option value="">Active + inactive</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
      </div>

      <Table aria-label="Travel services">
        <TableHeader>
          <TableRow>
            <TableColumn>Name</TableColumn>
            <TableColumn>Type</TableColumn>
            <TableColumn>Price</TableColumn>
            <TableColumn>Active</TableColumn>
            <TableColumn>Contacts</TableColumn>
            <TableColumn></TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isPending}>
          {(services ?? []).map((s) => (
            <TableRow key={s.id} className="bg-(--card)">
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="lowercase">
                  {s.type}
                </Badge>
              </TableCell>
              <TableCell>
                {s.price} {s.currency}
              </TableCell>
              <TableCell>
                {s.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="warning">Off</Badge>
                )}
              </TableCell>
              <TableCell>{s.contactPersons?.length ?? 0}</TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    {
                      label: "Edit",
                      onClick: () => openEdit(s),
                    },
                    {
                      label: "Assign contacts",
                      onClick: () => openContacts(s),
                    },
                  ]}
                >
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-(--background)"
                  >
                    <RiMore2Fill />
                  </button>
                </ActionDropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <MyModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add travel service"
        modalStyle="w-[90%] max-w-lg max-h-[90vh] bg-(--card) rounded-2xl flex flex-col border border-(--table-border)"
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            element="input"
            name="name"
            value={createForm.name}
            handler={(e) =>
              setCreateForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Name"
            required
          />
          <Input
            element="textarea"
            name="description"
            value={createForm.description ?? ""}
            handler={(e) =>
              setCreateForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Description"
          />
          <select
            value={createForm.type}
            onChange={(e) =>
              setCreateForm((f) => ({
                ...f,
                type: e.target.value as TravelServiceType,
              }))
            }
            className="w-full rounded-lg border border-(--table-border) bg-(--card) p-3 text-sm"
          >
            {TRAVEL_SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <Input
              element="input"
              input_type="number"
              name="price"
              value={String(createForm.price)}
              handler={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  price: Number(e.target.value) || 0,
                }))
              }
              placeholder="Price"
              required
            />
            <Input
              element="input"
              name="currency"
              value={createForm.currency}
              handler={(e) =>
                setCreateForm((f) => ({ ...f, currency: e.target.value }))
              }
              placeholder="Currency"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createForm.isActive !== false}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, isActive: e.target.checked }))
              }
            />
            Active
          </label>
          <Input
            element="input"
            name="address"
            value={createForm.address ?? ""}
            handler={(e) =>
              setCreateForm((f) => ({ ...f, address: e.target.value }))
            }
            placeholder="Address"
          />
          <Input
            element="input"
            name="amap"
            value={createForm.amap ?? ""}
            handler={(e) =>
              setCreateForm((f) => ({ ...f, amap: e.target.value }))
            }
            placeholder="Amap link"
          />
          <Input
            element="input"
            name="appleMap"
            value={createForm.appleMap ?? ""}
            handler={(e) =>
              setCreateForm((f) => ({ ...f, appleMap: e.target.value }))
            }
            placeholder="Apple Maps link"
          />
          <Button primary type="submit" isLoading={createMut.isPending}>
            Create
          </Button>
        </form>
      </MyModal>

      <MyModal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        title="Edit service"
        modalStyle="w-[90%] max-w-lg max-h-[90vh] bg-(--card) rounded-2xl flex flex-col border border-(--table-border)"
      >
        <form onSubmit={handlePatch} className="space-y-3">
          <Input
            element="input"
            name="name"
            value={editForm.name ?? ""}
            handler={(e) =>
              setEditForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Name"
          />
          <Input
            element="textarea"
            name="description"
            value={(editForm.description as string) ?? ""}
            handler={(e) =>
              setEditForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Description"
          />
          <select
            value={editForm.type ?? "hotel"}
            onChange={(e) =>
              setEditForm((f) => ({
                ...f,
                type: e.target.value as TravelServiceType,
              }))
            }
            className="w-full rounded-lg border border-(--table-border) bg-(--card) p-3 text-sm"
          >
            {TRAVEL_SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <Input
              element="input"
              input_type="number"
              name="price"
              value={String(editForm.price ?? 0)}
              handler={(e) =>
                setEditForm((f) => ({
                  ...f,
                  price: Number(e.target.value) || 0,
                }))
              }
            />
            <Input
              element="input"
              name="currency"
              value={editForm.currency ?? ""}
              handler={(e) =>
                setEditForm((f) => ({ ...f, currency: e.target.value }))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editForm.isActive !== false}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, isActive: e.target.checked }))
              }
            />
            Active
          </label>
          <Input
            element="input"
            name="address"
            value={(editForm.address as string) ?? ""}
            handler={(e) =>
              setEditForm((f) => ({ ...f, address: e.target.value }))
            }
            placeholder="Address"
          />
          <Button primary type="submit" isLoading={patchMut.isPending}>
            Save changes
          </Button>
        </form>
      </MyModal>

      <MyModal
        isOpen={contactsOpen}
        onClose={() => {
          setContactsOpen(false);
          setContactService(null);
        }}
        title={contactService ? `Contacts — ${contactService.name}` : "Contacts"}
        modalStyle="w-[90%] max-w-md max-h-[90vh] bg-(--card) rounded-2xl flex flex-col border border-(--table-border)"
      >
        <p className="text-sm text-(--muted) mb-3">
          Select people to link to this service.
        </p>
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
          {(allContacts ?? []).map((c) => (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-(--table-border) px-3 py-2 hover:bg-(--background)">
                <input
                  type="checkbox"
                  checked={selectedContactIds.includes(c.id)}
                  onChange={() => toggleContact(c.id)}
                />
                <span className="text-sm">
                  <span className="font-medium">{c.name}</span>
                  {c.phone ? (
                    <span className="block text-xs text-(--muted)">
                      {c.phone}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <Button
          primary
          className="mt-4"
          onClick={handleSaveContacts}
          isLoading={putContactsMut.isPending}
        >
          Save assignment
        </Button>
      </MyModal>
    </>
  );
}
