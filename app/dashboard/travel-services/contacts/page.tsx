"use client";

import {
  useContactPersons,
  useCreateContactPerson,
  usePatchContactPerson,
} from "@/api/travel";
import MyModal from "@/components/dashboard/Modal";
import { ActionDropdown, Button, Input } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table/TableWrapper";
import { useToast } from "@/components/ui/toast/ToastContext";
import { useCanCreate, useCanDelete, useCanManage, useCanUpdate, useCanView } from "@/hooks/use-can";
import type { ContactPerson, CreateContactPersonBody } from "@/types/travel";
import Link from "next/link";
import { useState } from "react";
import { RiAddFill, RiMore2Fill } from "react-icons/ri";

const emptyCreate: CreateContactPersonBody = {
  name: "",
  phone: "",
  email: "",
  wechat: "",
  whatsapp: "",
};

function normalizeOptional(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

export default function TravelContactsPage() {
  const { toast } = useToast();
  const { data: contacts, isPending } = useContactPersons();
  const createMut = useCreateContactPerson();
  const patchMut = usePatchContactPerson();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyCreate);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ContactPerson | null>(null);
  const [editForm, setEditForm] = useState<CreateContactPersonBody>(emptyCreate);

  const openEdit = (c: ContactPerson) => {
    setEditing(c);
    setEditForm({
      name: c.name,
      phone: c.phone ?? "",
      email: c.email ?? "",
      wechat: c.wechat ?? "",
      whatsapp: c.whatsapp ?? "",
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMut.mutateAsync({
        name: form.name.trim(),
        phone: normalizeOptional(form.phone ?? ""),
        email: normalizeOptional(form.email ?? ""),
        wechat: normalizeOptional(form.wechat ?? ""),
        whatsapp: normalizeOptional(form.whatsapp ?? ""),
      });
      toast({ title: "Contact created", description: "", variant: "success" });
      setAddOpen(false);
      setForm(emptyCreate);
    } catch {
      toast({
        title: "Failed to create contact",
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
        id: editing.id,
        body: {
          name: editForm.name.trim(),
          phone: normalizeOptional(editForm.phone ?? ""),
          email: normalizeOptional(editForm.email ?? ""),
          wechat: normalizeOptional(editForm.wechat ?? ""),
          whatsapp: normalizeOptional(editForm.whatsapp ?? ""),
        },
      });
      toast({ title: "Contact updated", description: "", variant: "success" });
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

  // Permissions
  const canUpdate = useCanUpdate("travel");
  const canCreate = useCanCreate("travel");

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contact persons</h2>
          <p className="mt-1 text-sm text-(--muted)">
            Reusable contacts for travel catalog —{" "}
            <Link
              href="/dashboard/travel-services"
              className="text-sky-600 underline underline-offset-2"
            >
              Catalog
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
        {
          canCreate &&
          <Button primary onClick={() => setAddOpen(true)} className="gap-1">
            <RiAddFill />
            Add contact
          </Button>
        }
      </div>

      <Table aria-label="Contact persons">
        <TableHeader>
          <TableRow>
            <TableColumn>Name</TableColumn>
            <TableColumn>Phone</TableColumn>
            <TableColumn>Email</TableColumn>
            <TableColumn>WeChat</TableColumn>
            <TableColumn>WhatsApp</TableColumn>
            <TableColumn></TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody isLoading={isPending}>
          {(contacts ?? []).map((c) => (
            <TableRow key={c.id} className="bg-(--card)">
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.phone ?? "—"}</TableCell>
              <TableCell>{c.email ?? "—"}</TableCell>
              <TableCell>{c.wechat ?? "—"}</TableCell>
              <TableCell>{c.whatsapp ?? "—"}</TableCell>
              <TableCell>
                <ActionDropdown
                  actions={[
                    ...(canUpdate ? [{ label: "Edit", onClick: () => openEdit(c) }] : [])
                  ]}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <MyModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add contact person"
        modalStyle="w-[90%] max-w-lg max-h-[90vh] bg-(--card) rounded-2xl flex flex-col border border-(--table-border)"
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            element="input"
            name="name"
            value={form.name}
            handler={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Name"
            required
          />
          <Input
            element="input"
            name="phone"
            value={form.phone ?? ""}
            handler={(e) =>
              setForm((f) => ({ ...f, phone: e.target.value }))
            }
            placeholder="Phone"
          />
          <Input
            element="input"
            name="email"
            value={form.email ?? ""}
            handler={(e) =>
              setForm((f) => ({ ...f, email: e.target.value }))
            }
            placeholder="Email"
          />
          <Input
            element="input"
            name="wechat"
            value={form.wechat ?? ""}
            handler={(e) =>
              setForm((f) => ({ ...f, wechat: e.target.value }))
            }
            placeholder="WeChat"
          />
          <Input
            element="input"
            name="whatsapp"
            value={form.whatsapp ?? ""}
            handler={(e) =>
              setForm((f) => ({ ...f, whatsapp: e.target.value }))
            }
            placeholder="WhatsApp"
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
        title="Edit contact"
        modalStyle="w-[90%] max-w-lg max-h-[90vh] bg-(--card) rounded-2xl flex flex-col border border-(--table-border)"
      >
        <form onSubmit={handlePatch} className="space-y-3">
          <Input
            element="input"
            name="name"
            value={editForm.name}
            handler={(e) =>
              setEditForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Name"
            required
          />
          <Input
            element="input"
            name="phone"
            value={editForm.phone ?? ""}
            handler={(e) =>
              setEditForm((f) => ({ ...f, phone: e.target.value }))
            }
            placeholder="Phone"
          />
          <Input
            element="input"
            name="email"
            value={editForm.email ?? ""}
            handler={(e) =>
              setEditForm((f) => ({ ...f, email: e.target.value }))
            }
            placeholder="Email"
          />
          <Input
            element="input"
            name="wechat"
            value={editForm.wechat ?? ""}
            handler={(e) =>
              setEditForm((f) => ({ ...f, wechat: e.target.value }))
            }
            placeholder="WeChat"
          />
          <Input
            element="input"
            name="whatsapp"
            value={editForm.whatsapp ?? ""}
            handler={(e) =>
              setEditForm((f) => ({ ...f, whatsapp: e.target.value }))
            }
            placeholder="WhatsApp"
          />
          <Button primary type="submit" isLoading={patchMut.isPending}>
            Save
          </Button>
        </form>
      </MyModal>
    </>
  );
}
