import { Dialog, DialogPanel } from "@headlessui/react";
import { motion } from "framer-motion";
import { RiCloseFill } from "react-icons/ri";

type DialogType = {
  isOpen: boolean;
  onClose: () => void;
  onXClose?: () => void;
  children: React.ReactNode;
  title?: string | React.ReactNode;
  modalStyle?: string;
}

export default function MyModal({ isOpen, onClose, onXClose, children, title, modalStyle }: DialogType) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50 h-screen">
      <div className="fixed inset-0 bg-black/30" />
      <motion.div 
        initial={{ opacity: 0, x: 100 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: .5 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed inset-0 flex md:justify-end justify-center items-center"
      >
        <DialogPanel className={`${!modalStyle ? "w-[90%] md:w-1/3 h-[80vh] md:h-full bg-(--card) rounded-2xl md:rounded-l-2xl md:rounded-r-none flex flex-col" : modalStyle}`}>
          <div className={`flex ${!title ? 'justify-end' : 'justify-between' } items-center p-4 border-b border-b-(--table-border)`}>
            {
              typeof title == 'string' ?
              <h1 className="text-xl font-bold">{ title }</h1> : 
              title
            }
            <button type="button" onClick={onXClose ? onXClose : onClose} aria-label="Close" className="cursor-pointer">
              <RiCloseFill size={24} />
            </button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            {children}
          </div>
        </DialogPanel>
      </motion.div>
    </Dialog>
  );
}
