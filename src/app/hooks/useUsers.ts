import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { approvalService } from "../services/approvalService";
import { userService } from "../services/userService";

export const useUsers = (filters: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["users", filters],
    queryFn: async () => {
      return await approvalService.getApprovals();
    },
  });
};

export const useUserDetails = (id: string) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const users = await userService.getUsers();
      return users.find(u => u.id === id);
    },
    enabled: !!id,
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: "approved" | "rejected" | "blocked" | "pending_review"; reason: string }) => {
      return await approvalService.updateApprovalStatus(id, status, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useVerifyEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: "approved" | "rejected" | "blocked" | "pending_review"; reason: string }) => {
      return await approvalService.updateApprovalStatus(id, status, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
