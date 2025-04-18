import { Redirect } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "./store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

// Define valid redirect paths
type RedirectPath = "/login" | "/portal";

export default function Index() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<RedirectPath>("/login");

  // Check if we need to show PIN verification screen
  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const pinLoginEnabled = await AsyncStorage.getItem("pinLoginEnabled");
        const userPin = await AsyncStorage.getItem("userPin");
        
        console.log("ROOT INDEX: PIN status check:", {
          isAuthenticated,
          pinLoginEnabled,
          hasPin: !!userPin
        });

        // ALWAYS redirect to login first - let the login page handle PIN and navigation
        setRedirectTarget("/login");
        setShouldRedirect(true);

        /* DISABLE ALL AUTOMATIC NAVIGATION TO PORTAL
        if (isAuthenticated) {
          // User is authenticated - determine if we should go to login for PIN or to portal
          if (pinLoginEnabled === "true" && userPin) {
            // PIN is enabled and exists - go to login for verification
            setRedirectTarget("/login");
          } else {
            // No PIN setup - go directly to portal
            setRedirectTarget("/portal");
          }
        } else {
          // Not authenticated - always go to login
          setRedirectTarget("/login");
        }
        */
      } catch (error) {
        console.error("ROOT INDEX: Error checking PIN status:", error);
        // Default to login on error
        setRedirectTarget("/login");
        setShouldRedirect(true);
      }
    };

    checkPinStatus();
  }, [isAuthenticated]);

  // Don't redirect until we've checked PIN status
  if (!shouldRedirect) {
    return null;
  }

  return <Redirect href={redirectTarget} />;
}
