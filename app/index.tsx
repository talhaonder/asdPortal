import { Redirect } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "./store";

export default function Index() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  return isAuthenticated ? <Redirect href="/portal" /> : <Redirect href="/login" />;
}
