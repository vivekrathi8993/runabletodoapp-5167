import { useState } from "react";
import { useLocation } from "wouter";
import { Crown, Loader2, UserPlus, X } from "lucide-react";
import { useInvite, useRemoveMember } from "../queries/lists";
import { Avatar } from "./avatar";
import { errorMessage } from "../lib/format";

type Person = { id: string; name: string; email: string };

export function SharePanel({
  listId,
  owner,
  members,
  role,
  meId,
}: {
  listId: string;
  owner: Person;
  members: Person[];
  role: "owner" | "editor";
  meId: string;
}) {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const invite = useInvite();
  const remove = useRemoveMember();
  const [, navigate] = useLocation();

  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold">Collaborators</h3>
        <span className="label">{members.length + 1} people</span>
      </div>

      <ul className="space-y-3">
        <li className="flex items-center gap-3">
          <Avatar name={owner.name} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {owner.name} {owner.id === meId && <span className="text-ink-soft">(you)</span>}
            </div>
            <div className="truncate text-xs text-ink-soft">{owner.email}</div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-tangerine-soft px-2 py-0.5 text-[11px] font-medium text-tangerine">
            <Crown className="h-3 w-3" /> Owner
          </span>
        </li>
        {members.map((m) => {
          const isMe = m.id === meId;
          const canRemove = role === "owner" || isMe;
          return (
            <li key={m.id} className="flex items-center gap-3">
              <Avatar name={m.name} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {m.name} {isMe && <span className="text-ink-soft">(you)</span>}
                </div>
                <div className="truncate text-xs text-ink-soft">{m.email}</div>
              </div>
              {canRemove && (
                <button
                  title={isMe ? "Leave list" : "Remove"}
                  disabled={remove.isPending}
                  onClick={() => {
                    if (isMe && !confirm("Leave this list? You'll lose access until someone invites you again.")) return;
                    remove.mutate(
                      { listId, userId: m.id },
                      { onSuccess: () => isMe && navigate("/app") },
                    );
                  }}
                  className="rounded p-1 text-ink-soft transition hover:bg-paper-2 hover:text-danger"
                >
                  {isMe ? <span className="px-1 text-xs font-medium">Leave</span> : <X className="h-4 w-4" />}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setNotice(null);
          invite.mutate(
            { listId, email },
            {
              onSuccess: (u) => {
                setEmail("");
                setNotice(`${u.name} can now view and edit this list.`);
              },
            },
          );
        }}
        className="mt-5 border-t border-line pt-4"
      >
        <span className="label mb-1.5 block">Invite by email</span>
        <div className="flex gap-2">
          <input aria-label="Collaborator email"
            type="email"
            required
            className="field py-2 text-sm"
            placeholder="teammate@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              invite.reset();
            }}
          />
          <button
            disabled={invite.isPending || !email}
            className="grid shrink-0 place-items-center rounded-md bg-ink px-3 text-card transition hover:bg-tangerine disabled:opacity-50"
            aria-label="Invite"
          >
            {invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          </button>
        </div>
        {invite.error && <p className="mt-2 text-xs text-danger">{errorMessage(invite.error)}</p>}
        {notice && !invite.error && <p className="mt-2 text-xs text-moss">{notice}</p>}
        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          Collaborators can add todos and update their status and progress. They need a Tally account.
        </p>
      </form>
    </div>
  );
}
