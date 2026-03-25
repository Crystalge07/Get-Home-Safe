import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useMapStore } from '@/store/useMapStore';
import { useState } from 'react';

/** Mock trusted contacts – in a real app these would come from the backend */
const INITIAL_CONTACTS = [
  { id: '1', name: 'Alex', phone: '+1 555 0100' },
  { id: '2', name: 'Jordan', phone: '+1 555 0101' },
  { id: '3', name: 'Sam', phone: '+1 555 0102' },
];

const WalkMeHomePanel = () => {
  const {
    walkMeHomePanelOpen,
    setWalkMeHomePanelOpen,
    setWalkMeHome,
    walkMeHomeActive,
  } = useMapStore();
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrimaryAction = () => {
    if (walkMeHomeActive) {
      setWalkMeHome(false);
      setWalkMeHomePanelOpen(false);
      return;
    }
    if (selectedIds.size === 0) return;
    setWalkMeHome(true);
    setWalkMeHomePanelOpen(false);
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const addContact = () => {
    const name = newName.trim();
    const phone = newPhone.trim();
    if (!name || !phone) return;
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setContacts((prev) => [{ id, name, phone }, ...prev]);
    setNewName('');
    setNewPhone('');
  };

  return (
    <Dialog open={walkMeHomePanelOpen} onOpenChange={setWalkMeHomePanelOpen}>
      <DialogContent className="border-border bg-card text-card-foreground shadow-xl sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Walk Me Home</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select trusted contacts to share your live location with during your walk. They’ll be able to see you on the map until you arrive.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trusted contacts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="w-full px-3 py-2 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Phone"
              className="w-full px-3 py-2 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>
          <button
            type="button"
            onClick={addContact}
            disabled={!newName.trim() || !newPhone.trim()}
            className="w-full py-2 bg-secondary text-foreground rounded-xl text-sm font-medium transition-all duration-200 hover:bg-secondary/80 disabled:opacity-50 disabled:pointer-events-none"
          >
            Add Contact
          </button>
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li key={c.id}>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 hover:bg-secondary/80 transition-colors">
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleContact(c.id)}
                      className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.phone}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeContact(c.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Remove ${c.name}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={!walkMeHomeActive && selectedIds.size === 0}
            className="w-full py-2.5 bg-secondary text-foreground rounded-xl text-sm font-medium transition-all duration-200 hover:bg-secondary/80 disabled:opacity-50 disabled:pointer-events-none"
          >
            {walkMeHomeActive ? 'Unshare my Location' : 'Share my Location'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalkMeHomePanel;
