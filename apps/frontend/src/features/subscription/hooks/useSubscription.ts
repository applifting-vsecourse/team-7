import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { useSession } from "@/features/auth/hooks/useSession";
import { subscriptionQueryOptions } from "@/features/settings/api/subscriptionQueryOptions";
import { plusOfferAtom } from "@/features/subscription/atoms/plusOfferAtom";
export function useSubscription() {
  const { user } = useSession();
  return useQuery(subscriptionQueryOptions(user?.id));
}
export function usePlusOffer() {
  return useSetAtom(plusOfferAtom);
}
