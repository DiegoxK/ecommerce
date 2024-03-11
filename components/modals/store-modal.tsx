"use client";
import { useStoreModal } from "@/hooks/use-store-modal";
import Modal from "@/components/ui/modal";

export default function StoreModal() {
  const storeModal = useStoreModal();
  return (
    <Modal
      title="Create Store"
      description="Add a new store to manage productos and categories"
      isOpen={storeModal.isOpen}
      onClose={storeModal.onClose}
    >
      Future Create Store form
    </Modal>
  );
}
