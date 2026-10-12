import { useAuth } from "../context/AuthContext";
import { getTerminology } from "../utils/terminology";

export const useTerminology = () => {
  const { user } = useAuth();
  return getTerminology(user?.institutionType);
};