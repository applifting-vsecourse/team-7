import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelPendingEmailChange,
  pendingEmailChangeQueryOptions,
} from "@/features/settings/api/pendingEmailChangeQueryOptions";

export function usePendingEmailChange(userId: string) {
  const client = useQueryClient();
  const options = pendingEmailChangeQueryOptions(userId);
  const query = useQuery(options);
  const cancel = useMutation({
    mutationFn: cancelPendingEmailChange,
    onSettled: () => client.invalidateQueries({ queryKey: options.queryKey }),
  });
  return { query, cancel };
}
