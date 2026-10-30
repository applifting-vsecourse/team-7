import { Avatar } from "@heroui/react";

import { DogIcon } from "@/components/DogIcon";

import { dogAvatarUrl } from "@/features/dogs/api/dogAvatarUrl";
import type { Dog } from "@/features/dogs/api/dogsQueryOptions";

export function DogAvatar({
  dog,
  className = "size-9",
}: {
  dog: Dog;
  className?: string;
}) {
  return (
    <Avatar className={`shrink-0 ${className}`} aria-hidden="true">
      <Avatar.Image
        src={dogAvatarUrl(dog)}
        alt=""
        crossOrigin="use-credentials"
        className="object-cover"
      />
      <Avatar.Fallback>
        <DogIcon className="size-5 text-accent" />
      </Avatar.Fallback>
    </Avatar>
  );
}
