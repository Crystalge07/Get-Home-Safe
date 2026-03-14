import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useMapStore } from '@/store/useMapStore';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';

/** Mock trusted contacts – in a real app these would come from the backend */
const MOCK_CONTACTS = [
  { id: '1', name: 'Alex', phone: '+1 555 0100' },
  { id: '2', name: 'Jordan', phone: '+1 555 0101' },
  { id: '3', name: 'Sam', phone: '+1 555 0102' },
];

const WalkMeHomePanel = () => {
  const {
    walkMeHomePanelOpen,
    setWalkMeHomePanelOpen,
    setWalkMeHome,
  } = useMapStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleStartWalk = () => {
    setWalkMeHome(true);
    setWalkMeHomePanelOpen(false);
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
          <ul className="space-y-2">
            {MOCK_CONTACTS.map((c) => (
              <li key={c.id}>
                <label className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 cursor-pointer hover:bg-secondary/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleContact(c.id)}
                    className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            <UserPlus className="inline w-3.5 h-3.5 mr-1" />
            Add more contacts in Settings.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={handleStartWalk}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
          >
            Start Walk
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalkMeHomePanel;
