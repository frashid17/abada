"use client";

type UserCellProps = {
  name: string;
  email?: string | null;
};

export function UserCell({ name, email }: UserCellProps) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-foreground">{name}</p>
      {email && email !== name ? (
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      ) : null}
    </div>
  );
}
