import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useModules } from "./useModules";
import { useProgress } from "./useProgress";

export const useDataRefresher = () => {
  const { user } = useAuth();
  const { loadModules } = useModules();
  const { loadProgress } = useProgress();

  useEffect(() => {
    if (user) {
      const authHeaders = useAuth.getState().getAuthHeaders();
      loadModules(authHeaders);
      loadProgress(user.id, authHeaders);
    }
  }, [user, loadModules, loadProgress]);
};
